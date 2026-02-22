# Architecture Plan — Health/Physio Management App

## Status: AWAITING REVIEW

---

## 1. Tech Stack

### Frontend
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14 (App Router)** | SSR for fast first paint, API routes co-located, React Server Components for data-heavy views |
| Language | **TypeScript** | Type safety across the full stack; critical for medical data models |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid UI development, accessible components out of the box |
| Body Map | **SVG + React** | Custom SVG human body with interactive regions; no heavy dependency needed |
| State | **Zustand** | Lightweight, no boilerplate; good for local UI state (selected body part, filters) |
| Charts | **Recharts** | Pain severity trends over time |

### Backend
| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | **Next.js Route Handlers** | Co-located with frontend, no separate server to deploy |
| Database | **PostgreSQL** | Relational data with strong consistency; good for structured medical records |
| ORM | **Prisma** | Type-safe queries, migrations, great DX with TypeScript |
| Auth | **NextAuth.js (Auth.js v5)** | Flexible providers, session management, DB-backed sessions |
| AI Integration | **Anthropic Claude API** | Plan review and exercise prioritisation via structured prompts |

### Infrastructure
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Hosting | **Vercel** | Zero-config Next.js deployment |
| Database | **Vercel Postgres or Supabase** | Managed Postgres, easy connection pooling |
| File Storage | **Vercel Blob or S3** | For uploaded treatment plan documents (PDFs, images) |

---

## 2. Data Model

### Core Entities

```
User
├── id              (uuid, PK)
├── email           (string, unique)
├── name            (string)
├── createdAt       (timestamp)
└── updatedAt       (timestamp)

Condition
├── id              (uuid, PK)
├── userId          (uuid, FK → User)
├── name            (string)           — e.g. "Lower back disc herniation"
├── bodyRegion      (enum)             — e.g. LOWER_BACK, LEFT_KNEE, RIGHT_SHOULDER
├── severity        (int, 1-10)        — current pain level
├── status          (enum)             — ACTIVE | MANAGED | RESOLVED
├── diagnosedAt     (date, nullable)
├── notes           (text)
├── createdAt       (timestamp)
└── updatedAt       (timestamp)

TreatmentPlan
├── id              (uuid, PK)
├── conditionId     (uuid, FK → Condition)
├── title           (string)           — e.g. "Physio plan from Dr. Smith"
├── source          (string)           — who prescribed it
├── rawContent      (text)             — pasted or extracted plan text
├── aiReview        (json, nullable)   — structured AI analysis result
├── reviewedAt      (timestamp, nullable)
├── createdAt       (timestamp)
└── updatedAt       (timestamp)

Exercise
├── id              (uuid, PK)
├── treatmentPlanId  (uuid, FK → TreatmentPlan)
├── name            (string)           — e.g. "Bird-dog hold"
├── description     (text)
├── sets            (int, nullable)
├── reps            (int, nullable)
├── durationSecs    (int, nullable)    — for timed exercises
├── frequency       (enum)             — DAILY | ALTERNATE_DAYS | WEEKLY | AS_NEEDED
├── priority        (int)              — relative importance within plan
├── bodyRegion      (enum)             — links back to body map
├── createdAt       (timestamp)
└── updatedAt       (timestamp)

DailyRoutine
├── id              (uuid, PK)
├── userId          (uuid, FK → User)
├── date            (date)
├── exercises       (json)             — ordered list of exercise IDs + status
├── generatedBy     (enum)             — AI | MANUAL
├── totalMinutes    (int)              — estimated duration
├── createdAt       (timestamp)
└── updatedAt       (timestamp)

ExerciseLog
├── id              (uuid, PK)
├── dailyRoutineId  (uuid, FK → DailyRoutine)
├── exerciseId      (uuid, FK → Exercise)
├── completed       (boolean)
├── painBefore      (int, 1-10, nullable)
├── painAfter       (int, 1-10, nullable)
├── notes           (text, nullable)
├── completedAt     (timestamp, nullable)
└── createdAt       (timestamp)
```

### Key Enum: BodyRegion
```
HEAD | NECK | LEFT_SHOULDER | RIGHT_SHOULDER | UPPER_BACK |
LOWER_BACK | CHEST | LEFT_ARM | RIGHT_ARM | LEFT_HAND | RIGHT_HAND |
LEFT_HIP | RIGHT_HIP | LEFT_KNEE | RIGHT_KNEE | LEFT_ANKLE |
RIGHT_ANKLE | LEFT_FOOT | RIGHT_FOOT | LEFT_WRIST | RIGHT_WRIST
```

---

## 3. File Structure

```
Medical-App/
├── CLAUDE.md
├── README.md
├── tasks/
│   ├── todo.md
│   └── lessons.md
├── prisma/
│   └── schema.prisma
├── public/
│   └── body-map.svg              — base SVG for the human body
├── src/
│   ├── app/
│   │   ├── layout.tsx            — root layout (nav, providers)
│   │   ├── page.tsx              — dashboard (body map)
│   │   ├── conditions/
│   │   │   ├── page.tsx          — list conditions
│   │   │   └── [id]/
│   │   │       └── page.tsx      — condition detail + treatment plans
│   │   ├── plans/
│   │   │   ├── page.tsx          — all treatment plans
│   │   │   └── [id]/
│   │   │       ├── page.tsx      — plan detail
│   │   │       └── review/
│   │   │           └── page.tsx  — AI review results
│   │   ├── daily/
│   │   │   └── page.tsx          — today's exercise routine
│   │   ├── history/
│   │   │   └── page.tsx          — exercise log history + trends
│   │   └── api/
│   │       ├── conditions/
│   │       │   └── route.ts
│   │       ├── plans/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── review/
│   │       │           └── route.ts  — AI review endpoint
│   │       ├── exercises/
│   │       │   └── route.ts
│   │       ├── daily/
│   │       │   └── route.ts         — AI routine generation
│   │       └── log/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                   — shadcn/ui primitives
│   │   ├── body-map/
│   │   │   ├── BodyMap.tsx       — main interactive SVG component
│   │   │   ├── BodyRegion.tsx    — individual clickable region
│   │   │   └── SeverityLegend.tsx
│   │   ├── conditions/
│   │   │   ├── ConditionCard.tsx
│   │   │   └── ConditionForm.tsx
│   │   ├── plans/
│   │   │   ├── PlanCard.tsx
│   │   │   ├── PlanForm.tsx
│   │   │   └── AIReviewDisplay.tsx
│   │   ├── daily/
│   │   │   ├── RoutineList.tsx
│   │   │   └── ExerciseCheckbox.tsx
│   │   └── shared/
│   │       ├── Nav.tsx
│   │       └── PainSlider.tsx
│   ├── lib/
│   │   ├── db.ts                 — Prisma client singleton
│   │   ├── ai.ts                 — Claude API wrapper
│   │   ├── prompts/
│   │   │   ├── plan-review.ts    — structured prompt for plan analysis
│   │   │   └── daily-routine.ts  — structured prompt for exercise prioritisation
│   │   └── utils.ts
│   ├── stores/
│   │   └── bodyMapStore.ts       — Zustand store for UI state
│   └── types/
│       └── index.ts              — shared TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

---

## 4. Phased Build Plan

### Phase 1 — Foundation (scaffold + body map)
- [ ] Initialise Next.js project with TypeScript, Tailwind, shadcn/ui
- [ ] Set up Prisma with PostgreSQL; define schema; run initial migration
- [ ] Build the `BodyMap` SVG component with clickable regions
- [ ] Implement `Condition` CRUD (API routes + forms)
- [ ] Wire body map to conditions — colour regions by worst severity
- [ ] Basic nav and layout
- **Deliverable:** Interactive body map showing user's conditions

### Phase 2 — Treatment Plans + AI Review
- [ ] Implement `TreatmentPlan` CRUD linked to conditions
- [ ] Build plan input form (paste text or describe plan)
- [ ] Integrate Claude API for plan review
- [ ] Design structured prompt: check plan against best practices, flag gaps, suggest improvements
- [ ] Build `AIReviewDisplay` component to render structured feedback
- [ ] Add `Exercise` extraction from plans (manual entry + AI-assisted parsing)
- **Deliverable:** Users can input plans and get AI-powered review feedback

### Phase 3 — Daily Exercise Prioritiser
- [ ] Build daily routine generation endpoint using Claude API
- [ ] Prompt design: account for all active conditions, severity, exercise frequency, estimated time budget
- [ ] Build `RoutineList` UI with checkable exercises
- [ ] Implement `ExerciseLog` tracking (completed, pain before/after)
- [ ] "Regenerate" option with adjusted constraints
- **Deliverable:** AI-generated daily routine that balances all conditions

### Phase 4 — Polish + History
- [ ] Exercise history view with pain trend charts (Recharts)
- [ ] Condition timeline (severity changes over time)
- [ ] Pain before/after correlation insights
- [ ] Responsive design pass (mobile-first for daily use)
- [ ] Loading states, error boundaries, empty states
- **Deliverable:** Complete, polished MVP

### Phase 5 — Auth + Deployment (when ready for multi-user)
- [ ] Add NextAuth.js with email/password or OAuth
- [ ] Scope all queries to authenticated user
- [ ] Deploy to Vercel with managed Postgres
- [ ] Environment variable configuration
- [ ] Basic rate limiting on AI endpoints
- **Deliverable:** Production-ready deployed application

---

## Design Decisions & Trade-offs

| Decision | Reasoning |
|----------|-----------|
| SVG body map vs. library | No mature React body-map library exists; custom SVG gives full control over regions, styling, and interaction |
| PostgreSQL vs. SQLite | App has relational data (conditions → plans → exercises); Postgres scales to production cleanly |
| AI as API call vs. embedded | Keep AI calls server-side only; protects API keys, allows prompt iteration without deploys via env vars |
| Zustand vs. Context | Body map needs fast, frequent state updates (hover, select); Zustand avoids re-render overhead |
| Phases skip auth initially | Faster iteration; auth adds complexity before core features are validated |
| Pain tracking on exercises | Enables data-driven feedback loop — the AI can eventually use this to refine recommendations |

---

## Open Questions for User

1. **Time budget:** Should the daily prioritiser ask the user "how many minutes do you have today?" or use a default?
2. **Plan input format:** Text paste only, or also support PDF/image upload (adds complexity)?
3. **Multi-user from day 1?** Or build single-user first and add auth later (Phase 5)?
4. **Offline support:** Important for gym/clinic use where connectivity may be limited?
