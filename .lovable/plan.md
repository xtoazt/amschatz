

## UI Additions: Vibe & Quality-of-Life Improvements

Based on exploring the full codebase, here are focused improvements that fit the monochromatic, minimal aesthetic and genuinely improve daily use.

---

### 1. Double-tap to react (mobile UX)
Currently reactions require a context menu (right-click / long-press). Add double-tap on a message bubble to instantly toggle the first reaction (⚡) — common in modern chat apps.

**File:** `MessageBubble.tsx` — add `onDoubleClick` handler to the bubble div that calls `onReact(msg.id, '⚡')`.

---

### 2. "Scroll to bottom" shows when scrolled up (even without unreads)
Right now the FAB only appears when `isScrolledUp && unreadCount > 0`. If the user scrolls up to read history, they have no quick way to jump back unless new messages arrive. Show the button whenever scrolled up, badge only when there are unreads.

**File:** `ChatArea.tsx` — change condition from `isScrolledUp && unreadCount > 0` to just `isScrolledUp`.

---

### 3. Message timestamp on hover (instead of only on last-in-group)
Timestamps currently only show on the last message in a group. Add a subtle hover tooltip showing the exact time on every individual message for when users want precision.

**Files:** `MessageBubble.tsx` — wrap the bubble in a `Tooltip` from the existing radix tooltip, showing `formatTime(msg.timestamp)` on hover.

---

### 4. Copy message text via context menu
There's no way to copy a message without manually selecting text. Add a "Copy" option to the context menu.

**File:** `MessageBubble.tsx` — add a `ContextMenuItem` that calls `navigator.clipboard.writeText(msg.text)` and shows a toast.

---

### 5. Unread separator line
When the user scrolls up and new messages arrive, insert a thin "— new messages —" separator at the point where unread messages begin. This helps users orient when they scroll back down.

**Files:** `ChatArea.tsx` — track the first unread message ID when the user is scrolled up. Render a styled `<hr>` with label before that message.

---

### 6. Mobile sidebar toggle (user list)
The sidebar is hidden on mobile (`hidden md:flex`). Add a small users icon button in the header that opens the sidebar as a slide-over sheet on mobile.

**Files:** `ChatArea.tsx` (add toggle button), `Index.tsx` (manage open state), use existing `Sheet` component from `@/components/ui/sheet` to wrap `ChatSidebar` content on mobile.

---

### Summary of changes

| # | Feature | Files |
|---|---------|-------|
| 1 | Double-tap to react | `MessageBubble.tsx` |
| 2 | Always-visible scroll FAB | `ChatArea.tsx` |
| 3 | Timestamp tooltip on hover | `MessageBubble.tsx` |
| 4 | Copy to clipboard context menu | `MessageBubble.tsx` |
| 5 | Unread separator line | `ChatArea.tsx` |
| 6 | Mobile sidebar sheet | `ChatArea.tsx`, `Index.tsx` |

All changes use existing dependencies (framer-motion, radix, sonner) and stay within the monochromatic JetBrains Mono aesthetic.

