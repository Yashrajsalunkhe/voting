import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResultsCardProps {
  position: string;
  icon: string;
  iconColor: string;
  results: Array<{
    candidateId: string; // Changed from number to string
    candidateName: string;
    voteCount: number;
  }>;
  totalVotes: number;
}

export function ResultsCard({ position, icon, iconColor, results, totalVotes }: ResultsCardProps) {
  const formatPosition = (pos: string) => {
    return pos.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const sortedResults = results.sort((a, b) => b.voteCount - a.voteCount);

  return (
    <Card className="bg-white shadow-sm border border-gray-200" data-testid={`results-card-${position}`}>
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center mr-3`}>
            <i className={`${icon} text-white text-sm`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-aisa-navy" data-testid={`position-title-${position}`}>
              {formatPosition(position)}
            </h3>
            <p className="text-sm text-gray-600" data-testid={`total-votes-${position}`}>
              {totalVotes} votes cast
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {sortedResults.map((result, index) => {
            const percentage = totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100) : 0;
            const isWinner = index === 0;
            
            return (
              <div key={result.candidateId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div 
                      className={`w-8 h-8 rounded-full ${
                        isWinner ? iconColor : 'bg-gray-400'
                      } flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                      data-testid={`candidate-avatar-${result.candidateId}`}
                    >
                      {getInitials(result.candidateName)}
                    </div>
                    <span className="font-medium text-sm truncate" data-testid={`candidate-name-result-${result.candidateId}`}>
                      {result.candidateName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div 
                      className={`font-bold text-sm ${isWinner ? 'text-aisa-navy' : 'text-gray-600'}`}
                      data-testid={`candidate-percentage-${result.candidateId}`}
                    >
                      {percentage}%
                    </div>
                    <div className="text-xs text-gray-600" data-testid={`candidate-votes-${result.candidateId}`}>
                      {result.voteCount}
                    </div>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  data-testid={`progress-bar-${result.candidateId}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
