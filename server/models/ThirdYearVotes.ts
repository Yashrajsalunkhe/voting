import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for ThirdYearVotes document
export interface IThirdYearVotes extends Document {
  _id: Types.ObjectId;
  urn: string;
  studentId: Types.ObjectId;
  candidateId: Types.ObjectId;
  candidateName: string;
  position: string;
  votedAt: Date;
}

// ThirdYearVotes Schema
const ThirdYearVotesSchema = new Schema<IThirdYearVotes>({
  urn: {
    type: String,
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER']
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'thirdyearvotes',
  timestamps: false
});

// Compound unique index
ThirdYearVotesSchema.index({ urn: 1, position: 1 }, { unique: true });

export const ThirdYearVotes = mongoose.model<IThirdYearVotes>('ThirdYearVotes', ThirdYearVotesSchema);
