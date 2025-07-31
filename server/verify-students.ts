#!/usr/bin/env node

import { database } from './db.js';
import { StudentModel } from './shared/schema.js';

async function verifyStudents() {
  console.log('🔍 Verifying student data...');
  
  try {
    // Connect to database
    await database.connect();
    
    // Get counts by year
    const secondYearCount = await StudentModel.countDocuments({ year: 'second-year' });
    const thirdYearCount = await StudentModel.countDocuments({ year: 'third-year' });
    const finalYearCount = await StudentModel.countDocuments({ year: 'final-year' });
    const totalCount = await StudentModel.countDocuments();
    
    console.log('📊 Student Statistics:');
    console.log(`   Total Students: ${totalCount}`);
    console.log(`   Second Year: ${secondYearCount}`);
    console.log(`   Third Year: ${thirdYearCount}`);
    console.log(`   Final Year: ${finalYearCount}`);
    
    // Show sample students from each year
    console.log('\n📝 Sample Students:');
    
    const secondYearSample = await StudentModel.findOne({ year: 'second-year' });
    if (secondYearSample) {
      console.log(`   Second Year: ${secondYearSample.urn} - ${secondYearSample.motherName}`);
    }
    
    const thirdYearSample = await StudentModel.findOne({ year: 'third-year' });
    if (thirdYearSample) {
      console.log(`   Third Year: ${thirdYearSample.urn} - ${thirdYearSample.motherName}`);
    }
    
    const finalYearSample = await StudentModel.findOne({ year: 'final-year' });
    if (finalYearSample) {
      console.log(`   Final Year: ${finalYearSample.urn} - ${finalYearSample.motherName}`);
    }
    
    // Check for duplicates
    const duplicates = await StudentModel.aggregate([
      { $group: { _id: '$urn', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate URNs:`);
      duplicates.forEach(dup => console.log(`   ${dup._id} (${dup.count} times)`));
    } else {
      console.log('\n✅ No duplicate URNs found');
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying students:', error);
  } finally {
    await database.disconnect();
  }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyStudents().catch(console.error);
}

export { verifyStudents };