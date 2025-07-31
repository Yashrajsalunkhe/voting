import mongoose from 'mongoose';
import { Student, Candidate, Vote, SecondYearVotes, ThirdYearVotes, FinalYearVotes } from '../models/index.js';
import connectDB from '../config/database.js';

// This script can be used to verify your existing data works with the new Mongoose models
// or to migrate data if there are any structural changes needed

async function verifyMigration() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to database successfully');
    
    // Test each model by counting documents
    const studentCount = await Student.countDocuments();
    const candidateCount = await Candidate.countDocuments();
    const voteCount = await Vote.countDocuments();
    const secondYearVotesCount = await SecondYearVotes.countDocuments();
    const thirdYearVotesCount = await ThirdYearVotes.countDocuments();
    const finalYearVotesCount = await FinalYearVotes.countDocuments();
    
    console.log('Document counts:');
    console.log(`Students: ${studentCount}`);
    console.log(`Candidates: ${candidateCount}`);
    console.log(`Votes: ${voteCount}`);
    console.log(`Second Year Votes: ${secondYearVotesCount}`);
    console.log(`Third Year Votes: ${thirdYearVotesCount}`);
    console.log(`Final Year Votes: ${finalYearVotesCount}`);
    
    // Test a sample query from each collection
    const sampleStudent = await Student.findOne();
    const sampleCandidate = await Candidate.findOne();
    const sampleVote = await Vote.findOne();
    
    console.log('\nSample documents found:');
    console.log('Student:', sampleStudent ? 'Yes' : 'No');
    console.log('Candidate:', sampleCandidate ? 'Yes' : 'No');
    console.log('Vote:', sampleVote ? 'Yes' : 'No');
    
    console.log('\nMigration verification completed successfully!');
    
  } catch (error) {
    console.error('Migration verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the verification
if (require.main === module) {
  verifyMigration();
}

export { verifyMigration };
