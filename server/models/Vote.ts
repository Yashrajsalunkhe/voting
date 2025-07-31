import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Vote document
export interface IVote extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  candidateId: Types.ObjectId;
  position: string;
  votedAt: Date;
}

// Vote Schema
const VoteSchema = new Schema<IVote>({
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
  collection: 'votes',
  timestamps: false
});

// Compound unique index to ensure one vote per student per position
VoteSchema.index({ studentId: 1, position: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
