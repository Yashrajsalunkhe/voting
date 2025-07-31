#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugCSV() {
  const filePath = path.resolve(__dirname, '../data/students/final-year/Btech .csv');
  
  console.log('🔍 Debugging final year CSV file...');
  console.log('File path:', filePath);
  
  let rowCount = 0;
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rowCount++;
      if (rowCount <= 5) {
        console.log(`\nRow ${rowCount}:`);
        console.log('Keys:', Object.keys(row));
        console.log('Values:', Object.values(row));
        console.log('Raw row:', row);
      }
    })
    .on('end', () => {
      console.log(`\nTotal rows processed: ${rowCount}`);
    })
    .on('error', (error) => {
      console.error('Error:', error);
    });
}

debugCSV();