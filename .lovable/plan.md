

## Fix Tooltip Timestamp Positioning

The timestamp tooltip uses Radix `TooltipContent` with `side="left"` or `side="right"`, but it's getting clipped/hidden behind the room header because there's no `z-index` or collision avoidance configured.

### Fix in `src/components/chat/MessageBubble.tsx` (lines 335-336)

Replace the Radix Tooltip approach with a simpler CSS hover-based inline timestamp that appears right next to the message bubble — no portal/overlay needed, so it can't be hidden behind the header.

**Approach:** Remove `TooltipProvider`/`Tooltip`/`TooltipTrigger`/`TooltipContent` entirely. Instead, add a hover state or CSS `group-hover` pattern: wrap the message row in a `group` class, and render a small absolute-positioned timestamp element that appears on hover, aligned to the left (for own messages) or right (for other messages) of the bubble — inline within the flex row.

### Changes:
1. Remove Tooltip imports and wrapper from the return JSX (lines 323-339)
2. Change the outer `div` wrapping the bubble to use `group` class and `relative` + `flex items-center`
3. Add a hover-revealed timestamp `<span>` positioned beside the bubble using `opacity-0 group-hover:opacity-100 transition-opacity` — placed before the bubble for own messages (left side) and after for others (right side)

Single file change: `src/components/chat/MessageBubble.tsx`

