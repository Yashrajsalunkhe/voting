import express from "express";
import path from "path";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/index";

const prisma = new PrismaClient();
export const app = express();

app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(process.cwd(), "dist")));

// app.get("/", (_req, res) => {
//   res.sendFile(path.join(process.cwd(), "dist", "index.html"));
// });

app.post("/api/auth/login", async (req, res) => {
  try {
    const { urn, motherName } = req.body;

    if (!urn || !motherName) {
      return res.status(400).json({
        success: false,
        message: "URN and mother's name are required"
      });
    }

    const student = await prisma.student.findUnique({
      where: { urn: urn.toString() }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.motherName.toLowerCase() !== motherName.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    res.json({
      success: true,
      message: "Authentication successful",
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
      success: false,
      message: "Internal server error"
    });
  }
});

app.get("/api/candidates", async (req, res) => {
  try {
    const candidatesArray = await prisma.candidate.findMany({
      orderBy: [
        { position: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group candidates by position
    const candidates = candidatesArray.reduce((acc, candidate) => {
      if (!acc[candidate.position]) {
        acc[candidate.position] = [];
      }
      acc[candidate.position]!.push(candidate);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      candidates
    });

  } catch (error) {
    console.error("Get candidates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates"
    });
  }
});

app.post("/api/votes", async (req, res) => {
  try {
    const { studentId, votes } = req.body;

    if (!studentId || !votes || !Array.isArray(votes)) {
      return res.status(400).json({
        success: false,
        message: "Student ID and votes array are required"
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.hasVoted) {
      return res.status(400).json({
        success: false,
        message: "Student has already voted"
      });
    }

    for (const vote of votes) {
      if (!vote.candidateId || !vote.position) {
        return res.status(400).json({
          success: false,
          message: "Invalid vote structure"
        });
      }
    }

    await prisma.$transaction(async (tx) => {
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
      success: true,
      message: "Votes recorded successfully"
    });

  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record votes"
    });
  }
});
// Results endpoint
app.get("/api/results", async (req, res) => {
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
            success: false,
            message: "Invalid year parameter"
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
    
    // Count actual voters based on vote records, not hasVoted flag
    const actualVoters = await prisma.vote.groupBy({
      by: ['studentId'],
      _count: { studentId: true }
    });
    const actualVotedStudents = actualVoters.length;

    // Group results by position and format for frontend
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.position]) {
        acc[result.position] = [];
      }
      acc[result.position]!.push({
        candidateId: result.candidateId,
        candidateName: result.candidateName,
        voteCount: result._count.candidateId
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate statistics
    const totalVotesByPosition = results.reduce((acc, result) => {
      if (!acc[result.position]) {
        acc[result.position] = 0;
      }
      acc[result.position] += result._count?.candidateId ?? 0;
      return acc;
    }, {} as Record<string, number>);

    // Total votes = total number of people who voted (based on actual vote records)
    const totalVoters = actualVotedStudents;

    res.json({
      success: true,
      results: groupedResults,
      statistics: {
        totalVotesByPosition,
        overallTotalVotes: totalVoters, // Now shows number of actual voters based on vote records
        totalStudents,
        votedStudents: actualVotedStudents, // Based on actual vote records, not hasVoted flag
        turnoutPercentage: totalStudents > 0 ? parseFloat(((actualVotedStudents / totalStudents) * 100).toFixed(2)) : 0,
        positionsCount: Object.keys(groupedResults).length
      }
    });

  } catch (error) {
    console.error("Results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results"
    });
  }
});
// Check voting status
app.get("/api/voting-status/:studentId", async (req, res) => {
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
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      hasVoted: student.hasVoted,
      votedAt: student.votedAt
    });

  } catch (error) {
    console.error("Voting status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check voting status"
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

// For Vercel deployment, export the app directly
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;

  // Add error handling for unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Process ID: ${process.pid}`);
  });
}