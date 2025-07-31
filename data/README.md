# Student Data Management

This folder contains student data files organized by academic year.

## Folder Structure

```
data/
├── students/
│   ├── second-year/     # Second year students Excel files
│   ├── third-year/      # Third year students Excel files
│   └── final-year/      # Final year students Excel files
└── README.md           # This file
```

## Excel File Format

Your Excel files should have the following columns:

| Column A | Column B | Column C |
|----------|----------|----------|
| **URN** | **Name** | **Mother Name** |
| 2021AI001 | John Doe | Jane Doe |
| 2021AI002 | Mary Smith | Susan Smith |

### Column Requirements:
- **URN (Column A):** Student's University Registration Number (e.g., 2021AI001)
- **Name (Column B):** Student's full name
- **Mother Name (Column C):** Student's mother's name (used for authentication)

## File Naming Convention

Please name your Excel files using this format:
- `second-year-students.xlsx`
- `third-year-students.xlsx` 
- `final-year-students.xlsx`

Or you can be more specific:
- `ai-ds-second-year-2023.xlsx`
- `ai-ds-third-year-2022.xlsx`
- `ai-ds-final-year-2021.xlsx`

## Important Notes

1. **URN Format:** Ensure URNs follow your institution's format
2. **Mother's Name:** This will be used for student authentication
3. **No Duplicates:** Make sure each URN is unique across all files
4. **Case Sensitivity:** Names are case-sensitive during login

## Data Import

After placing your Excel files in the appropriate folders, you can use the import script:

```bash
npm run import-students
```

This will read all Excel files and populate the database with student data.
