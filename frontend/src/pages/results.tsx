import { useQuery } from "@tanstack/react-query";
import { BarChart, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsCard } from "@/components/results-card";
import { getAuthState } from "@/lib/auth";
import { POSITIONS } from "@/types";

interface ResultsProps {
  onBackToVoting?: () => void;
}

interface ResultsData {
  success: boolean;
  results: Record<string, Array<{
    candidateId: string; // Changed from number to string to match server response
    candidateName: string;
    voteCount: number;
  }>>;
  statistics: {
    totalVotesByPosition: Record<string, number>;
    overallTotalVotes: number; // Now represents number of students who voted
    totalStudents: number;
    votedStudents: number; // Added: explicit count of students who voted
    turnoutPercentage: number;
    positionsCount: number;
  };
}

export default function Results({ onBackToVoting }: ResultsProps) {
  const authState = getAuthState();
  const hasVoted = authState.student?.hasVoted || false;

  const { data: resultsData, isLoading, error, dataUpdatedAt } = useQuery<ResultsData>({
    queryKey: ["/api/results"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  const lastUpdated = new Date(dataUpdatedAt).toLocaleTimeString();

  const positions = [
    {
      key: POSITIONS.PRESIDENT,
      title: "President",
      icon: "fas fa-crown",
      color: "bg-blue-600",
    },
    {
      key: POSITIONS.VICE_PRESIDENT,
      title: "Vice President",
      icon: "fas fa-user-tie",
      color: "bg-blue-500",
    },
    {
      key: POSITIONS.SECRETARY,
      title: "Secretary",
      icon: "fas fa-clipboard-list",
      color: "bg-yellow-500",
    },
    {
      key: POSITIONS.TREASURER,
      title: "Treasurer",
      icon: "fas fa-coins",
      color: "bg-green-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5C3.544 20.333 4.502 22 6.042 22z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Results</h3>
            <p className="text-gray-600 text-sm mb-4">
              Unable to connect to the server. Please check if the server is running.
            </p>
            <p className="text-gray-500 text-xs">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVotesCast = resultsData?.statistics?.overallTotalVotes || 0;
  const voterTurnout = resultsData?.statistics?.turnoutPercentage || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Mobile-First Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <BarChart className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="results-title">
            Live Results
          </h2>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
            <span>•</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
          <p className="text-gray-600 text-sm" data-testid="results-subtitle">
            Updated every 30 seconds
          </p>
        </div>

        {/* Election Summary - Mobile Optimized */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3" data-testid="election-summary-title">
              Election Overview
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600" data-testid="stat-total-votes">
                  {totalVotesCast}
                </div>
                <div className="text-xs text-gray-600">Students Voted</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600" data-testid="stat-turnout">
                  {voterTurnout}%
                </div>
                <div className="text-xs text-gray-600">Turnout</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Cards - Mobile Stack */}
        <div className="space-y-4 mb-6">
          {positions.map((position) => {
            const positionResults = resultsData?.results[position.key] || [];
            const positionTotalVotes = resultsData?.statistics?.totalVotesByPosition[position.key] || 0;

            return (
              <ResultsCard
                key={position.key}
                position={position.key}
                icon={position.icon}
                iconColor={position.color}
                results={positionResults}
                totalVotes={positionTotalVotes}
              />
            );
          })}
        </div>

        {/* Back Button - Only show if student hasn't voted and onBackToVoting is provided */}
        {!hasVoted && onBackToVoting && (
          <Card className="sticky bottom-4 shadow-lg">
            <CardContent className="p-4">
              <Button
                onClick={onBackToVoting}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                data-testid="button-back-to-voting"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Voting
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Thank you message for voted students */}
        {hasVoted && (
          <Card className="sticky bottom-4 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-green-600 font-semibold mb-2">
                ✅ Thank you for voting!
              </div>
              <p className="text-sm text-gray-600">
                Your vote has been recorded. Results will update automatically.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
