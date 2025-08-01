import mongoose from 'mongoose';
import { Candidate } from '../models/Candidate';
import connectDB from '../config/database';

async function updateCandidateImages() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Define the mapping of candidate names to image files
    const candidateImageMapping: Record<string, string> = {
      'Prem Pratap Kadam': '/images/candidates/president/prem-pratap-kadam.jpg',
      'Saniya Javed Mulani': '/images/candidates/president/saniya-javed-mulani.jpg',
      // Add more candidates as needed - you can extend this mapping
      // Format: 'Candidate Full Name': '/images/candidates/position/filename.jpg'
    };

    console.log('Updating candidate images...');

    for (const [candidateName, imageUrl] of Object.entries(candidateImageMapping)) {
      const result = await Candidate.updateOne(
        { name: candidateName },
        { $set: { imageUrl: imageUrl } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ Updated image for ${candidateName}: ${imageUrl}`);
      } else {
        console.log(`⚠️  Candidate not found: ${candidateName}`);
      }
    }

    // Also set image URLs based on name patterns for automatic matching
    const allCandidates = await Candidate.find({});
    
    for (const candidate of allCandidates) {
      if (!candidate.imageUrl) {
        // Generate image URL based on name and position
        const nameForUrl = candidate.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        const positionForUrl = candidate.position.toLowerCase().replace('_', '-');
        const potentialImageUrl = `/images/candidates/${positionForUrl}/${nameForUrl}.jpg`;
        
        // Update the candidate with the potential image URL
        await Candidate.updateOne(
          { _id: candidate._id },
          { $set: { imageUrl: potentialImageUrl } }
        );
        
        console.log(`📸 Set potential image URL for ${candidate.name}: ${potentialImageUrl}`);
      }
    }

    console.log('✅ Candidate image update completed');
    
    // Display all candidates with their image URLs
    const updatedCandidates = await Candidate.find({});
    console.log('\n📋 Current candidates and their image URLs:');
    updatedCandidates.forEach(candidate => {
      console.log(`- ${candidate.name} (${candidate.position}): ${candidate.imageUrl || 'No image'}`);
    });

  } catch (error) {
    console.error('❌ Error updating candidate images:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateCandidateImages();
