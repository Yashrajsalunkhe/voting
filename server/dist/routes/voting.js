import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { auditLogger, AuditLogger } from "../audit-logger";
import { votingSchema } from "../shared/schema";
const votingRoutes = Router();
// Get all candidates grouped by position
votingRoutes.get("/candidates", async (req, res) => {
    try {
        const candidates = await storage.getAllCandidates();
        // Group candidates by position
        const groupedCandidates = candidates.reduce((acc, candidate) => {
            if (!acc[candidate.position]) {
                acc[candidate.position] = [];
            }
            acc[candidate.position].push(candidate);
            return acc;
        }, {});
        res.json({
            success: true,
            candidates: groupedCandidates
        });
    }
    catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch candidates"
        });
    }
});
// Get candidates for a specific position
votingRoutes.get("/candidates/:position", async (req, res) => {
    try {
        const { position } = req.params;
        const candidates = await storage.getCandidatesByPosition(position.toUpperCase());
        res.json({
            success: true,
            position,
            candidates
        });
    }
    catch (error) {
        console.error('Error fetching candidates by position:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch candidates for position"
        });
    }
});
// Submit votes with comprehensive validation
votingRoutes.post("/submit", async (req, res) => {
    try {
        const parseResult = votingSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request data",
                errors: parseResult.error.errors
            });
        }
        const { studentId, votes } = parseResult.data;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required"
            });
        }
        // Verify student exists and get details
        const student = await storage.getStudentById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }
        // Check if student has already voted
        const hasVoted = await storage.hasStudentVoted(studentId);
        if (hasVoted) {
            auditLogger.log(AuditLogger.ACTIONS.VOTE_ATTEMPT_DUPLICATE, {
                studentId,
                urn: student.urn,
                attemptedVotes: votes.length
            }, studentId, student.urn, req.ip, req.get('User-Agent'));
            return res.status(409).json({
                success: false,
                message: "You have already voted. Each student can vote only once."
            });
        }
        // Validate that all votes are for different positions
        const positions = votes.map(vote => vote.position);
        const uniquePositions = new Set(positions);
        if (positions.length !== uniquePositions.size) {
            return res.status(400).json({
                success: false,
                message: "Cannot vote for multiple candidates in the same position"
            });
        }
        // Validate that all candidate IDs exist
        const allCandidates = await storage.getAllCandidates();
        const validCandidateIds = new Set(allCandidates.map(c => c.id.toString()));
        for (const vote of votes) {
            if (!validCandidateIds.has(vote.candidateId)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid candidate ID: ${vote.candidateId}`
                });
            }
        }
        // Submit votes to storage
        const votesToSubmit = votes.map(vote => ({
            studentId: studentId,
            candidateId: vote.candidateId,
            position: vote.position
        }));
        await storage.submitVotes(votesToSubmit);
        // Update student's voting status
        await storage.updateStudentVoteStatus(studentId);
        const submissionTime = new Date();
        // Log successful vote submission
        auditLogger.log(AuditLogger.ACTIONS.VOTE_SUBMITTED, {
            studentId,
            urn: student.urn,
            votesCount: votes.length,
            positions: votes.map(v => v.position),
            submissionTime
        }, studentId, student.urn, req.ip, req.get('User-Agent'));
        res.json({
            success: true,
            message: "Your votes have been recorded successfully",
            votedAt: submissionTime,
            votesSubmitted: votes.length
        });
    }
    catch (error) {
        auditLogger.log(AuditLogger.ACTIONS.DATABASE_ERROR, { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/voting/submit' }, undefined, undefined, req.ip, req.get('User-Agent'));
        console.error('Vote submission error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.errors[0].message
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to submit votes. Please try again."
        });
    }
});
// Check if a student has voted
votingRoutes.get("/status/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID required"
            });
        }
        const student = await storage.getStudentById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }
        res.json({
            success: true,
            hasVoted: student.hasVoted,
            votedAt: student.votedAt || null
        });
    }
    catch (error) {
        console.error('Voting status check error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check voting status"
        });
    }
});
export { votingRoutes };
//# sourceMappingURL=voting.js.map