import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = Router();
const prisma = new PrismaClient();

// Authentication route
router.post("/auth", async (req, res) => {
  try {
    const { urn, motherName } = req.body;

    if (!urn || !motherName) {
      return res.status(400).json({
        status: false,
        description: "URN and mother's name are required"
      });
    }

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

export default router;