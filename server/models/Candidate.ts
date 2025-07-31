import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Candidate document
export interface ICandidate extends Document {
  _id: Types.ObjectId;
  name: string;
  position: string;
  description?: string;
  imageUrl?: string;
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

// Candidate Schema
const CandidateSchema = new Schema<ICandidate>({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER']
  },
  description: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  year: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'candidates'
});

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
