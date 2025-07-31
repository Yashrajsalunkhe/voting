import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { type Candidate } from "@/types";

interface CandidateCardProps {
  candidate: Candidate;
  value: string;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function CandidateCard({ candidate, value, isSelected, onSelect }: CandidateCardProps) {
  const getYearColor = (year: string) => {
    switch (year) {
      case "Final Year":
        return "bg-blue-100 text-blue-800";
      case "Third Year":
        return "bg-green-100 text-green-800";
      case "Second Year":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <label
      className="cursor-pointer block"
      onClick={onSelect}
      data-testid={`candidate-card-${candidate.id}`}
    >
      <RadioGroupItem value={value} id={value} className="sr-only" />
      <Card
        className={`transition-all duration-200 ${
          isSelected
            ? "border-aisa-blue bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-aisa-blue"
        }`}
      >
        <CardContent className="p-4">
          <img
            src={candidate.imageUrl || "/placeholder-avatar.png"}
            alt={candidate.name}
            className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            data-testid={`candidate-image-${candidate.id}`}
          />
          <h4 className="text-lg font-semibold text-center text-aisa-navy mb-2" data-testid={`candidate-name-${candidate.id}`}>
            {candidate.name}
          </h4>
          <p className="text-sm text-gray-600 text-center mb-3" data-testid={`candidate-description-${candidate.id}`}>
            {candidate.description}
          </p>
          <div className="text-center">
            <Badge className={`text-xs font-medium ${getYearColor(candidate.year)}`} data-testid={`candidate-year-${candidate.id}`}>
              {candidate.year}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </label>
  );
}
