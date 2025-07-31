import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Position enum
export const Position = {
  PRESIDENT: "PRESIDENT",
  VICE_PRESIDENT: "VICE_PRESIDENT", 
  SECRETARY: "SECRETARY",
  TREASURER: "TREASURER",
} as const;

export type PositionType = typeof Position[keyof typeof Position];

// Student interface and schema
export interface IStudent extends Document {
  urn: string;
  motherName: string;
  year: 'second-year' | 'third-year' | 'final-year';
  hasVoted: boolean;
  votedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>({
  urn: { type: String, required: true, unique: true },
  motherName: { type: String, required: true },
  year: { 
    type: String, 
    required: true,
    enum: ['second-year', 'third-year', 'final-year']
  },
  hasVoted: { type: Boolean, default: false },
  votedAt: { type: Date },
}, {
  timestamps: true,
});

// Candidate interface and schema
export interface ICandidate extends Document {
  name: string;
  position: PositionType;
  description?: string;
  imageUrl?: string;
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  position: { 
    type: String, 
    required: true, 
    enum: Object.values(Position) 
  },
  description: { type: String },
  imageUrl: { type: String },
  year: { type: String, required: true },
}, {
  timestamps: true,
});

// Vote interface and schema
export interface IVote extends Document {
  studentId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  position: PositionType;
  votedAt: Date;
}

const voteSchema = new Schema<IVote>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  position: { 
    type: String, 
    required: true, 
    enum: Object.values(Position) 
  },
  votedAt: { type: Date, default: Date.now },
});

// Ensure one vote per student per position
voteSchema.index({ studentId: 1, position: 1 }, { unique: true });

// Year-based vote response interfaces and schemas
export interface IYearVoteResponse extends Document {
  urn: string;
  studentId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  candidateName: string;
  position: PositionType;
  votedAt: Date;
}

const yearVoteResponseSchema = new Schema<IYearVoteResponse>({
  urn: { type: String, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidateName: { type: String, required: true },
  position: { 
    type: String, 
    required: true, 
    enum: Object.values(Position) 
  },
  votedAt: { type: Date, default: Date.now },
});

// Ensure one vote per student per position for year-based collections
yearVoteResponseSchema.index({ urn: 1, position: 1 }, { unique: true });

// Zod validation schemas
export const insertStudentSchema = z.object({
  urn: z.string().min(1, "URN is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  year: z.enum(['second-year', 'third-year', 'final-year']),
  hasVoted: z.boolean().optional().default(false),
});

export const insertCandidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.enum([Position.PRESIDENT, Position.VICE_PRESIDENT, Position.SECRETARY, Position.TREASURER]),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  year: z.string().min(1, "Year is required"),
});

export const insertVoteSchema = z.object({
  studentId: z.string(),
  candidateId: z.string(),
  position: z.string(),
});

export const authSchema = z.object({
  urn: z.string().min(1, "URN is required"),
  motherName: z.string().min(1, "Mother's name is required"),
});

export const votingSchema = z.object({
  votes: z.array(z.object({
    candidateId: z.union([z.string(), z.number()]).transform(val => String(val)),
    position: z.string(),
  })).length(4, "Must vote for all 4 positions"),
  studentId: z.string().min(1, "Student ID is required"),
});

// Type exports
// Plain object interfaces for storage layer (without Document methods)
export interface StudentPlain {
  id: string;
  urn: string;
  motherName: string;
  year: 'second-year' | 'third-year' | 'final-year';
  hasVoted: boolean;
  votedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidatePlain {
  id: string;
  name: string;
  position: PositionType;
  description?: string;
  imageUrl?: string;
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Student = StudentPlain;
export type Candidate = CandidatePlain;
export type Vote = IVote;
export type YearVoteResponse = IYearVoteResponse;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type AuthRequest = z.infer<typeof authSchema>;
export type VotingRequest = z.infer<typeof votingSchema>;

// MongoDB Models
export const StudentModel = mongoose.model<IStudent>('Student', studentSchema);
export const CandidateModel = mongoose.model<ICandidate>('Candidate', candidateSchema);
export const VoteModel = mongoose.model<IVote>('Vote', voteSchema);

// Year-based vote response models
export const SecondYearVotesModel = mongoose.model<IYearVoteResponse>('SecondYearVotes', yearVoteResponseSchema);
export const ThirdYearVotesModel = mongoose.model<IYearVoteResponse>('ThirdYearVotes', yearVoteResponseSchema);
export const FinalYearVotesModel = mongoose.model<IYearVoteResponse>('FinalYearVotes', yearVoteResponseSchema);
