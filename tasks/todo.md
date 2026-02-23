# PhysioTracker — Build Progress

## Decisions Made
- Time budget: ask user, default 30 minutes
- Plan input: text paste + PDF/image upload
- Auth: single-user first (Phase 5)
- Offline: not needed

---

## Phase 1 — Foundation (scaffold + body map)

- [x] Initialise Next.js 14 project with TypeScript, Tailwind CSS
- [x] Set up Prisma 7 with PostgreSQL + driver adapter
- [x] Define schema: User, Ailment, TreatmentPlan, Exercise, PainLog, DailyPlan, DailyPlanExercise
- [x] Run initial migration
- [x] Build `BodyMap` SVG component with front + back views
- [x] Map all 21 `BodyRegion` enum values to SVG paths
- [x] Colour-code regions by severity (grey/green/orange/red)
- [x] Build `RegionDetailPanel` with ailment cards, severity/status badges, pain logs
- [x] `GET /api/body-map` endpoint — ailments grouped by region with latest pain log
- [x] Zustand store for body map state (selected/hovered region, data)
- [x] Basic nav and layout
- [x] **Ailment CRUD** — API routes (GET all, POST, GET one, PUT, DELETE) with server-side validation
- [x] **AilmentForm component** — create/edit form with body region dropdown, severity, status, diagnosis, date, notes
- [x] **Ailments list page** — filterable by status (All/Active/Managed/Resolved) with severity/status badges
- [x] **Ailment detail page** — full detail view with edit-in-place, delete confirmation, pain logs, treatment plans
- [x] **Link body map to ailment creation** — click region → "Add ailment here" link pre-fills bodyRegion
- [ ] **Pain log CRUD** — daily pain logging per ailment

**Status: ~90% complete** — only pain log CRUD remains for Phase 1.

---

## Phase 2 — Treatment Plans + AI Review

- [ ] `TreatmentPlan` CRUD linked to ailments (API routes + forms)
- [ ] Plan input form (paste text or describe plan)
- [ ] PDF/image upload for treatment plans
- [ ] Integrate Claude API for plan review (`POST /api/plans/:id/review`)
- [ ] Build `AIReviewDisplay` component for structured feedback
- [ ] `Exercise` CRUD — manual entry linked to plans
- [ ] AI-assisted exercise extraction from plan text

**Status: Not started** — API route placeholders and prompt templates exist.

---

## Phase 3 — Daily Exercise Prioritiser

- [ ] `POST /api/daily` — generate daily plan via Claude API
- [ ] Time budget input (default 30 min)
- [ ] Build `RoutineList` UI with checkable exercises
- [ ] Pain logging on exercise completion (before/after)
- [ ] "Regenerate" option with adjusted constraints

**Status: Not started** — prompt template exists.

---

## Phase 4 — Polish + History

- [ ] Exercise history view with pain trend charts (Recharts)
- [ ] Ailment timeline (severity changes over time)
- [ ] Pain before/after correlation insights
- [ ] Responsive design pass (mobile-first)
- [ ] Loading states, error boundaries, empty states

**Status: Not started.**

---

## Phase 5 — Auth + Deployment

- [ ] Add NextAuth.js with email/password
- [ ] Scope all queries to authenticated user
- [ ] Deploy to Vercel with managed Postgres
- [ ] Environment variable configuration
- [ ] Rate limiting on AI endpoints

**Status: Not started.**

---

## What's Been Built

| Component | File(s) | Status |
|-----------|---------|--------|
| Next.js scaffold | `src/app/` | Done |
| Prisma schema (7 models, 5 enums) | `prisma/schema.prisma` | Done |
| Migration | `prisma/migrations/` | Applied |
| Body map SVG (front + back) | `src/components/body-map/` | Done |
| Region mapping (21 regions) | `src/components/body-map/regions.ts` | Done |
| Severity colour coding | `src/components/body-map/colours.ts` | Done |
| Ailment detail panel | `src/components/body-map/RegionDetailPanel.tsx` | Done |
| Body map API | `src/app/api/body-map/route.ts` | Done |
| Zustand store | `src/stores/bodyMapStore.ts` | Done |
| Navigation | `src/components/shared/Nav.tsx` | Done |
| Prisma client (adapter-pg) | `src/lib/db.ts` | Done |
| Anthropic SDK client | `src/lib/ai.ts` | Done |
| AI prompts | `src/lib/prompts/` | Done |
| Types | `src/types/index.ts` | Done |
| Ailment API (CRUD) | `src/app/api/ailments/` | Done |
| AilmentForm component | `src/components/ailments/AilmentForm.tsx` | Done |
| Ailments list page | `src/app/conditions/page.tsx` | Done |
| New ailment page | `src/app/conditions/new/page.tsx` | Done |
| Ailment detail page | `src/app/conditions/[id]/page.tsx` | Done |
| Pain log CRUD | — | Pending |
| Treatment plan CRUD | — | Phase 2 |
| AI plan review | — | Phase 2 |
| Daily plan generation | — | Phase 3 |
