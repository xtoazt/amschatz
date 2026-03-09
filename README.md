# V0ID Chat

A minimalist, account-free, ephemeral chat application. No sign-ups, no tracking, no data retention. Built for privacy and optimized for low-spec hardware.

**[Live →](https://v0id-chat.lovable.app)**

---

## Preview

| Join Screen | Chat View |
|:-----------:|:---------:|
| ![Join Screen](public/screenshots/join-screen.png) | ![Chat View](public/screenshots/chat-view.png) |

---

## Features

### 💀 Ephemeral by Design
- **10-minute auto-purge** — every message, image, and GIF is permanently wiped from the database after 10 minutes
- **No accounts** — join any room with just a username and room code
- **No data retention** — nothing is stored, logged, or recoverable

### 💬 iMessage-Grade UX
- **Real-time messaging** via WebSocket channels
- **Typing indicators** — see who's composing a message
- **Read receipts** — sent → delivered → read status on every message
- **Edit & unsend** — modify or delete your own messages after sending
- **Reply threads** — reply to specific messages with inline previews
- **Emoji reactions** — react to any message with emoji

### 🖼 Media Sharing
- **Image uploads** — drag-and-drop or file picker with upload progress
- **File attachments** — share documents with file inspector preview
- **GIF search** — integrated Klipy API with monochromatic grayscale filter
- **Fullscreen image viewer** — click any image to view in a lightbox
- **Auto-expiring media** — uploaded images are purged alongside messages

### 🎛 Hidden Admin Terminal
Type `/admin` in chat to access a command-line admin panel:
- **Nuke** — instantly wipe the entire room with a dissolve animation
- **Freeze** — lock the chat so no one can send messages
- **Announcements** — broadcast system-wide messages
- **Kick users** — remove specific users from the room
- **Message logs** — inspect all room activity

### 🖥 UI & Accessibility
- **Monochromatic design** — strict black-and-white aesthetic, zero branding
- **UI scaling** — adjustable interface scale (100%–150%) persisted across sessions
- **Dark mode** — native dark theme
- **Screenshot detection** — alerts the room when someone takes a screenshot
- **Notification controls** — toggle browser notifications per session
- **Mobile responsive** — full functionality on any screen size

### 🔒 Security
- **Rate limiting** — 5 messages per 3-second window
- **Input validation** — all payloads validated with Zod schemas
- **Admin authentication** — server-side admin verification via backend functions
- **No client-side secrets** — admin status verified through secure endpoints

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Animation | Framer Motion |
| Realtime | Supabase Realtime (WebSocket) |
| Storage | Supabase Storage (auto-purged) |
| Backend | Supabase Edge Functions |
| GIFs | Klipy API |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter a username and room code, and start chatting.

---

## License

MIT
