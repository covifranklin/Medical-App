# PhysioTracker

A health and physio management app that brings all physical conditions and treatment plans into one place to help prioritise and plan daily exercises.

## Features

- **Body Map Dashboard** — Interactive human body showing pain points colour-coded by severity
- **AI-Powered Plan Review** — Analyses treatment plans against best practice using Claude
- **Daily Exercise Prioritiser** — Generates a manageable daily routine accounting for all conditions

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Anthropic Claude API

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
