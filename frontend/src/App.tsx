import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { queryClient } from "@/lib/queryClient";
import { getAuthState, clearAuthState } from "@/lib/auth";
import { useVotingStatus } from "@/hooks/use-voting-status";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Voting from "@/pages/voting";
import Results from "@/pages/results";

type AppView = "login" | "voting" | "results";

function Header({ 
  currentView, 
  studentUrn, 
  hasVoted,
  onLogout, 
  // onViewResults, 
  onBackToVoting 
}: {
  currentView: AppView;
  studentUrn?: string;
  hasVoted?: boolean;
  onLogout: () => void;
  onViewResults: () => void;
  onBackToVoting: () => void;
}) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="https://www.adcet.ac.in/uploads/1676968661.png" alt="" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-aisa-navy" data-testid="header-title">
                AISA Voting System
              </h1>
              <p className="text-sm text-gray-600" data-testid="header-subtitle">
                AI&DS Student Association
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {currentView !== "login" && (
              <>
                {studentUrn && (
                  <span className="text-sm text-gray-600" data-testid="user-info">
                    Welcome, {studentUrn}
                  </span>
                )}
               {/* {currentView === "voting" && (
                  <Button
                    onClick={onViewResults}
                    variant="outline"
                    size="sm"
                    data-testid="button-view-results-header"
                  >
                    View Results
                  </Button>
                )} */}
                {currentView === "results" && !hasVoted && (
                  <Button
                    onClick={onBackToVoting}
                    variant="outline"
                    size="sm"
                    data-testid="button-back-to-voting-header"
                  >
                    Back to Voting
                  </Button>
                )}
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  className="text-aisa-blue hover:text-aisa-navy"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>("login");
  const [authState, setAuthStateLocal] = useState(getAuthState());
  
  // Use the voting status hook to keep track of voting state
  const { hasVoted } = useVotingStatus();

  useEffect(() => {
    const auth = getAuthState();
    console.log('Initial auth state from localStorage:', auth); // Debug log
    
    // For development: Clear auth state and always start at login
    // Remove this in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: clearing auth state and starting at login');
      clearAuthState();
      setAuthStateLocal({ isAuthenticated: false, student: null });
      setCurrentView("login");
      return;
    }
    
    setAuthStateLocal(auth);
    if (auth.isAuthenticated && auth.student) {
      console.log('Auto-logging in user:', auth.student); // Debug log
      // Always redirect to voting page first, let the voting component handle the redirect
      setCurrentView("voting");
    } else {
      console.log('No auth state found, staying on login'); // Debug log
      setCurrentView("login");
    }
  }, []);

  // Note: Removed automatic redirect to results when hasVoted changes
  // Let the voting component handle this UX instead

  const handleLoginSuccess = () => {
    const auth = getAuthState();
    console.log('Login success - auth state:', auth); // Debug log
    setAuthStateLocal(auth);
    // Always redirect to voting page first, let the voting component handle the redirect
    console.log('Redirecting to voting page'); // Debug log
    setCurrentView("voting");
  };

  const handleVoteSuccess = () => {
    // Update auth state to reflect that student has voted
    const auth = getAuthState();
    if (auth.student) {
      const updatedAuth = {
        ...auth,
        student: { ...auth.student, hasVoted: true }
      };
      setAuthStateLocal(updatedAuth);
      localStorage.setItem('aisa-auth', JSON.stringify(updatedAuth));
    }
    setCurrentView("results");
  };

  const handleLogout = () => {
    clearAuthState();
    setAuthStateLocal({ isAuthenticated: false, student: null });
    setCurrentView("login");
  };

  const handleViewResults = () => {
    setCurrentView("results");
  };

  const handleBackToVoting = () => {
    // Only allow going back to voting if student hasn't voted
    if (!hasVoted) {
      setCurrentView("voting");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        studentUrn={authState.student?.urn}
        hasVoted={hasVoted}
        onLogout={handleLogout}
        onViewResults={handleViewResults}
        onBackToVoting={handleBackToVoting}
      />
      
      {currentView === "login" && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentView === "voting" && authState.isAuthenticated && (
        <Voting onVoteSuccess={handleVoteSuccess} onNavigateToResults={handleViewResults} />
      )}
      
      {currentView === "results" && authState.isAuthenticated && (
        <Results onBackToVoting={handleBackToVoting} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
