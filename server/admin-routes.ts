import { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { auditLogger, AuditLogger } from "./audit-logger";

// Enhanced admin authentication middleware
const adminAuth = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!process.env.ADMIN_SECRET_KEY) {
    console.warn('⚠️ ADMIN_SECRET_KEY not set in environment variables');
    return res.status(503).json({ 
      success: false, 
      message: "Admin functionality not configured" 
    });
  }
  
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    auditLogger.log(
      'ADMIN_UNAUTHORIZED_ACCESS',
      { providedKey: adminKey ? 'PROVIDED_BUT_INVALID' : 'MISSING', ip: req.ip },
      undefined, undefined, req.ip, req.get('User-Agent')
    );
    
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized. Valid admin key required." 
    });
  }
  
  next();
};

// Schema for student creation
const createStudentSchema = z.object({
  urn: z.string().min(1, "URN is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  year: z.enum(['second-year', 'third-year', 'final-year']),
  name: z.string().min(1, "Name is required").optional(),
});

// Schema for bulk student creation
const bulkCreateStudentsSchema = z.object({
  students: z.array(createStudentSchema)
    .min(1, "At least one student is required")
    .max(100, "Maximum 100 students per batch"),
});

export function registerAdminRoutes(app: Express) {
  // Apply admin authentication to all admin routes
  app.use('/api/admin/*', adminAuth);
  
  // Admin verification endpoint
  app.get('/api/admin/verify', (req, res) => {
    res.json({ 
      success: true, 
      message: "Admin authentication successful",
      timestamp: new Date().toISOString()
    });
  });

  // Get admin statistics
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const totalStudents = await storage.countStudents();
      const results = await storage.getVoteResults();
      const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
      const votingPercentage = totalStudents > 0 ? Math.round((totalVotes / totalStudents) * 100 * 100) / 100 : 0;
      
      res.json({
        success: true,
        statistics: {
          totalStudents,
          totalVotes,
          votingPercentage,
          positions: results.reduce((acc, result) => {
            if (!acc[result.position]) {
              acc[result.position] = [];
            }
            acc[result.position].push({
              candidateName: result.candidateName,
              voteCount: result.voteCount
            });
            return acc;
          }, {} as Record<string, Array<{ candidateName: string; voteCount: number }>>)
        }
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics"
      });
    }
  });
  
  // Add a single student
  app.post('/api/admin/students', async (req, res) => {
    try {
      const studentData = createStudentSchema.parse(req.body);
      
      const existingStudent = await storage.getStudentByUrn(studentData.urn);
      
      if (existingStudent) {
        return res.status(409).json({ 
          success: false, 
          message: `Student with URN ${studentData.urn} already exists` 
        });
      }
      
      const student = await storage.addStudent({
        urn: studentData.urn,
        motherName: studentData.motherName,
        year: studentData.year,
        hasVoted: false
      });
      
      auditLogger.log(
        AuditLogger.ACTIONS.ADMIN_ADD_STUDENT,
        { urn: studentData.urn, name: studentData.name },
        undefined, undefined, req.ip, req.get('User-Agent')
      );
      
      res.status(201).json({ 
        success: true, 
        message: "Student added successfully",
        student: {
          id: student.id,
          urn: student.urn,
          year: student.year,
          hasVoted: student.hasVoted
        }
      });
    } catch (error) {
      console.error("Error adding student:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Error adding student" 
      });
    }
  });
  
  // Bulk add students
  app.post('/api/admin/students/bulk', async (req, res) => {
    try {
      const { students } = bulkCreateStudentsSchema.parse(req.body);
      
      const results = {
        added: 0,
        skipped: 0,
        errors: 0,
        details: [] as { urn: string; status: string; message?: string }[]
      };
      
      for (const studentData of students) {
        try {
          const existingStudent = await storage.getStudentByUrn(studentData.urn);
          
          if (existingStudent) {
            results.skipped++;
            results.details.push({ 
              urn: studentData.urn, 
              status: "skipped", 
              message: "URN already exists" 
            });
            continue;
          }
          
          await storage.addStudent({
            urn: studentData.urn,
            motherName: studentData.motherName,
            year: studentData.year,
            hasVoted: false
          });
          
          results.added++;
          results.details.push({ 
            urn: studentData.urn, 
            status: "added" 
          });
        } catch (error) {
          results.errors++;
          results.details.push({ 
            urn: studentData.urn, 
            status: "error", 
            message: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      auditLogger.log(
        AuditLogger.ACTIONS.ADMIN_BULK_ADD_STUDENTS,
        { added: results.added, skipped: results.skipped, errors: results.errors },
        undefined, undefined, req.ip, req.get('User-Agent')
      );
      
      res.status(201).json({ 
        success: true, 
        message: `Bulk operation completed: ${results.added} added, ${results.skipped} skipped, ${results.errors} errors`,
        results
      });
    } catch (error) {
      console.error("Error adding students in bulk:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Error adding students in bulk" 
      });
    }
  });

  // Get all students (paginated)
  app.get('/api/admin/students', async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const yearParam = req.query.year as string;
      
      const year = yearParam === 'all' ? undefined : yearParam;
      
      const students = await storage.getStudents(page, limit, year);
      const total = await storage.countStudents(year);
      
      res.json({
        success: true,
        students: students.map(student => ({
          id: student.id,
          urn: student.urn,
          year: student.year,
          hasVoted: student.hasVoted,
          votedAt: student.votedAt || null,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
          studentsPerPage: limit
        }
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error fetching students" 
      });
    }
  });

  // Get specific student by ID
  app.get('/api/admin/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudentById(id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }
      
      res.json({
        success: true,
        student: {
          id: student.id,
          urn: student.urn,
          motherName: student.motherName,
          year: student.year,
          hasVoted: student.hasVoted,
          votedAt: student.votedAt || null
        }
      });
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching student"
      });
    }
  });

  // Delete a student
  app.delete('/api/admin/students/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const student = await storage.getStudentById(id);
      
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: "Student not found" 
        });
      }
      
      await storage.deleteStudent(id);
      
      auditLogger.log(
        AuditLogger.ACTIONS.ADMIN_DELETE_STUDENT,
        { id, urn: student.urn },
        undefined, undefined, req.ip, req.get('User-Agent')
      );
      
      res.json({ 
        success: true, 
        message: `Student ${student.urn} deleted successfully` 
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error deleting student" 
      });
    }
  });

  // Get audit logs
  app.get('/api/admin/audit-logs', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      
      const logs = auditLogger.getLogs();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = logs.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        logs: paginatedLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(logs.length / limit),
          total: logs.length
        }
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching audit logs"
      });
    }
  });
}
