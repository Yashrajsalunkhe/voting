import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, User, ClipboardList, Coins, Loader2, CheckCircle, Vote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthState, setAuthState } from "@/lib/auth";
import { useVotingStatus } from "@/hooks/use-voting-status";
import { PositionSelector } from "@/components/position-selector";
import { type Candidate, POSITIONS } from "@/types";

interface VotingProps {
  onVoteSuccess: () => void;
  onNavigateToResults: () => void;
}

interface GroupedCandidates {
  [key: string]: Candidate[];
}

export default function Voting({ onVoteSuccess, onNavigateToResults }: VotingProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, Candidate>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use the voting status hook for real-time status updates
  const { hasVoted } = useVotingStatus();

  // Check if student has already voted (using live status)
  if (hasVoted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center p-8">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You Have Already Voted!
              </h2>
              <p className="text-gray-600 mb-4">
                Thank you for participating in the AISA elections. You can view the live results below.
              </p>
              <Button 
                onClick={onNavigateToResults}
                className="bg-aisa-blue hover:bg-aisa-navy"
              >
                View Live Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: candidatesData, isLoading } = useQuery<{
    success: boolean;
    candidates: GroupedCandidates;
  }>({
    queryKey: ["/api/candidates"],
  });

  // Debug logging to check candidates data
  console.log('Candidates data:', candidatesData);
  console.log('Is loading:', isLoading);

  const submitVotesMutation = useMutation({
    mutationFn: async (votes: Array<{ candidateId: string; position: string }>) => {
      try {
        // Get fresh auth state at submission time
        const currentAuthState = getAuthState();
        const requestData = { 
          votes, 
          studentId: currentAuthState.student?.id 
        };
        console.log('Request data being sent:', requestData);
        console.log('Current auth state at submission:', currentAuthState);
        
        const response = await apiRequest("POST", "/api/votes", requestData);
        return response.json();
        return response.json();
      } catch (error: any) {
        // Parse error response for "already voted" message
        if (error.message?.includes("400")) {
          try {
            const errorText = error.message.split(": ")[1];
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || "You have already voted");
          } catch {
            throw new Error("You have already voted");
          }
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        // Immediately update auth state to reflect voting status
        const currentAuth = getAuthState();
        if (currentAuth.student) {
          const updatedAuth = {
            ...currentAuth,
            student: { ...currentAuth.student, hasVoted: true }
          };
          setAuthState(updatedAuth);
        }
        
        setShowSuccess(true);
        toast({
          title: "Vote Submitted Successfully!",
          description: "Thank you for participating in the AISA elections.",
        });
        // Invalidate results query to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/results"] });
        
        // Call the parent success handler
        onVoteSuccess();
      } else {
        toast({
          title: "Vote Submission Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      // Check if this is an "already voted" error
      if (error.message?.includes("already voted") || error.status === 400) {
        // Update auth state to reflect voting status
        const currentAuth = getAuthState();
        if (currentAuth.student) {
          const updatedAuth = {
            ...currentAuth,
            student: { ...currentAuth.student, hasVoted: true }
          };
          setAuthState(updatedAuth);
        }
        
        toast({
          title: "Already Voted",
          description: "You have already cast your vote. Thank you for participating!",
          variant: "destructive",
        });
        
        // Redirect to results
        onVoteSuccess();
      } else {
        toast({
          title: "Vote Submission Failed",
          description: error.message || "An error occurred while submitting your vote.",
          variant: "destructive",
        });
      }
    },
  });

  const positions = [
    {
      key: POSITIONS.PRESIDENT,
      title: "President",
      icon: Crown,
      color: "bg-blue-600",
      description: "Select your preferred candidate for the President position",
    },
    {
      key: POSITIONS.VICE_PRESIDENT,
      title: "Vice President", 
      icon: User,
      color: "bg-blue-500",
      description: "Select your preferred candidate for the Vice President position",
    },
    {
      key: POSITIONS.SECRETARY,
      title: "Secretary",
      icon: ClipboardList,
      color: "bg-yellow-500",
      description: "Select your preferred candidate for the Secretary position",
    },
    {
      key: POSITIONS.TREASURER,
      title: "Treasurer",
      icon: Coins,
      color: "bg-green-500",
      description: "Select your preferred candidate for the Treasurer position",
    },
  ];

  const completedPositions = Object.keys(selectedCandidates).length;
  const totalPositions = positions.length;
  const progress = (completedPositions / totalPositions) * 100;
  const canSubmit = completedPositions === totalPositions;

  const handleCandidateSelect = (position: string, candidate: Candidate) => {
    console.log('Selecting candidate:', candidate); // Debug log
    console.log('Candidate ID:', candidate.id); // Debug log
    setSelectedCandidates(prev => ({
      ...prev,
      [position]: candidate,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get fresh auth state at submission time
    const currentAuthState = getAuthState();
    
    // Debug logging
    console.log('Auth state at submission:', currentAuthState);
    console.log('Selected candidates:', selectedCandidates);
    
    if (!canSubmit) {
      toast({
        title: "Incomplete Voting",
        description: "Please select candidates for all positions before submitting.",
        variant: "destructive",
      });
      return;
    }

    const votes = Object.entries(selectedCandidates).map(([position, candidate]) => ({
      candidateId: String((candidate as any).id || (candidate as any)._id),
      position,
    }));

    console.log('Votes to submit:', votes);
    console.log('Student ID from fresh auth:', currentAuthState.student?.id);

    submitVotesMutation.mutate(votes);
  };

  const handleViewResults = () => {
    setShowSuccess(false);
    onVoteSuccess();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aisa-blue" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2" data-testid="success-title">
              Vote Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-6 text-sm" data-testid="success-message">
              Thank you for participating in the AISA elections. Your vote has been recorded securely.
            </p>
            <Button
              onClick={handleViewResults}
              className="w-full bg-aisa-blue hover:bg-aisa-navy py-3"
              data-testid="button-view-results"
            >
              <Vote className="mr-2 h-4 w-4" />
              View Live Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Mobile-First Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-aisa-blue rounded-lg flex items-center justify-center">
                <Vote className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-aisa-navy" data-testid="voting-title">
                  Cast Your Vote
                </h2>
                <p className="text-sm text-gray-600">
                  AISA Elections 2024
                </p>
              </div>
            </div>
            <Progress value={progress} className="mb-2" data-testid="voting-progress" />
            <p className="text-sm text-gray-600" data-testid="progress-text">
              {completedPositions}/{totalPositions} positions completed
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} data-testid="voting-form">
          {/* Position Selectors */}
          {positions.map((position) => {
            const candidates = candidatesData?.candidates[position.key] || [];
            console.log(`Candidates for ${position.key}:`, candidates); // Debug log
            
            return (
              <PositionSelector
                key={position.key}
                position={position}
                candidates={candidates}
                selectedCandidate={selectedCandidates[position.key]}
                onSelect={(candidate) => handleCandidateSelect(position.key, candidate)}
                isComplete={!!selectedCandidates[position.key]}
              />
            );
          })}

          {/* Submit Button */}
          <Card className="mt-6 sticky bottom-4 shadow-lg">
            <CardContent className="p-4">
              <Button
                type="submit"
                className="w-full bg-aisa-blue hover:bg-aisa-navy py-4 text-lg font-semibold"
                disabled={!canSubmit || submitVotesMutation.isPending}
                data-testid="button-submit-vote"
              >
                {submitVotesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Submit Your Vote
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center" data-testid="submit-instruction">
                {canSubmit 
                  ? "Ready to submit your vote!" 
                  : `Select candidates for ${totalPositions - completedPositions} more positions`
                }
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
