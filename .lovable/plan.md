

## Plan: Cache Changelog AI Summary

Same pattern as the features page — store the summary in a new `changelog_summaries` table keyed by the latest commit SHA. When the user clicks "summarize with ai", the edge function checks the cache first.

### 1. Database Migration

Create `changelog_summaries` table (identical structure to `feature_summaries`):
- `id` (uuid PK), `latest_sha` (text), `summary` (text), `created_at` (timestamptz)
- RLS: public SELECT, no client INSERT/UPDATE/DELETE

### 2. Edge Function Update (`summarize-changelog`)

- Accept commits as before, but also accept a `latest_sha` field in the request body
- Import Supabase client (service role) to check `changelog_summaries` for matching SHA
- If cached → return immediately
- If not → call AI, store result, return summary

### 3. Frontend Update (`Changelog.tsx`)

- After fetching commits, grab `allCommits[0].sha` as the latest SHA
- Pass `latest_sha` alongside `commits` when invoking the function
- Show "cached" indicator like the features page does

### Files

| File | Change |
|---|---|
| Migration SQL | Create `changelog_summaries` table + RLS |
| `supabase/functions/summarize-changelog/index.ts` | Add Supabase client, cache check/write |
| `src/pages/Changelog.tsx` | Pass `latest_sha`, handle `cached` flag |

