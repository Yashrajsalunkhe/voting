import express from "express";
import path from "path";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/index";

const prisma = new PrismaClient();
export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "dist")));

// Serve frontend
app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

// Authentication endpoint
app.post("/auth", async (req, res) => {
  try {
    const { urn, motherName } = req.body;

    if (!urn || !motherName) {
      return res.status(400).json({
        status: false,
        description: "URN and mother's name are required"
      });
    }

    // Find student by URN and verify mother's name
    const student = await prisma.student.findUnique({
      where: { urn: urn.toString() }
    });

    if (!student) {
      return res.status(404).json({
        status: false,
        description: "Student not found"
      });
    }

    if (student.motherName.toLowerCase() !== motherName.toLowerCase()) {
      return res.status(401).json({
        status: false,
        description: "Invalid credentials"
      });
    }

    res.json({
      status: true,
      description: "Authentication successful",
      student: {
        id: student.id,
        urn: student.urn,
        year: student.year,
        hasVoted: student.hasVoted
      }
    });

  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({
      status: false,
      description: "Internal server error"
    });
  }
});

// Get candidates endpoint
app.get("/candidates", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: [
        { position: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      status: true,
      candidates
    });

  } catch (error) {
    console.error("Get candidates error:", error);
    res.status(500).json({
      status: false,
      description: "Failed to fetch candidates"
    });
  }
});
// Vote endpoint
app.post("/vote", async (req, res) => {
  try {
    const { studentId, votes } = req.body;

    if (!studentId || !votes || !Array.isArray(votes)) {
      return res.status(400).json({
        status: false,
        description: "Student ID and votes array are required"
      });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        status: false,
        description: "Student not found"
      });
    }

    if (student.hasVoted) {
      return res.status(400).json({
        status: false,
        description: "Student has already voted"
      });
    }

    // Validate votes structure
    for (const vote of votes) {
      if (!vote.candidateId || !vote.position) {
        return res.status(400).json({
          status: false,
          description: "Invalid vote structure"
        });
      }
    }

    // Process votes in transaction
    await prisma.$transaction(async (tx) => {
      // Create votes in main votes table
      for (const vote of votes) {
        const candidate = await tx.candidate.findUnique({
          where: { id: vote.candidateId }
        });

        if (!candidate) {
          throw new Error(`Candidate not found: ${vote.candidateId}`);
        }

        // Create vote in main votes table
        await tx.vote.create({
          data: {
            studentId: student.id,
            candidateId: vote.candidateId,
            position: vote.position
          }
        });

        // Create vote in year-specific table
        const voteData = {
          urn: student.urn,
          studentId: student.id,
          candidateId: vote.candidateId,
          candidateName: candidate.name,
          position: vote.position
        };

        switch (student.year) {
          case 'second-year':
            await tx.secondYearVotes.create({ data: voteData });
            break;
          case 'third-year':
            await tx.thirdYearVotes.create({ data: voteData });
            break;
          case 'final-year':
            await tx.finalYearVotes.create({ data: voteData });
            break;
        }
      }

      // Mark student as voted
      await tx.student.update({
        where: { id: student.id },
        data: {
          hasVoted: true,
          votedAt: new Date()
        }
      });
    });

    res.json({
      status: true,
      description: "Votes recorded successfully"
    });

  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({
      status: false,
      description: "Failed to record votes"
    });
  }
});
// Results endpoint
app.get("/results", async (req, res) => {
  try {
    const { year } = req.query;

    let results;
    
    if (year) {
      // Get results for specific year
      switch (year) {
        case 'second-year':
          results = await prisma.secondYearVotes.groupBy({
            by: ['candidateId', 'candidateName', 'position'],
            _count: { candidateId: true },
            orderBy: [
              { position: 'asc' },
              { _count: { candidateId: 'desc' } }
            ]
          });
          break;
        case 'third-year':
          results = await prisma.thirdYearVotes.groupBy({
            by: ['candidateId', 'candidateName', 'position'],
            _count: { candidateId: true },
            orderBy: [
              { position: 'asc' },
              { _count: { candidateId: 'desc' } }
            ]
          });
          break;
        case 'final-year':
          results = await prisma.finalYearVotes.groupBy({
            by: ['candidateId', 'candidateName', 'position'],
            _count: { candidateId: true },
            orderBy: [
              { position: 'asc' },
              { _count: { candidateId: 'desc' } }
            ]
          });
          break;
        default:
          return res.status(400).json({
            status: false,
            description: "Invalid year parameter"
          });
      }
    } else {
      // Get overall results
      results = await prisma.vote.groupBy({
        by: ['candidateId', 'position'],
        _count: { candidateId: true },
        orderBy: [
          { position: 'asc' },
          { _count: { candidateId: 'desc' } }
        ]
      });

      // Enrich with candidate details
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          const candidate = await prisma.candidate.findUnique({
            where: { id: result.candidateId }
          });
          return {
            ...result,
            candidateName: candidate?.name || 'Unknown',
            candidateImageUrl: candidate?.imageUrl
          };
        })
      );
      results = enrichedResults;
    }

    // Get voting statistics
    const totalStudents = await prisma.student.count();
    const votedStudents = await prisma.student.count({
      where: { hasVoted: true }
    });

    res.json({
      status: true,
      results,
      statistics: {
        totalStudents,
        votedStudents,
        votingPercentage: totalStudents > 0 ? ((votedStudents / totalStudents) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error("Results error:", error);
    res.status(500).json({
      status: false,
      description: "Failed to fetch results"
    });
  }
});
// Check voting status
app.get("/voting-status/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        hasVoted: true,
        votedAt: true
      }
    });

    if (!student) {
      return res.status(404).json({
        status: false,
        description: "Student not found"
      });
    }

    res.json({
      status: true,
      hasVoted: student.hasVoted,
      votedAt: student.votedAt
    });

  } catch (error) {
    console.error("Voting status error:", error);
    res.status(500).json({
      status: false,
      description: "Failed to check voting status"
    });
  }
});

// Admin endpoint to get all students (for testing/admin purposes)
app.get("/admin/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        urn: true,
        year: true,
        hasVoted: true,
        votedAt: true
      },
      orderBy: [
        { year: 'asc' },
        { urn: 'asc' }
      ]
    });

    res.json({
      status: true,
      students
    });

  } catch (error) {
    console.error("Admin students error:", error);
    res.status(500).json({
      status: false,
      description: "Failed to fetch students"
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});