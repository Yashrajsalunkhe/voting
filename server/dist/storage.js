import dotenv from 'dotenv';
import { Position } from "./shared/schema";
import { randomUUID } from "crypto";
import { mongoStorage, MongoStorage } from "./database-storage";
// Load environment variables first
dotenv.config();
// Use MongoDB storage if MONGODB_URI is available
const USE_DATABASE = !!process.env.MONGODB_URI;
export class MemStorage {
    students;
    candidates;
    votes;
    constructor() {
        this.students = new Map();
        this.candidates = new Map();
        this.votes = new Map();
        // Initialize with sample data
        this.initializeSampleData();
    }
    initializeSampleData() {
        const now = new Date();
        // Sample students
        const sampleStudents = [
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
        const sampleCandidates = [
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
    async getStudentByUrn(urn) {
        return Array.from(this.students.values()).find(student => student.urn === urn);
    }
    async getStudentById(id) {
        return this.students.get(id);
    }
    async addStudent(student) {
        const id = randomUUID();
        const now = new Date();
        const newStudent = {
            id,
            urn: student.urn,
            motherName: student.motherName,
            year: student.year,
            hasVoted: student.hasVoted,
            createdAt: now,
            updatedAt: now
        };
        this.students.set(id, newStudent);
        return newStudent;
    }
    async deleteStudent(id) {
        return this.students.delete(id);
    }
    async getStudents(page = 1, limit = 50, year) {
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
    async countStudents(year) {
        if (year) {
            return Array.from(this.students.values()).filter(student => student.year === year).length;
        }
        return this.students.size;
    }
    async authenticateStudent(urn, motherName) {
        return Array.from(this.students.values()).find(student => student.urn.toLowerCase() === urn.toLowerCase() &&
            student.motherName.toLowerCase() === motherName.toLowerCase());
    }
    async updateStudentVoteStatus(studentId) {
        const student = this.students.get(studentId);
        if (student) {
            student.hasVoted = true;
            student.votedAt = new Date();
            this.students.set(studentId, student);
        }
    }
    async getAllCandidates() {
        return Array.from(this.candidates.values());
    }
    async getCandidatesByPosition(position) {
        return Array.from(this.candidates.values()).filter(candidate => candidate.position === position);
    }
    async submitVotes(votes) {
        votes.forEach(vote => {
            const id = randomUUID();
            const newVote = {
                id,
                studentId: vote.studentId,
                candidateId: vote.candidateId,
                position: vote.position,
                votedAt: new Date(),
            };
            this.votes.set(id, newVote);
        });
    }
    async getVoteResults() {
        const results = [];
        const voteCounts = new Map();
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
    async hasStudentVoted(studentId) {
        const student = this.students.get(studentId);
        return student?.hasVoted || false;
    }
}
export const storage = USE_DATABASE ? mongoStorage : new MemStorage();
// Initialize database if using database storage
if (USE_DATABASE && storage instanceof MongoStorage) {
    storage.initializeDatabase().catch(console.error);
}
//# sourceMappingURL=storage.js.map