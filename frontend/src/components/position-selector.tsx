import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Candidate } from "@/types";

interface PositionSelectorProps {
  position: {
    key: string;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    description: string;
  };
  candidates: Candidate[];
  selectedCandidate?: Candidate;
  onSelect: (candidate: Candidate) => void;
  isComplete: boolean;
}

export function PositionSelector({ 
  position, 
  candidates, 
  selectedCandidate, 
  onSelect, 
  isComplete 
}: PositionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const IconComponent = position.icon;

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

  const handleCandidateSelect = (candidate: Candidate) => {
    onSelect(candidate);
    setIsOpen(false);
  };

  return (
    <Card 
      className={`mb-4 transition-all duration-300 ${
        isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200'
      }`}
      data-testid={`position-selector-${position.key}`}
    >
      <CardContent className="p-0">
        {/* Position Header Button */}
        <Button
          type="button"
          variant="ghost"
          className={`w-full p-6 h-auto flex items-center justify-between hover:bg-gray-50 ${
            isComplete ? 'text-green-700' : 'text-gray-900'
          }`}
          onClick={() => setIsOpen(!isOpen)}
          data-testid={`button-toggle-${position.key}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${position.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="text-white" size={20} />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-semibold" data-testid={`position-title-${position.key}`}>
                {position.title}
              </h3>
              <div>
                {selectedCandidate ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {selectedCandidate.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Tap to select candidate
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isComplete && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </Button>

        {/* Candidates Dropdown */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-200 max-h-80 overflow-y-auto">
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3" data-testid={`position-description-${position.key}`}>
                {position.description}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {candidates.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No candidates available for this position
                </div>
              ) : (
                candidates.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      className={`w-full p-4 text-left hover:bg-blue-50 transition-colors duration-200 ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleCandidateSelect(candidate)}
                      data-testid={`candidate-option-${candidate.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={candidate.imageUrl || "/placeholder-avatar.png"}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          data-testid={`candidate-image-${candidate.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate" data-testid={`candidate-name-${candidate.id}`}>
                              {candidate.name}
                            </h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2" data-testid={`candidate-description-${candidate.id}`}>
                            {candidate.description || `Candidate for ${position.title}`}
                          </p>
                          <Badge 
                            className={`text-xs font-medium ${getYearColor(candidate.year)}`}
                            data-testid={`candidate-year-${candidate.id}`}
                          >
                            {candidate.year}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}