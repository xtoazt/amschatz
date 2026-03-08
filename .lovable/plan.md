# Plan: Fix Admin Kick + Add Changelog Page

## 1. Fix Admin Kick — Ensure Proper Removal

**Problem**: The kick handler removes the channel but doesn't call `channel.untrack()` first, so the kicked user's presence key can linger in the presence state for other users. Also, `alert()` is off-brand.

**Fix in `src/hooks/use-chat.ts**` (kick handler, ~line 323):

- Before `supabase.removeChannel()`, call `channelRef.current.untrack()` to properly remove presence
- Replace `alert()` with a state-based approach: add a `kickedMessage` field to state, or simply re-use the join screen with a toast/system notification
- Actually, simpler: just ensure `untrack()` is called. The `alert()` can be replaced with a toast via `sonner` for a terminal-style notification on the join screen

**Fix in `kickUser` function** (~line 630):

- The kick broadcast + local system message look correct. No changes needed there.

**Summary of kick fix**:

- Add `await channelRef.current.untrack()` before `removeChannel` in the kick receive handler
- Replace `alert()` with a toast notification shown after redirect to join screen

## 2. Add Changelog Page (GitHub Commits)

**Repo**: `https://github.com/hypnotized1337/Anonymous-Chat`

**Approach**: when user refreshes after an update,  show dialog of changelogs  that fetches commits from the GitHub API (`https://api.github.com/repos/hypnotized1337/Anonymous-Chat/commits`) on load. No API key needed for public repos (rate-limited to 60 req/hr which is fine).

### New files:

- `**src/pages/Changelog.tsx**` — Fetches commits from GitHub API, displays them in a terminal-style list with date, commit message, and short SHA. Black/white aesthetic with JetBrains Mono. Auto-refreshes on page visit.

### Edits:

- `**src/App.tsx**` — Add `/changelog` route
- `**src/components/JoinScreen.tsx**` or `**src/pages/Index.tsx**` — Add a small "Changelog" link (e.g., in the join screen footer) using `react-router-dom` `Link`

### Changelog UI:

- Terminal-style full-page view with a back button
- Each commit rendered as a row: `[short-sha] commit message` with date
- Grouped by date, most recent first
- Fetches latest 5
- Loading skeleton and error states

## Files to Edit/Create


| File                            | Change                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `src/hooks/use-chat.ts`         | Add `untrack()` before channel removal on kick; replace `alert()` with state flag |
| `src/pages/Changelog.tsx`       | **New** — GitHub commits changelog page                                           |
| `src/App.tsx`                   | Add `/changelog` route                                                            |
| `src/components/JoinScreen.tsx` | Add changelog link in footer                                                      |
