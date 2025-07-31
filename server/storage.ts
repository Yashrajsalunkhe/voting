import dotenv from 'dotenv';
import { Position, type Student, type Candidate } from "./shared/schema";
import { randomUUID } from "crypto";
import { mongoStorage, MongoStorage } from "./database-storage";

// Load environment variables first
dotenv.config();

// Simple interfaces for in-memory storage (compatible with plain types)
interface MemStudent {
  id: string;
  urn: string;
  motherName: string;
  year: 'second-year' | 'third-year' | 'final-year';
  hasVoted: boolean;
  votedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MemCandidate {
  id: string;
  name: string;
  position: string;
  description?: string;
  imageUrl?: string;
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemVote {
  id: string;
  studentId: string;
  candidateId: string;
  position: string;
  votedAt: Date;
}

interface InsertVote {
  studentId: string;
  candidateId: string;
  position: string;
}

export interface IStorage {
  // Student operations
  getStudentByUrn(urn: string): Promise<Student | undefined>;
  getStudentById(id: string): Promise<Student | undefined>;
  authenticateStudent(urn: string, motherName: string): Promise<Student | undefined>;
  updateStudentVoteStatus(studentId: string): Promise<void>;
  addStudent(student: { urn: string, motherName: string, year: string, hasVoted: boolean }): Promise<Student>;
  deleteStudent(id: string): Promise<boolean>;
  getStudents(page?: number, limit?: number, year?: string): Promise<Student[]>;
  countStudents(year?: string): Promise<number>;
  
  // Candidate operations
  getAllCandidates(): Promise<Candidate[]>;
  getCandidatesByPosition(position: string): Promise<Candidate[]>;
  
  // Vote operations
  submitVotes(votes: InsertVote[]): Promise<void>;
  getVoteResults(): Promise<{ position: string; candidateId: string; candidateName: string; voteCount: number }[]>;
  hasStudentVoted(studentId: string): Promise<boolean>;
  
  // Year-based vote operations (only for MongoDB)
  getYearBasedResults?(year: 'second' | 'third' | 'final'): Promise<{ position: string; candidateName: string; urn: string; votedAt: Date }[]>;
}

// Use MongoDB storage if MONGODB_URI is available
const USE_DATABASE = !!process.env.MONGODB_URI;

console.log('🔍 Storage Debug Info:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('USE_DATABASE:', USE_DATABASE);
console.log('Storage type:', USE_DATABASE ? 'MongoDB' : 'In-Memory');

export class MemStorage implements IStorage {
  private students: Map<string, MemStudent>;
  private candidates: Map<string, MemCandidate>;
  private votes: Map<string, MemVote>;

  constructor() {
    this.students = new Map();
    this.candidates = new Map();
    this.votes = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const now = new Date();
    
    // Sample students
    const sampleStudents: MemStudent[] = [
      {
        id: randomUUID(),
        urn: "2021AI001",
        motherName: "Sunita Sharma",
        year: "final-year",
        hasVoted: false,
        votedAt: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        urn: "2021AI002", 
        motherName: "Priya Patel",
        year: "third-year",
        hasVoted: false,
        votedAt: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        urn: "2021AI003",
        motherName: "Meera Singh",
        year: "second-year",
        hasVoted: false,
        votedAt: undefined,
        createdAt: now,
        updatedAt: now,
      },
    ];

    sampleStudents.forEach(student => {
      this.students.set(student.id, student);
    });

    // Sample candidates
    const sampleCandidates: MemCandidate[] = [
      {
        id: "1",
        name: "Rahul Sharma",
        position: Position.PRESIDENT,
        description: "Experienced leader with a vision for innovation and student welfare in AI&DS department",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSharma&backgroundColor=b6e3f4",
        year: "Final Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "2",
        name: "Priya Patel",
        position: Position.PRESIDENT,
        description: "Innovative thinker focused on bridging technology gaps and promoting research excellence",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaPatel&backgroundColor=c0aede",
        year: "Final Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "3",
        name: "Amit Kumar",
        position: Position.VICE_PRESIDENT,
        description: "Dedicated to bridging student-faculty gap and organizing technical workshops",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=AmitKumar&backgroundColor=d1d4f9",
        year: "Third Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "4",
        name: "Sneha Singh",
        position: Position.VICE_PRESIDENT,
        description: "Passionate about technical events and creating collaborative learning environment",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=SnehaSingh&backgroundColor=fecaca",
        year: "Third Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "5",
        name: "Arjun Reddy",
        position: Position.SECRETARY,
        description: "Organized and detail-oriented administrator with excellent record-keeping skills",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArjunReddy&backgroundColor=fed7aa",
        year: "Third Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "6",
        name: "Kavya Nair",
        position: Position.SECRETARY,
        description: "Excellent communication and coordination skills with proven leadership experience",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=KavyaNair&backgroundColor=fde68a",
        year: "Third Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "7",
        name: "Rohit Gupta",
        position: Position.TREASURER,
        description: "Financial management expertise with commitment to transparency and accountability",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=RohitGupta&backgroundColor=a7f3d0",
        year: "Second Year",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "8",
        name: "Ananya Joshi",
        position: Position.TREASURER,
        description: "Committed to responsible budget management and sustainable financial planning",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaJoshi&backgroundColor=f9a8d4",
        year: "Second Year",
        createdAt: now,
        updatedAt: now,
      },
    ];

    sampleCandidates.forEach(candidate => {
      this.candidates.set(candidate.id, candidate);
    });
  }

  async getStudentByUrn(urn: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.urn === urn);
  }
  
  async getStudentById(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }
  
  async addStudent(student: { urn: string, motherName: string, year: string, hasVoted: boolean }): Promise<Student> {
    const id = randomUUID();
    const now = new Date();
    const newStudent: MemStudent = {
      id,
      urn: student.urn,
      motherName: student.motherName,
      year: student.year as 'second-year' | 'third-year' | 'final-year',
      hasVoted: student.hasVoted,
      createdAt: now,
      updatedAt: now
    };
    
    this.students.set(id, newStudent);
    return newStudent as Student;
  }
  
  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }
  
  async getStudents(page: number = 1, limit: number = 50, year?: string): Promise<Student[]> {
    let students = Array.from(this.students.values());
    
    if (year) {
      students = students.filter(student => student.year === year);
    }
    
    // Sort by URN
    students.sort((a, b) => a.urn.localeCompare(b.urn));
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return students.slice(start, end);
  }
  
  async countStudents(year?: string): Promise<number> {
    if (year) {
      return Array.from(this.students.values()).filter(student => student.year === year).length;
    }
    return this.students.size;
  }

  async authenticateStudent(urn: string, motherName: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      student => student.urn.toLowerCase() === urn.toLowerCase() && 
                student.motherName.toLowerCase() === motherName.toLowerCase()
    );
  }

  async updateStudentVoteStatus(studentId: string): Promise<void> {
    const student = this.students.get(studentId);
    if (student) {
      student.hasVoted = true;
      student.votedAt = new Date();
      this.students.set(studentId, student);
    }
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values()) as Candidate[];
  }

  async getCandidatesByPosition(position: string): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(candidate => candidate.position === position) as Candidate[];
  }

  async submitVotes(votes: InsertVote[]): Promise<void> {
    votes.forEach(vote => {
      const id = randomUUID();
      const newVote: MemVote = {
        id,
        studentId: vote.studentId,
        candidateId: vote.candidateId,
        position: vote.position,
        votedAt: new Date(),
      };
      this.votes.set(id, newVote);
    });
  }

  async getVoteResults(): Promise<{ position: string; candidateId: string; candidateName: string; voteCount: number }[]> {
    const results: { position: string; candidateId: string; candidateName: string; voteCount: number }[] = [];
    const voteCounts = new Map<string, number>();

    // Count votes for each candidate
    Array.from(this.votes.values()).forEach(vote => {
      const key = `${vote.position}-${vote.candidateId}`;
      voteCounts.set(key, (voteCounts.get(key) || 0) + 1);
    });

    // Build results with candidate names
    Array.from(voteCounts.entries()).forEach(([key, count]) => {
      const [position, candidateId] = key.split('-');
      const candidate = this.candidates.get(candidateId);
      
      if (candidate) {
        results.push({
          position,
          candidateId: candidateId,
          candidateName: candidate.name,
          voteCount: count,
        });
      }
    });

    return results;
  }

  async hasStudentVoted(studentId: string): Promise<boolean> {
    const student = this.students.get(studentId);
    return student?.hasVoted || false;
  }
}

export const storage = USE_DATABASE ? mongoStorage : new MemStorage();

// Initialize database if using database storage
if (USE_DATABASE && storage instanceof MongoStorage) {
  (storage as MongoStorage).initializeDatabase().catch(console.error);
}
