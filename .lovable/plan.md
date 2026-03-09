

## Plan: Remove Emoji Reactions Feature

Remove all reaction-related code across the app. This touches 5 files (plus one file deletion).

### Changes

**1. Delete `src/components/chat/ReactionPicker.tsx`** — entire file removed.

**2. Delete `src/hooks/use-frequent-reactions.ts`** — entire file removed.

**3. `src/components/chat/MessageBubble.tsx`**
- Remove `ReactionPicker` import
- Remove `onReact`, `quickReactions`, `frequentlyUsed`, `recordReaction` from props interface
- Remove `showReactionPicker` state
- Remove `handleReact` function
- Remove `onDoubleClick` handler from bubble div
- Remove the reactions display block (`hasReactions` section with emoji buttons)
- Remove the `AnimatePresence` block that shows `ReactionPicker`
- Remove "React" context menu item

**4. `src/components/ChatArea.tsx`**
- Remove `useFrequentReactions` import and hook call
- Remove `onReact` from props interface and destructuring
- Stop passing `onReact`, `quickReactions`, `frequentlyUsed`, `recordReaction` to `MessageBubble`

**5. `src/pages/Index.tsx`**
- Remove `onReact={reactToMessage}` prop from `ChatArea`

**6. `src/hooks/use-chat.ts`**
- Remove `toggleReaction` function
- Remove `reactToMessage` from the hook's return and implementation
- Remove reaction-related broadcast handling

**7. `src/types/chat.ts`**
- Remove `reactions` field from `ChatMessage` interface

