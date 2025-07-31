#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { database } from './db.js';
import { StudentModel } from './shared/schema.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
    URN?: string;
    Name?: string;
    "Mother's Name"?: string;
    "Mother Name"?: string;
    [key: string]: any;
}

interface StudentData {
    urn: string;
    name: string;
    motherName: string;
    year: 'second-year' | 'third-year' | 'final-year';
}

class StudentImporter {
    private students: StudentData[] = [];

    async importStudents() {
        console.log('🚀 Starting student data import...');

        try {
            // Connect to database
            await database.connect();
            console.log('✅ Connected to database');

            // Clear existing students (optional - comment out if you want to keep existing data)
            await StudentModel.deleteMany({});
            console.log('🗑️  Cleared existing student data');

            // Import from each year
            await this.importFromYear('second-year', '../data/students/second-year');
            await this.importFromYear('third-year', '../data/students/third-year');
            await this.importFromYear('final-year', '../data/students/final-year');

            // Insert all students into database
            if (this.students.length > 0) {
                await StudentModel.insertMany(this.students.map(student => ({
                    urn: student.urn,
                    motherName: student.motherName,
                    year: student.year,
                    hasVoted: false
                })), { ordered: false });

                console.log(`✅ Successfully imported ${this.students.length} students`);
                console.log(`   - Second Year: ${this.students.filter(s => s.year === 'second-year').length}`);
                console.log(`   - Third Year: ${this.students.filter(s => s.year === 'third-year').length}`);
                console.log(`   - Final Year: ${this.students.filter(s => s.year === 'final-year').length}`);
            } else {
                console.log('⚠️  No students found to import');
            }

        } catch (error) {
            console.error('❌ Error importing students:', error);
        } finally {
            await database.disconnect();
            console.log('👋 Disconnected from database');
        }
    }

    private async importFromYear(year: 'second-year' | 'third-year' | 'final-year', folderPath: string) {
        const fullPath = path.resolve(__dirname, folderPath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Folder not found: ${fullPath}`);
            return;
        }

        const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.csv'));

        if (files.length === 0) {
            console.log(`⚠️  No CSV files found in ${folderPath}`);
            return;
        }

        console.log(`📂 Processing ${year} files: ${files.join(', ')}`);

        for (const file of files) {
            const filePath = path.join(fullPath, file);
            await this.parseCSVFile(filePath, year);
        }
    }

    private async parseCSVFile(filePath: string, year: 'second-year' | 'third-year' | 'final-year'): Promise<void> {
        return new Promise((resolve, reject) => {
            const results: StudentData[] = [];
            let rowCount = 0;

            fs.createReadStream(filePath)
                .pipe(csv({ skipEmptyLines: true }))
                .on('data', (row: CSVRow) => {
                    rowCount++;
                    const student = this.parseStudentRow(row, year);
                    if (student) {
                        results.push(student);
                    }
                })
                .on('end', () => {
                    console.log(`   ✅ Parsed ${results.length} students from ${path.basename(filePath)} (${rowCount} total rows)`);
                    this.students.push(...results);
                    resolve();
                })
                .on('error', (error) => {
                    console.error(`   ❌ Error parsing ${path.basename(filePath)}:`, error);
                    reject(error);
                });
        });
    }

    private parseStudentRow(row: CSVRow, year: 'second-year' | 'third-year' | 'final-year'): StudentData | null {
        // Handle different column name variations - check all possible keys
        let urn = '';
        let name = '';
        let motherName = '';

        // Find URN field (case insensitive, with/without spaces)
        for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === 'urn') {
                urn = row[key] || '';
                break;
            }
        }

        // Find Name field (case insensitive, with/without spaces)
        for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === 'name' || lowerKey === 'name ') {
                name = row[key] || '';
                break;
            }
        }

        // Find Mother's Name field (case insensitive, with/without spaces, different variations)
        for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === "mother's name" ||
                lowerKey === "mother name" ||
                lowerKey === "mother's name " ||
                lowerKey === "mothername") {
                motherName = row[key] || '';
                break;
            }
        }

        // Skip empty rows or rows without essential data
        if (!urn || !motherName) {
            return null;
        }

        // Clean and normalize data
        const cleanUrn = urn.toString().trim();
        const cleanName = name.toString().trim();
        const cleanMotherName = motherName.toString().trim();

        // Skip if any required field is empty after cleaning
        if (!cleanUrn || !cleanMotherName) {
            return null;
        }

        // Skip rows that are clearly headers or invalid data
        if (cleanUrn.toLowerCase() === 'urn' || cleanMotherName.toLowerCase().includes('mother')) {
            return null;
        }

        return {
            urn: cleanUrn,
            name: cleanName,
            motherName: cleanMotherName,
            year
        };
    }
}

// Run the importer if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const importer = new StudentImporter();
    importer.importStudents().catch(console.error);
}

export { StudentImporter };