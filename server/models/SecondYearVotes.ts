import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for SecondYearVotes document
export interface ISecondYearVotes extends Document {
  _id: Types.ObjectId;
  urn: string;
  studentId: Types.ObjectId;
  candidateId: Types.ObjectId;
  candidateName: string;
  position: string;
  votedAt: Date;
}

// SecondYearVotes Schema
const SecondYearVotesSchema = new Schema<ISecondYearVotes>({
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
  collection: 'secondyearvotes',
  timestamps: false
});

// Compound unique index
SecondYearVotesSchema.index({ urn: 1, position: 1 }, { unique: true });

export const SecondYearVotes = mongoose.model<ISecondYearVotes>('SecondYearVotes', SecondYearVotesSchema);
