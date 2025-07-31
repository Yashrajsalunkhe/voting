import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authSchema, votingSchema } from "./shared/schema";
import { auditLogger, AuditLogger } from "./audit-logger";
import { emailService } from "./email-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // =========================
  // AUTHENTICATION ROUTES
  // =========================
  
  // Enhanced login endpoint with proper validation and duplicate vote prevention
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { urn, motherName } = authSchema.parse(req.body);
      
      // Authenticate student credentials against database
      const student = await storage.authenticateStudent(urn, motherName);
      
      if (!student) {
        auditLogger.log(
          AuditLogger.ACTIONS.USER_LOGIN_FAILED,
          { urn, reason: "Invalid credentials" },
          undefined,
          urn,
          req.ip,
          req.get('User-Agent')
        );
        
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials. Please check your URN and Mother's Name." 
        });
      }

      // Log successful authentication
      auditLogger.log(
        AuditLogger.ACTIONS.USER_LOGIN,
        { urn, hasVoted: student.hasVoted },
        student.id,
        urn,
        req.ip,
        req.get('User-Agent')
      );

      // Return student info with voting status - CRITICAL for preventing duplicate voting
      res.json({
        success: true,
        student: {
          id: student.id,
          urn: student.urn,
          hasVoted: student.hasVoted,  // This is key - frontend should check this
          year: student.year,
          votedAt: student.votedAt || null
        }
      });
    } catch (error) {
      auditLogger.log(
        AuditLogger.ACTIONS.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/auth/login' },
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent')
      );
      
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

  // =========================
  // VOTING ROUTES
  // =========================

  // Get all candidates grouped by position
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      
      // Group candidates by position for easier frontend consumption
      const groupedCandidates = candidates.reduce((acc, candidate) => {
        if (!acc[candidate.position]) {
          acc[candidate.position] = [];
        }
        acc[candidate.position].push(candidate as any);
        return acc;
      }, {} as Record<string, any[]>);

      res.json({
        success: true,
        candidates: groupedCandidates
      });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch candidates" 
      });
    }
  });

  // Enhanced vote submission with comprehensive validation and duplicate prevention
  app.post("/api/votes", async (req, res) => {
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

      // CRITICAL: Verify student exists and get their current voting status
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      // CRITICAL: Check if student has already voted - this prevents duplicate voting
      const hasVoted = await storage.hasStudentVoted(studentId);
      
      if (hasVoted) {
        auditLogger.log(
          AuditLogger.ACTIONS.VOTE_ATTEMPT_DUPLICATE,
          { 
            studentId, 
            urn: student.urn,
            attemptedVotes: votes.length,
            reason: "Student already voted"
          },
          studentId,
          student.urn,
          req.ip,
          req.get('User-Agent')
        );
        
        return res.status(409).json({
          success: false,
          message: "You have already voted. Each student can vote only once."
        });
      }

      // Validate that votes are for different positions (no duplicate position voting)
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

      // Submit votes to storage (this is atomic)
      const votesToSubmit = votes.map(vote => ({
        studentId: studentId,
        candidateId: vote.candidateId,
        position: vote.position
      }));
      
      await storage.submitVotes(votesToSubmit);
      
      // CRITICAL: Update student's voting status to prevent future voting
      await storage.updateStudentVoteStatus(studentId);
      
      const submissionTime = new Date();
      
      // Audit log for successful vote submission
      auditLogger.log(
        AuditLogger.ACTIONS.VOTE_SUBMITTED,
        { 
          studentId, 
          urn: student.urn,
          votesCount: votes.length,
          positions: votes.map(v => v.position),
          submissionTime
        },
        studentId,
        student.urn,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: "Your votes have been recorded successfully",
        votedAt: submissionTime,
        votesSubmitted: votes.length
      });
    } catch (error) {
      auditLogger.log(
        AuditLogger.ACTIONS.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/votes' },
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent')
      );
      
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

  // Check voting status endpoint
  app.get("/api/voting-status/:studentId", async (req, res) => {
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
    } catch (error) {
      console.error('Voting status check error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to check voting status"
      });
    }
  });

  // =========================
  // RESULTS AND COUNTING ROUTES
  // =========================

  // Enhanced results endpoint with comprehensive vote counting
  app.get("/api/results", async (req, res) => {
    try {
      const results = await storage.getVoteResults();
      
      // Log results viewing for audit
      auditLogger.log(
        AuditLogger.ACTIONS.RESULTS_VIEWED,
        { resultsCount: results.length },
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent')
      );
      
      // Group results by position and sort by vote count
      const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.position]) {
          acc[result.position] = [];
        }
        acc[result.position].push({
          candidateId: result.candidateId,
          candidateName: result.candidateName,
          voteCount: result.voteCount
        });
        return acc;
      }, {} as Record<string, Array<{ candidateId: string; candidateName: string; voteCount: number }>>);

      // Sort candidates within each position by vote count (descending)
      Object.keys(groupedResults).forEach(position => {
        groupedResults[position].sort((a, b) => b.voteCount - a.voteCount);
      });

      // Calculate comprehensive statistics
      const totalVotesByPosition = Object.keys(groupedResults).reduce((acc, position) => {
        acc[position] = groupedResults[position].reduce((sum, candidate) => sum + candidate.voteCount, 0);
        return acc;
      }, {} as Record<string, number>);

      const overallTotalVotes = Object.values(totalVotesByPosition).reduce((sum, votes) => sum + votes, 0);
      const totalStudents = await storage.countStudents();
      const turnoutPercentage = totalStudents > 0 ? Math.round((overallTotalVotes / totalStudents) * 100 * 100) / 100 : 0;

      res.json({
        success: true,
        results: groupedResults,
        statistics: {
          totalVotesByPosition,
          overallTotalVotes,
          totalStudents,
          turnoutPercentage,
          positionsCount: Object.keys(groupedResults).length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      auditLogger.log(
        AuditLogger.ACTIONS.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', endpoint: '/api/results' },
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent')
      );
      
      console.error('Error fetching results:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch results" 
      });
    }
  });

  // Results for specific position
  app.get("/api/results/:position", async (req, res) => {
    try {
      const { position } = req.params;
      const results = await storage.getVoteResults();
      
      const positionResults = results
        .filter(result => result.position.toLowerCase() === position.toLowerCase())
        .sort((a, b) => b.voteCount - a.voteCount);

      const totalVotes = positionResults.reduce((sum, result) => sum + result.voteCount, 0);

      res.json({
        success: true,
        position,
        results: positionResults.map(result => ({
          candidateId: result.candidateId,
          candidateName: result.candidateName,
          voteCount: result.voteCount,
          percentage: totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100 * 100) / 100 : 0
        })),
        totalVotes
      });
    } catch (error) {
      console.error('Error fetching position results:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch results for position"
      });
    }
  });

  // Year-based voting results endpoints (legacy support)
  app.get("/api/votes/second-year", async (req, res) => {
    try {
      const mongoStorage = storage as any;
      if (!mongoStorage.getYearBasedResults) {
        return res.status(501).json({ 
          success: false, 
          message: "Year-based voting results not supported with current storage" 
        });
      }
      const votes = await mongoStorage.getYearBasedResults('second');
      res.json({
        success: true,
        year: 'Second Year',
        votes: votes
      });
    } catch (error) {
      console.error('Error fetching second year votes:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch second year votes" 
      });
    }
  });

  app.get("/api/votes/third-year", async (req, res) => {
    try {
      const mongoStorage = storage as any;
      if (!mongoStorage.getYearBasedResults) {
        return res.status(501).json({ 
          success: false, 
          message: "Year-based voting results not supported with current storage" 
        });
      }
      const votes = await mongoStorage.getYearBasedResults('third');
      res.json({
        success: true,
        year: 'Third Year',
        votes: votes
      });
    } catch (error) {
      console.error('Error fetching third year votes:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch third year votes" 
      });
    }
  });

  app.get("/api/votes/final-year", async (req, res) => {
    try {
      const mongoStorage = storage as any;
      if (!mongoStorage.getYearBasedResults) {
        return res.status(501).json({ 
          success: false, 
          message: "Year-based voting results not supported with current storage" 
        });
      }
      const votes = await mongoStorage.getYearBasedResults('final');
      res.json({
        success: true,
        year: 'Final Year',
        votes: votes
      });
    } catch (error) {
      console.error('Error fetching final year votes:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch final year votes" 
      });
    }
  });

  app.get("/api/votes/all-years", async (req, res) => {
    try {
      const mongoStorage = storage as any;
      if (!mongoStorage.getYearBasedResults) {
        return res.status(501).json({ 
          success: false, 
          message: "Year-based voting results not supported with current storage" 
        });
      }
      
      const [secondYear, thirdYear, finalYear] = await Promise.all([
        mongoStorage.getYearBasedResults('second'),
        mongoStorage.getYearBasedResults('third'),
        mongoStorage.getYearBasedResults('final')
      ]);
      
      res.json({
        success: true,
        data: {
          'Second Year': secondYear,
          'Third Year': thirdYear,
          'Final Year': finalYear
        }
      });
    } catch (error) {
      console.error('Error fetching all year votes:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch all year votes" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
