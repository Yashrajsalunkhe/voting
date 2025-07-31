import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/queryClient";
import { getAuthState, setAuthState } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useVotingStatus() {
  const authState = getAuthState();
  const studentId = authState.student?.id;
  const { toast } = useToast();

  const { data: votingStatusData } = useQuery({
    queryKey: ["/api/voting-status", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await apiRequest("GET", `/api/voting-status/${studentId}`);
      return response.json();
    },
    enabled: !!studentId && authState.isAuthenticated,
    refetchInterval: 10000, // Check every 10 seconds
    refetchIntervalInBackground: true,
  });

  // Update auth state if voting status changes
  useEffect(() => {
    if (votingStatusData?.success && authState.student) {
      const currentHasVoted = authState.student.hasVoted;
      const serverHasVoted = votingStatusData.hasVoted;
      
      if (currentHasVoted !== serverHasVoted) {
        const updatedAuth = {
          ...authState,
          student: { ...authState.student, hasVoted: serverHasVoted }
        };
        setAuthState(updatedAuth);
        
        // Show notification if vote was recorded
        if (serverHasVoted && !currentHasVoted) {
          toast({
            title: "Vote Recorded!",
            description: "Your vote has been successfully recorded. Redirecting to results...",
          });
          
          // Delay redirect to show the toast
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    }
  }, [votingStatusData, authState, toast]);

  return {
    hasVoted: votingStatusData?.hasVoted || authState.student?.hasVoted || false,
    isLoading: !votingStatusData && !!studentId,
  };
}
