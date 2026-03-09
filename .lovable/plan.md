

## UI Polish Plan

Small refinements across the join screen, chat area, sidebar, and message bubbles to tighten the aesthetic.

### 1. Join Screen
- Add a subtle border (`border border-border/40`) around the form container and a slight `bg-card/30` background with `backdrop-blur-sm` to give it visual separation from the void
- Add more vertical breathing room between the tagline and the links at the bottom (`gap-3` instead of `gap-1.5`)
- Make the subtitle text ("messages self-destruct...") slightly dimmer and smaller for hierarchy

### 2. Chat Header
- Add a subtle bottom shadow/gradient fade instead of just a hard border — use `shadow-[0_1px_3px_rgba(0,0,0,0.3)]` for depth
- Show the room code (masked) in the center of the header for context when in a room

### 3. Message Bubbles
- Increase horizontal padding slightly (`px-3.5` from `px-3`) for more comfortable reading
- Add a very subtle `shadow-sm` to own messages (white bubbles) so they lift off the background
- Make the edit input match bubble styling more closely (same border-radius and padding)

### 4. Chat Sidebar
- Add a thin separator line between the room info section and the user list
- Style the "Leave" button with a subtle red tint on hover (`hover:text-red-400`) instead of plain foreground
- Add a subtle border-right to the sidebar (`border-r border-border/30`)

### 5. Input Bar
- Add a subtle focus state to the input container — when the inner input is focused, the wrapper border brightens (`border-border` instead of `border-border/60`)
- Slightly increase the send button border-radius for a softer look

### 6. Typing Indicator
- Make the typing bubble slightly smaller and add a subtle fade-in animation with framer-motion

### Files changed
- `src/components/JoinScreen.tsx` — form container styling, spacing
- `src/components/ChatArea.tsx` — header, input bar focus state
- `src/components/chat/MessageBubble.tsx` — bubble padding, shadow
- `src/components/ChatSidebar.tsx` — separator, leave button, border

