import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { database } from './db';
import { CandidateModel, Position, PositionType } from './shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CandidateCSVRow {
  name: string;
  position: string;
  imageUrl: string;
  year: string;
}

async function importCandidates() {
  try {
    // Connect to database
    await database.connect();
    console.log('Connected to database');

    // Clear existing candidates
    await CandidateModel.deleteMany({});
    console.log('Cleared existing candidates');

    const candidates: CandidateCSVRow[] = [];
    const csvPath = path.join(__dirname, '../data/aisa_voting.candidates.csv');

    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: CandidateCSVRow) => {
          candidates.push(row);
        })
        .on('end', () => {
          console.log(`Read ${candidates.length} candidates from CSV`);
          resolve();
        })
        .on('error', reject);
    });

    // Insert candidates into database
    for (const candidate of candidates) {
      // Validate position
      const position = candidate.position as PositionType;
      if (!Object.values(Position).includes(position)) {
        console.warn(`Invalid position: ${candidate.position} for candidate: ${candidate.name}`);
        continue;
      }

      const newCandidate = new CandidateModel({
        name: candidate.name.trim(),
        position: position,
        imageUrl: candidate.imageUrl.trim(),
        year: candidate.year.trim(),
      });

      await newCandidate.save();
      console.log(`Added candidate: ${candidate.name} - ${candidate.position}`);
    }

    console.log('Successfully imported all candidates');

    // Display summary
    const totalCandidates = await CandidateModel.countDocuments();
    console.log(`\nTotal candidates in database: ${totalCandidates}`);

    // Show candidates by position
    for (const pos of Object.values(Position)) {
      const count = await CandidateModel.countDocuments({ position: pos });
      console.log(`${pos}: ${count} candidates`);
    }

  } catch (error) {
    console.error('Error importing candidates:', error);
  } finally {
    await database.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importCandidates();
}

export { importCandidates };