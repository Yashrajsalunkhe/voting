import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { auditLogger, AuditLogger } from "../audit-logger";
import { authSchema } from "../shared/schema";
const authRoutes = Router();
// Login endpoint with proper authentication and vote status check
authRoutes.post("/login", async (req, res) => {
    try {
        const { urn, motherName } = authSchema.parse(req.body);
        // Authenticate student credentials
        const student = await storage.authenticateStudent(urn, motherName);
        if (!student) {
            auditLogger.log(AuditLogger.ACTIONS.USER_LOGIN_FAILED, { urn, reason: "Invalid credentials" }, undefined, urn, req.ip, req.get('User-Agent'));
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Please check your URN and Mother's Name."
            });
        }
        // Log successful authentication
        auditLogger.log(AuditLogger.ACTIONS.USER_LOGIN, { urn, hasVoted: student.hasVoted }, student.id, urn, req.ip, req.get('User-Agent'));
        // Return student info with voting status
        res.json({
            success: true,
            student: {
                id: student.id,
                urn: student.urn,
                hasVoted: student.hasVoted,
                year: student.year
            }
        });
    }
    catch (error) {
        auditLogger.log(AuditLogger.ACTIONS.DATABASE_ERROR, { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/auth/login' }, undefined, undefined, req.ip, req.get('User-Agent'));
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.errors[0].message
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Check voting status endpoint
authRoutes.get("/status/:studentId", async (req, res) => {
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
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to check voting status"
        });
    }
});
// Logout endpoint (for audit purposes)
authRoutes.post("/logout", async (req, res) => {
    try {
        const { studentId } = req.body;
        if (studentId) {
            auditLogger.log('USER_LOGOUT', { studentId }, studentId, undefined, req.ip, req.get('User-Agent'));
        }
        res.json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
});
export { authRoutes };
//# sourceMappingURL=auth.js.map