import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/database";
import { 
  Student, 
  Candidate, 
  Vote, 
  SecondYearVotes, 
  ThirdYearVotes, 
  FinalYearVotes 
} from "./models";
// import path from "path";
// import { fileURLToPath } from "url";
export const app = express();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// // Serve frontend static files
// app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// app.get("/", (_req, res) => {
//   res.sendFile(path.join(__dirname, "../../frontend/dist", "index.html"));
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

    const student = await Student.findOne({ urn: urn.toString() });

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
        id: student._id.toString(),
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
    const candidatesArray = await Candidate.find().sort({ position: 1, name: 1 });

    // Group candidates by position
    const candidates = candidatesArray.reduce((acc: Record<string, any[]>, candidate: any) => {
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

    const student = await Student.findById(studentId);

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

    // Start a session for transaction
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        for (const vote of votes) {
          const candidate = await Candidate.findById(vote.candidateId).session(session);

          if (!candidate) {
            throw new Error(`Candidate not found: ${vote.candidateId}`);
          }

          // Create vote in main votes table
          await Vote.create([{
            studentId: student._id,
            candidateId: vote.candidateId,
            position: vote.position
          }], { session });

          // Create vote in year-specific table
          const voteData = {
            urn: student.urn,
            studentId: student._id,
            candidateId: vote.candidateId,
            candidateName: candidate.name,
            position: vote.position
          };

          switch (student.year) {
            case 'second-year':
              await SecondYearVotes.create([voteData], { session });
              break;
            case 'third-year':
              await ThirdYearVotes.create([voteData], { session });
              break;
            case 'final-year':
              await FinalYearVotes.create([voteData], { session });
              break;
          }
        }

        // Mark student as voted
        await Student.findByIdAndUpdate(
          student._id,
          {
            hasVoted: true,
            votedAt: new Date()
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

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
      // Get results for specific year using aggregation
      const aggregationPipeline: any[] = [
        {
          $group: {
            _id: {
              candidateId: "$candidateId",
              candidateName: "$candidateName",
              position: "$position"
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.position": 1,
            "count": -1
          } as any
        },
        {
          $project: {
            candidateId: "$_id.candidateId",
            candidateName: "$_id.candidateName", 
            position: "$_id.position",
            _count: { candidateId: "$count" },
            _id: 0
          }
        }
      ];

      switch (year) {
        case 'second-year':
          results = await SecondYearVotes.aggregate(aggregationPipeline);
          break;
        case 'third-year':
          results = await ThirdYearVotes.aggregate(aggregationPipeline);
          break;
        case 'final-year':
          results = await FinalYearVotes.aggregate(aggregationPipeline);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid year parameter"
          });
      }
    } else {
      // Get overall results using aggregation
      const voteResults = await Vote.aggregate([
        {
          $group: {
            _id: {
              candidateId: "$candidateId",
              position: "$position"
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.position": 1,
            "count": -1
          } as any
        }
      ]);

      // Enrich with candidate details
      const enrichedResults = await Promise.all(
        voteResults.map(async (result: any) => {
          const candidate = await Candidate.findById(result._id.candidateId);
          return {
            candidateId: result._id.candidateId,
            position: result._id.position,
            candidateName: candidate?.name || 'Unknown',
            candidateImageUrl: candidate?.imageUrl,
            _count: { candidateId: result.count }
          };
        })
      );
      results = enrichedResults;
    }

    // Get voting statistics
    const totalStudents = await Student.countDocuments();
    
    // Count actual voters based on vote records
    const actualVoters = await Vote.aggregate([
      {
        $group: {
          _id: "$studentId"
        }
      },
      {
        $count: "totalVoters"
      }
    ]);
    const actualVotedStudents = actualVoters.length > 0 ? actualVoters[0].totalVoters : 0;

    // Group results by position and format for frontend
    const groupedResults = results.reduce((acc: Record<string, any[]>, result: any) => {
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
    const totalVotesByPosition = results.reduce((acc: Record<string, number>, result: any) => {
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

    const student = await Student.findById(studentId).select('hasVoted votedAt');

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
    const students = await Student.find()
      .select('urn year hasVoted votedAt')
      .sort({ year: 1, urn: 1 });

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
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
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