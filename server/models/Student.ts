import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Student document
export interface IStudent extends Document {
  _id: Types.ObjectId;
  urn: string;
  motherName: string;
  year: string;
  hasVoted: boolean;
  votedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Student Schema
const StudentSchema = new Schema<IStudent>({
  urn: {
    type: String,
    required: true,
    unique: true
  },
  motherName: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true,
    enum: ['second-year', 'third-year', 'final-year']
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'students'
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
