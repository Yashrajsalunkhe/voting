import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
// Position enum
export const Position = {
    PRESIDENT: "PRESIDENT",
    VICE_PRESIDENT: "VICE_PRESIDENT",
    SECRETARY: "SECRETARY",
    TREASURER: "TREASURER",
};
const studentSchema = new Schema({
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
const candidateSchema = new Schema({
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
const voteSchema = new Schema({
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
const yearVoteResponseSchema = new Schema({
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
// MongoDB Models
export const StudentModel = mongoose.model('Student', studentSchema);
export const CandidateModel = mongoose.model('Candidate', candidateSchema);
export const VoteModel = mongoose.model('Vote', voteSchema);
// Year-based vote response models
export const SecondYearVotesModel = mongoose.model('SecondYearVotes', yearVoteResponseSchema);
export const ThirdYearVotesModel = mongoose.model('ThirdYearVotes', yearVoteResponseSchema);
export const FinalYearVotesModel = mongoose.model('FinalYearVotes', yearVoteResponseSchema);
//# sourceMappingURL=schema.js.map