

## Bug: Password deleted immediately after room creation

**Root cause**: When a user creates a password-protected room and joins, the presence `sync` event fires initially before their own presence is tracked — showing 0 users. This triggers the `users.length === 0` check on line 434 of `use-chat.ts`, which immediately deletes the room password from the database. By the time another user tries to join, the password no longer exists.

## Fix

**In `src/hooks/use-chat.ts` (~line 434):**

Add a guard so the password deletion only fires after the room has had at least one user. Track whether presence has ever been non-empty before allowing cleanup:

```typescript
let hasHadUsers = false;

// Inside presence sync handler:
if (users.length > 0) {
  hasHadUsers = true;
}

if (users.length === 0 && hasHadUsers) {
  // Only clean up password after room was actually occupied and then emptied
  supabase.functions.invoke('room-password', {
    body: { action: 'delete', roomCode: currentRoom },
  }).catch(() => {});
}
```

This ensures the password is only deleted when the room truly empties (all users left), not on the initial sync before the creator's presence is registered.

## Files Changed
- `src/hooks/use-chat.ts` — add `hasHadUsers` guard around password deletion

