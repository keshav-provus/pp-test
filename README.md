# Planning Poker Web App

Internal tool for sprint story pointing at provus.ai

## Objective

Build a production-ready Planning Poker web app that:

- Uses Google authentication
- Integrates with Jira Cloud
- Supports real-time collaborative voting
- Deploys to Vercel
- Is stable enough for live sprint ceremonies

## Success Criteria

The implementation is successful when:

- Users log in with Google and are restricted to allowed domain(s)
- Host can create a session and invite participants
- Stories load from selected Jira board/sprint
- Users vote with Fibonacci cards and votes stay hidden until reveal
- Final estimate is pushed back to Jira story points
- App is deployed to Vercel with working production environment variables

## Proposed Architecture

- Frontend: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui
- Auth: NextAuth + Google Provider (domain-restricted)
- API Layer: Next.js route handlers for Jira/session operations
- Database: Supabase (sessions, participants, votes, audit events)
- Real-time: Supabase Realtime (or Socket.IO if needed)
- Deployment: Vercel

## Core Functional Scope

### Authentication

- Google OAuth login
- Restrict to `@provusinc.com` (or configurable allowlist domain)
- Secure session management
- Logout
- Optional: avatar display and host/participant role label

### Jira Integration

- Connect to Jira Cloud (OAuth 2.0 preferred, API token acceptable for phase 1)
- Select board and active sprint
- Fetch and display sprint issues
- Show issue key, title, description, and current story points
- Push final estimate back to Jira story points field
- Handle edge cases: missing sprint, missing story point field, expired token

### Session and Voting

- Host creates session with shareable URL and unique ID
- Authenticated users join via link
- Real-time participant list
- Fibonacci voting scale: `1, 2, 3, 5, 8, 13, 21, ?`
- Hidden votes until host reveals
- Show all votes, average, and majority
- Optional: outlier highlight and re-vote support

### Roles

- Host: create session, change story, reveal, re-vote, push estimate, end session
- Participant: vote and view results only

## Non-Functional Requirements

- Performance: target first load under 1.5s and low-latency vote updates
- Capacity: support at least 10 concurrent users in one room
- Security: no client-side secret exposure, secure token storage, proper CORS/domain controls
- Reliability: clear error handling and graceful fallback for API failures

## UI Screens

- Login page
- Dashboard (create/join session)
- Session room (story panel, cards, participant list, reveal controls)
- Jira board/sprint selector
- Results panel

## Environment Variables

Use `.env.local` for local development and configure matching values in Vercel:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAIL_DOMAIN` (example: `provusinc.com`)
- `JIRA_BASE_URL`
- `JIRA_CLIENT_ID` / `JIRA_CLIENT_SECRET` (if OAuth)
- `JIRA_EMAIL` / `JIRA_API_TOKEN` (if token-based phase 1)
- `JIRA_STORY_POINTS_FIELD_ID` (example: `customfield_10016`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

### Scripts

- `pnpm dev` — run local app
- `pnpm lint` — lint checks
- `pnpm build` — production build
- `pnpm start` — start production build

## CI/CD

Workflow: `.github/workflows/vercel-deploy.yml`

- PR to `main`: run `lint` + `build`
- Push to `main`: run `lint` + `build` + Vercel production deploy

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Delivery Plan

### Phase 1 (MVP)

- Google login + domain restriction
- Session create/join + real-time presence
- Voting flow (hidden/reveal)
- Jira token-based read/write for story points

### Phase 2 (Production Hardening)

- Jira OAuth 2.0
- Better error handling and observability
- Session controls (re-vote, end session, host reassignment)

### Phase 3 (Stretch)

- Voting timer
- Estimation history dashboard
- Dark mode polish

## Definition of Done

- All success criteria are met in a real sprint simulation
- No critical bugs in auth, voting, or Jira update path
- README and setup docs are complete
- Live Vercel URL is verified
