import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for FinalYearVotes document
export interface IFinalYearVotes extends Document {
  _id: Types.ObjectId;
  urn: string;
  studentId: Types.ObjectId;
  candidateId: Types.ObjectId;
  candidateName: string;
  position: string;
  votedAt: Date;
}

// FinalYearVotes Schema
const FinalYearVotesSchema = new Schema<IFinalYearVotes>({
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
  collection: 'finalyearvotes',
  timestamps: false
});

// Compound unique index
FinalYearVotesSchema.index({ urn: 1, position: 1 }, { unique: true });

export const FinalYearVotes = mongoose.model<IFinalYearVotes>('FinalYearVotes', FinalYearVotesSchema);
