

## Plan: Code Optimization & Cleanup

### Findings

After auditing the full codebase, here's what needs attention:

---

### 1. Remove unused `NavLink` component
`src/components/NavLink.tsx` is never imported anywhere. Dead code — delete it.

### 2. Remove duplicate toast system
The app uses **both** `sonner` (via `Sonner` in App.tsx) and the shadcn `Toaster` + `useToast` hook. All actual toast calls use `sonner` (`toast` from `'sonner'`). Remove the unused shadcn toast system:
- Remove `Toaster` import and usage from `App.tsx` (keep `Sonner`)
- Delete `src/hooks/use-toast.ts`
- Delete `src/components/ui/use-toast.ts`
- Delete `src/components/ui/toaster.tsx`
- Delete `src/components/ui/toast.tsx`

### 3. Remove unused `react-query` provider
`QueryClientProvider` wraps the app but nothing uses `react-query` hooks anywhere. Remove:
- `QueryClient` / `QueryClientProvider` import and wrapping from `App.tsx`

### 4. Remove unused `TooltipProvider`
No tooltips are used in the app. Remove the wrapper from `App.tsx`.

### 5. Optimize `ChatArea.tsx` — memoize callbacks and reduce re-renders
- The `messages.map()` render loop passes new object literals for `groupInfo` on every render. Extract grouping logic or memoize the grouped data.
- `handleSubmit`, `handleInputChange`, drag handlers are recreated every render. Wrap in `useCallback`.
- The `currentTime` 1-second ticker causes the entire ChatArea + all MessageBubbles to re-render every second. Move the ticker to only affect visible `SelfDestructTimer` components by using a shared context or making each timer self-ticking.

### 6. Optimize `use-chat.ts` — `toggleNotifications` stale closure
`toggleNotifications` depends on `state.notificationsEnabled` which makes it recreate on every state change. Use a functional setState pattern or ref instead.

### 7. Deduplicate reaction toggle logic
The reaction toggle logic (splice/add user from emoji array) is duplicated identically in both the broadcast handler (line 358-381) and `reactToMessage` (line 702-728). Extract to a shared helper function.

### 8. Remove stale comment
Line 161 in `use-chat.ts`: `// No longer needed — duplicate check is done post-join inside joinRoom` — orphan comment, remove it.

---

### Summary of changes

| File | Action |
|---|---|
| `src/components/NavLink.tsx` | Delete |
| `src/hooks/use-toast.ts` | Delete |
| `src/components/ui/use-toast.ts` | Delete |
| `src/components/ui/toaster.tsx` | Delete |
| `src/components/ui/toast.tsx` | Delete |
| `src/App.tsx` | Remove unused Toaster, QueryClient, TooltipProvider |
| `src/hooks/use-chat.ts` | Extract reaction helper, fix toggleNotifications closure, remove stale comment |
| `src/components/ChatArea.tsx` | Remove 1s ticker, memoize callbacks & groupInfo |
| `src/components/chat/SelfDestructTimer.tsx` | Make self-ticking (own interval) instead of receiving `currentTime` prop |
| `src/components/chat/MessageBubble.tsx` | Remove `currentTime` prop, simplify interface |

