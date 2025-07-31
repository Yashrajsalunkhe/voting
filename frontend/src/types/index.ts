// Common types for the voting application

export interface Candidate {
  id: string;
  name: string;
  description: string;
  year: string;
  imageUrl?: string;
  position?: string;
}

export interface Position {
  key: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

// Position constants/enum
export const POSITIONS = {
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice-president',
  SECRETARY: 'secretary',
  TREASURER: 'treasurer',
} as const;

export interface Vote {
  positionKey: string;
  candidateId: string;
}

export interface Student {
  id: string;
  urn: string;
  name: string;
  year: string;
  hasVoted?: boolean;
}

export interface VotingStatus {
  isOpen: boolean;
  hasVoted: boolean;
  student?: Student;
}

export interface AuthState {
  isAuthenticated: boolean;
  student?: Student;
  token?: string;
}
