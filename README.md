# AISA Elections 2025

A full-stack web application for conducting student elections for the **AI & DS Student Association (AISA)** at **ADCET**. The platform enables secure student authentication, digital ballot casting, and real-time election result tracking.

## Features

### Student Voting
- **Secure Authentication** — Login using University Roll Number (URN) and mother's name
- **Digital Ballot** — Vote for President, Vice President, Secretary, and Treasurer positions
- **One-Vote Guarantee** — Each student can vote exactly once; enforced at the database level
- **Live Results** — Real-time vote counts with percentages and progress bars, auto-refreshing every 5 seconds

### Admin Dashboard
- **Student Management** — View, search, filter by year, and manage student records
- **Bulk Import** — Import students via CSV with preview before committing
- **Election Monitoring** — Track voting progress and access live results

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript 5.6 | Type safety |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 3 | Styling |
| shadcn/ui | Accessible UI components |
| TanStack React Query | Data fetching & caching |
| React Router DOM v7 | Client-side routing |
| Recharts | Data visualization |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js / Bun | Runtime |
| Express.js v5 | API framework |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database & ORM |

### Deployment
- **Platform:** Vercel
- **Frontend:** `@vercel/static-build`
- **Backend:** `@vercel/node`

## Project Structure

```
voting/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/            # Route pages (login, voting, results, admin)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities, API clients, auth logic
│   │   └── types/            # Shared TypeScript types
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                   # Express API server
│   ├── index.ts              # Main server & API routes
│   ├── config/               # Database configuration
│   ├── models/               # Mongoose schemas
│   └── scripts/              # Database utility scripts
├── data/                     # Election data
│   └── students/             # Student CSV files by year
├── vercel.json               # Vercel deployment config
└── package.json              # Root build orchestration
```

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun**
- **MongoDB** (local or Atlas)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd voting
```

2. **Install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/aisa-voting
PORT=3000
ADMIN_KEY=your-admin-key-here
```

4. **Start the development servers**

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate student (URN + mother's name) |
| `GET` | `/api/candidates` | Fetch all candidates grouped by position |
| `POST` | `/api/votes` | Submit votes (transactional) |
| `GET` | `/api/results` | Get election results (optionally filtered by year) |
| `GET` | `/api/voting-status/:studentId` | Check if a student has voted |
| `GET` | `/admin/students` | List all students (admin only) |

## Database Models

### Student
| Field | Type | Description |
|---|---|---|
| `urn` | String | University Roll Number (unique) |
| `motherName` | String | Mother's name (used for authentication) |
| `year` | String | second-year / third-year / final-year |
| `hasVoted` | Boolean | Voting status flag |
| `votedAt` | Date | Timestamp of vote submission |

### Candidate
| Field | Type | Description |
|---|---|---|
| `name` | String | Candidate's full name |
| `position` | String | PRESIDENT / VICE_PRESIDENT / SECRETARY / TREASURER |
| `imageUrl` | String | Candidate photo URL |
| `year` | String | Academic year |

### Vote
| Field | Type | Description |
|---|---|---|
| `studentId` | ObjectId | Reference to Student |
| `candidateId` | ObjectId | Reference to Candidate |
| `position` | String | Position voted for |

> A compound unique index on `(studentId, position)` prevents double-voting at the database level.

## Deployment

The project is configured for deployment on **Vercel**:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Refer to `vercel.json` for build and route configuration.

## Development Notes

- **Authentication** uses mother's name as a shared secret — a common pattern in Indian institutional systems
- **Transactional voting** uses MongoDB sessions to atomically create vote records and mark students as having voted
- **Live updates** are achieved via React Query's `refetchInterval` (5s for results, 10s for voting status)
- **Mobile-first design** with touch-friendly targets (44px minimum) and responsive layouts

## License

This project is for internal use by the AI & DS Student Association, ADCET.
