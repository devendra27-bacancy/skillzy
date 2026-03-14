# Skillzy

Skillzy is a classroom engagement MVP built as a mobile-first web app/PWA with a Fastify + Socket.io API. The initial implementation includes:

- Teacher dashboard, deck builder, and live session controls
- Student join flow with MCQ, text, and drawing responses
- Realtime session updates and basic analytics
- CSV export and anonymous-mode aware reports

## Workspace layout

- `apps/web`: Next.js 15 frontend
- `apps/api`: Fastify API and realtime server
- `packages/types`: shared domain contracts
- `packages/ui`: shared UI primitives and tokens

## Getting started

1. Install dependencies with `npm install`
2. Copy [apps/api/.env.example](/D:/skillzy/apps/api/.env.example) to `apps/api/.env`
3. Copy [apps/web/.env.example](/D:/skillzy/apps/web/.env.example) to `apps/web/.env.local`
4. Run `npm run dev:api` and `npm run dev:web`
5. For a production-style API launch, run `npm run build -w @skillzy/api` then `npm run start -w @skillzy/api`

## Notes

- Google OAuth is still scaffolded and currently falls back to a local demo teacher profile.
- The API store now supports two persistence providers:
  - `STORE_PROVIDER=file`: local JSON storage for development
  - `STORE_PROVIDER=supabase`: Supabase-backed application state using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Apply [supabase/migrations/20260314_skillzy_app_state.sql](/D:/skillzy/supabase/migrations/20260314_skillzy_app_state.sql) before using the Supabase provider.

## Vercel + Supabase

- Deploy the Next.js app on Vercel with the project root set to [apps/web](/D:/skillzy/apps/web) if you prefer the simplest monorepo setup.
- Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
- Set `STORE_PROVIDER=supabase`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` for the API runtime.
- The current realtime Fastify + Socket.io server still runs as a separate Node process; this repo now supports Supabase persistence, but the live session server is not yet migrated into a Vercel-compatible realtime architecture.
