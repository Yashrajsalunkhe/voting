import { database } from "./db.js";
import { StudentModel, CandidateModel, VoteModel, SecondYearVotesModel, ThirdYearVotesModel, FinalYearVotesModel, Position } from "./shared/schema.js";
import mongoose from "mongoose";
export class MongoStorage {
    async initializeDatabase() {
        try {
            // Connect to MongoDB
            await database.connect();
            // Check if candidates collection has data, if not, seed with sample data
            const candidateCount = await CandidateModel.countDocuments();
            if (candidateCount === 0) {
                await this.seedSampleData();
                console.log("Database seeded with sample data");
            }
        }
        catch (error) {
            console.error("Failed to initialize database:", error);
        }
    }
    async seedSampleData() {
        // Only seed candidates - students will come from CSV files
        // Sample candidates
        const sampleCandidates = [
            // PRESIDENT - 2 candidates from Final Year
            {
                name: "Prem Pratap Kadam",
                position: Position.PRESIDENT,
                imageUrl: "/images/candidates/president/prem-pratap-kadam.jpg",
                year: "Final Year",
            },
            {
                name: "Saniya Javed Mulani",
                position: Position.PRESIDENT,
                imageUrl: "/images/candidates/president/saniya-javed-mulani.jpg",
                year: "Final Year",
            },
            // VICE_PRESIDENT - 1 candidate from Third Year
            {
                name: "Pranav Maruti Patil",
                position: Position.VICE_PRESIDENT,
                imageUrl: "/images/candidates/vice-president/pranav-maruti-patil.jpg",
                year: "Third Year",
            },
            // SECRETARY - 5 candidates from Second Year
            {
                name: "Rushikesh Kaware",
                position: Position.SECRETARY,
                imageUrl: "/images/candidates/secretary/rushikesh-kaware.jpg",
                year: "Second Year",
            },
            {
                name: "Sanika Kumbar",
                position: Position.SECRETARY,
                imageUrl: "/images/candidates/secretary/sanika-kumbar.jpg",
                year: "Second Year",
            },
            {
                name: "Simran Kakade",
                position: Position.SECRETARY,
                imageUrl: "/images/candidates/secretary/simran-kakade.jpg",
                year: "Second Year",
            },
            {
                name: "Tanuja Pawar",
                position: Position.SECRETARY,
                imageUrl: "/images/candidates/secretary/tanuja-pawar.jpg",
                year: "Second Year",
            },
            {
                name: "Nyasa Khatal",
                position: Position.SECRETARY,
                imageUrl: "/images/candidates/secretary/nyasa-khatal.jpg",
                year: "Second Year",
            },
            // TREASURER - 1 candidate from Third Year
            {
                name: "Yashraj Daulatrao Salunkhe",
                position: Position.TREASURER,
                imageUrl: "/images/candidates/treasurer/yashraj-daulatrao-salunkhe.jpg",
                year: "Third Year",
            },
        ];
        await CandidateModel.insertMany(sampleCandidates);
    }
    async getStudentByUrn(urn) {
        const student = await StudentModel.findOne({ urn }).lean();
        return student ? { ...student, id: student._id.toString() } : undefined;
    }
    async getStudentById(id) {
        try {
            const student = await StudentModel.findById(id).lean();
            return student ? { ...student, id: student._id.toString() } : undefined;
        }
        catch (error) {
            console.error("Error getting student by id:", error);
            return undefined;
        }
    }
    async addStudent(student) {
        const newStudent = await StudentModel.create(student);
        return {
            id: newStudent._id.toString(),
            urn: newStudent.urn,
            motherName: newStudent.motherName,
            year: newStudent.year,
            hasVoted: newStudent.hasVoted,
            votedAt: newStudent.votedAt,
            createdAt: newStudent.createdAt,
            updatedAt: newStudent.updatedAt
        };
    }
    async deleteStudent(id) {
        try {
            const result = await StudentModel.findByIdAndDelete(id);
            return !!result;
        }
        catch (error) {
            console.error("Error deleting student:", error);
            return false;
        }
    }
    async getStudents(page = 1, limit = 50, year) {
        const skip = (page - 1) * limit;
        const query = year ? { year } : {};
        const students = await StudentModel.find(query)
            .sort({ urn: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return students.map(student => ({
            ...student,
            id: student._id.toString()
        }));
    }
    async countStudents(year) {
        const query = year ? { year } : {};
        return StudentModel.countDocuments(query);
    }
    async authenticateStudent(urn, motherName) {
        const student = await StudentModel.findOne({
            urn: { $regex: new RegExp(`^${urn}$`, 'i') },
            motherName: { $regex: new RegExp(`^${motherName}$`, 'i') }
        }).lean();
        if (!student)
            return undefined;
        // Map _id to id for consistent API
        return {
            ...student,
            id: student._id.toString()
        };
    }
    async updateStudentVoteStatus(studentId) {
        await StudentModel.findByIdAndUpdate(studentId, {
            hasVoted: true,
            votedAt: new Date()
        });
    }
    async getAllCandidates() {
        const candidates = await CandidateModel.find({});
        return candidates.map(candidate => ({
            id: candidate._id.toString(),
            name: candidate.name,
            position: candidate.position,
            description: candidate.description,
            imageUrl: candidate.imageUrl,
            year: candidate.year,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt
        }));
    }
    async getCandidatesByPosition(position) {
        const candidates = await CandidateModel.find({ position });
        return candidates.map(candidate => ({
            id: candidate._id.toString(),
            name: candidate.name,
            position: candidate.position,
            description: candidate.description,
            imageUrl: candidate.imageUrl,
            year: candidate.year,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt
        }));
    }
    async submitVotes(votesToSubmit) {
        const votes = votesToSubmit.map(vote => ({
            ...vote,
            studentId: new mongoose.Types.ObjectId(vote.studentId),
            candidateId: new mongoose.Types.ObjectId(vote.candidateId),
        }));
        // Save votes to main collection
        await VoteModel.insertMany(votes);
        // Save votes to year-based collections
        if (votesToSubmit.length > 0) {
            await this.saveVotesToYearCollections(votesToSubmit);
        }
    }
    async saveVotesToYearCollections(votesToSubmit) {
        // Get student info to determine year and URN
        const studentId = votesToSubmit[0].studentId;
        const student = await StudentModel.findById(studentId);
        if (!student) {
            console.error('Student not found for year-based vote storage:', studentId);
            return;
        }
        // Determine year collection based on student's year field from Excel import
        let yearModel;
        switch (student.year) {
            case 'second-year':
                yearModel = SecondYearVotesModel;
                break;
            case 'third-year':
                yearModel = ThirdYearVotesModel;
                break;
            case 'final-year':
                yearModel = FinalYearVotesModel;
                break;
            default:
                console.error('Invalid student year:', student.year);
                return;
        }
        // Get candidate details for each vote
        const yearVotes = await Promise.all(votesToSubmit.map(async (vote) => {
            const candidate = await CandidateModel.findById(vote.candidateId);
            return {
                urn: student.urn,
                studentId: new mongoose.Types.ObjectId(vote.studentId),
                candidateId: new mongoose.Types.ObjectId(vote.candidateId),
                candidateName: candidate?.name || 'Unknown Candidate',
                position: vote.position,
                votedAt: new Date()
            };
        }));
        // Save to appropriate year collection
        await yearModel.insertMany(yearVotes);
        console.log(`Saved ${yearVotes.length} votes to ${student.year} collection for student ${student.urn} (${yearModel.modelName})`);
    }
    async getVoteResults() {
        const results = await VoteModel.aggregate([
            {
                $group: {
                    _id: {
                        position: '$position',
                        candidateId: '$candidateId'
                    },
                    voteCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'candidates',
                    localField: '_id.candidateId',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            {
                $unwind: '$candidate'
            },
            {
                $project: {
                    position: '$_id.position',
                    candidateId: '$_id.candidateId',
                    candidateName: '$candidate.name',
                    voteCount: 1,
                    _id: 0
                }
            },
            {
                $sort: { position: 1, voteCount: -1 }
            }
        ]);
        return results.map(result => ({
            position: result.position,
            candidateId: result.candidateId.toString(),
            candidateName: result.candidateName,
            voteCount: result.voteCount,
        }));
    }
    async hasStudentVoted(studentId) {
        const student = await StudentModel.findById(studentId, { hasVoted: 1 }).lean();
        return student?.hasVoted || false;
    }
    // Year-based vote retrieval methods
    async getSecondYearVotes() {
        return await SecondYearVotesModel.find().lean();
    }
    async getThirdYearVotes() {
        return await ThirdYearVotesModel.find().lean();
    }
    async getFinalYearVotes() {
        return await FinalYearVotesModel.find().lean();
    }
    async getVotesByYear(year) {
        switch (year) {
            case 'second':
                return this.getSecondYearVotes();
            case 'third':
                return this.getThirdYearVotes();
            case 'final':
                return this.getFinalYearVotes();
            default:
                throw new Error('Invalid year specified');
        }
    }
    async getYearBasedResults(year) {
        const votes = await this.getVotesByYear(year);
        return votes.map(vote => ({
            position: vote.position,
            candidateName: vote.candidateName,
            urn: vote.urn,
            votedAt: vote.votedAt
        }));
    }
}
export const mongoStorage = new MongoStorage();
//# sourceMappingURL=database-storage.js.map