import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, RoomUser, ChatState, ReplyTo } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { z } from 'zod';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substring(2, 12);
const TEN_MINUTES = 10 * 60 * 1000;

// Rate limiting config
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW = 3000; // 3 seconds

const ReplyToSchema = z.object({
  id: z.string().max(50),
  username: z.string().max(20),
  text: z.string().max(200),
}).optional();

const ChatMessageSchema = z.object({
  id: z.string().max(50),
  username: z.string().max(20),
  text: z.string().max(5000),
  timestamp: z.number(),
  type: z.enum(['message', 'system', 'announcement']),
  status: z.enum(['sent', 'delivered', 'read']).optional(),
  edited: z.boolean().optional(),
  deleted: z.boolean().optional(),
  imageUrl: z.string().url().max(2000).optional(),
  imageExpiry: z.number().optional(),
  fileUrl: z.string().url().max(2000).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().optional(),
  fileMimeType: z.string().max(100).optional(),
  replyTo: ReplyToSchema,
  reactions: z.record(z.array(z.string().max(20))).optional(),
});

const TypingSchema = z.object({ username: z.string().max(20) });
const ReadSchema = z.object({ messageId: z.string().max(50), reader: z.string().max(20) });
const BulkReadSchema = z.object({ messageIds: z.array(z.string().max(50)), reader: z.string().max(20) });
const FreezeSchema = z.object({ frozen: z.boolean(), by: z.string().max(20) });
const EditSchema = z.object({ messageId: z.string().max(50), newText: z.string().max(5000) });
const UnsendSchema = z.object({ messageId: z.string().max(50) });
const ScreenshotSchema = z.object({ username: z.string().max(20) });
const KickSchema = z.object({ username: z.string().max(20) });
const ReactionSchema = z.object({ messageId: z.string().max(50), emoji: z.string().max(4), username: z.string().max(20) });

function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('Invalid broadcast payload rejected:', result.error.message);
    return null;
  }
  return result.data;
}

export function useChat() {
  const [state, setState] = useState<ChatState>(() => {
    const savedNotif = typeof window !== 'undefined'
      ? localStorage.getItem('chat_notif_pref') === 'true'
      : false;
    return {
      username: '',
      roomCode: '',
      messages: [],
      users: [],
      isJoined: false,
      notificationsEnabled: savedNotif,
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    };
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const notificationsRef = useRef(state.notificationsEnabled);
  const usernameRef = useRef(state.username);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sendTimestamps = useRef<number[]>([]);

  useEffect(() => { notificationsRef.current = state.notificationsEnabled; }, [state.notificationsEnabled]);
  useEffect(() => { usernameRef.current = state.username; }, [state.username]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Auto-delete expired messages (older than 10 minutes)
  useEffect(() => {
    if (!state.isJoined) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setState(prev => {
        const filtered = prev.messages.filter(m => now - m.timestamp < TEN_MINUTES);
        if (filtered.length === prev.messages.length) return prev;
        return { ...prev, messages: filtered };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [state.isJoined]);

  // Rate limiter check
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    sendTimestamps.current = sendTimestamps.current.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (sendTimestamps.current.length >= RATE_LIMIT_COUNT) {
      // Inject local system message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: generateId(),
          username: 'system',
          text: '[SYSTEM]: RATE LIMITED — SLOW DOWN',
          timestamp: Date.now(),
          type: 'system',
        }],
      }));
      return false;
    }
    sendTimestamps.current.push(now);
    return true;
  }, []);

  // Window focus listener: mark all unread messages as read
  useEffect(() => {
    const handleFocus = () => {
      if (!channelRef.current) return;
      setState(prev => {
        const unreadIds = prev.messages
          .filter(m => m.type === 'message' && m.username !== usernameRef.current && m.status !== 'read')
          .map(m => m.id);

        if (unreadIds.length === 0) return prev;

        channelRef.current?.send({
          type: 'broadcast',
          event: 'bulk-read',
          payload: { messageIds: unreadIds, reader: usernameRef.current },
        });

        return {
          ...prev,
          messages: prev.messages.map(m =>
            unreadIds.includes(m.id) ? { ...m, status: 'read' as const } : m
          ),
        };
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkUsernameAvailable = useCallback(async (username: string, roomCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const peekId = `_peek_${generateId()}`;
      const peekChannel = supabase.channel(`room:${roomCode}:peek:${peekId}`, {
        config: { presence: { key: peekId } },
      });

      let resolved = false;
      const finish = (available: boolean) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        peekChannel.untrack().then(() => supabase.removeChannel(peekChannel)).catch(() => supabase.removeChannel(peekChannel));
        resolve(available);
      };

      const timeout = setTimeout(() => finish(true), 4000);

      let syncCount = 0;
      peekChannel.on('presence', { event: 'sync' }, () => {
        syncCount++;
        // First sync is our own track, second sync includes existing users
        // Wait for at least the second sync or check after a delay
        if (syncCount >= 2) {
          const presenceState = peekChannel.presenceState();
          const activeKeys = Object.keys(presenceState).filter(k => !k.startsWith('_peek_'));
          const taken = activeKeys.includes(username);
          finish(!taken);
        }
      });

      peekChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await peekChannel.track({ _peek: true });
          // Also check after a delay in case only one sync fires
          setTimeout(() => {
            const presenceState = peekChannel.presenceState();
            const activeKeys = Object.keys(presenceState).filter(k => !k.startsWith('_peek_'));
            const taken = activeKeys.includes(username);
            finish(!taken);
          }, 1500);
        }
      });
    });
  }, []);

  const joinRoom = useCallback((username: string, roomCode: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: `${username} joined.`,
      timestamp: Date.now(),
      type: 'system',
    };

    setState(prev => ({
      ...prev,
      username,
      roomCode,
      isJoined: true,
      messages: [systemMsg],
      users: [],
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    }));

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: username } },
    });

    channel.on('broadcast', { event: 'message' }, (payload) => {
      const msg = safeParse(ChatMessageSchema, payload.payload);
      if (!msg) return;
      if (msg.username === usernameRef.current) return;

      const isFocused = document.hasFocus();
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { ...msg, status: isFocused ? 'read' : 'delivered' } as ChatMessage],
      }));

      if (isFocused && channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'read', payload: { messageId: msg.id, reader: usernameRef.current } });
      }

      if (notificationsRef.current && document.hidden) {
        new Notification(msg.username, { body: msg.text });
      }
    });

    channel.on('broadcast', { event: 'system' }, (payload) => {
      const msg = safeParse(ChatMessageSchema, payload.payload);
      if (!msg) return;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg as ChatMessage] }));
    });

    channel.on('broadcast', { event: 'announcement' }, (payload) => {
      const msg = safeParse(ChatMessageSchema, payload.payload);
      if (!msg) return;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg as ChatMessage] }));
    });

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const parsed = safeParse(TypingSchema, payload.payload);
      if (!parsed) return;
      const typingUser = parsed.username;
      if (typingUser === usernameRef.current) return;

      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.includes(typingUser) ? prev.typingUsers : [...prev.typingUsers, typingUser],
      }));

      if (remoteTypingTimeouts.current[typingUser]) clearTimeout(remoteTypingTimeouts.current[typingUser]);
      remoteTypingTimeouts.current[typingUser] = setTimeout(() => {
        setState(prev => ({ ...prev, typingUsers: prev.typingUsers.filter(u => u !== typingUser) }));
        delete remoteTypingTimeouts.current[typingUser];
      }, 3000);
    });

    channel.on('broadcast', { event: 'read' }, (payload) => {
      const parsed = safeParse(ReadSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === parsed.messageId ? { ...m, status: 'read' } : m),
      }));
    });

    channel.on('broadcast', { event: 'bulk-read' }, (payload) => {
      const parsed = safeParse(BulkReadSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          parsed.messageIds.includes(m.id) ? { ...m, status: 'read' } : m
        ),
      }));
    });

    channel.on('broadcast', { event: 'nuke' }, () => {
      setState(prev => ({
        ...prev,
        messages: [{
          id: generateId(),
          username: 'system',
          text: 'Session purged.',
          timestamp: Date.now(),
          type: 'system',
        }],
      }));
    });

    channel.on('broadcast', { event: 'freeze' }, (payload) => {
      const parsed = safeParse(FreezeSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({ ...prev, frozen: parsed.frozen, frozenBy: parsed.frozen ? parsed.by : null }));
    });

    channel.on('broadcast', { event: 'edit' }, (payload) => {
      const parsed = safeParse(EditSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === parsed.messageId ? { ...m, text: parsed.newText, edited: true } : m),
      }));
    });

    channel.on('broadcast', { event: 'unsend' }, (payload) => {
      const parsed = safeParse(UnsendSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === parsed.messageId ? { ...m, text: '', deleted: true } : m),
      }));
    });

    channel.on('broadcast', { event: 'screenshot' }, (payload) => {
      const parsed = safeParse(ScreenshotSchema, payload.payload);
      if (!parsed || parsed.username === usernameRef.current) return;
      const alertMsg: ChatMessage = {
        id: generateId(),
        username: 'system',
        text: `⚠ ${parsed.username} took a screenshot`,
        timestamp: Date.now(),
        type: 'system',
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, alertMsg] }));
    });

    // Kick event
    channel.on('broadcast', { event: 'kick' }, (payload) => {
      const parsed = safeParse(KickSchema, payload.payload);
      if (!parsed) return;
      if (parsed.username === usernameRef.current) {
        // We are being kicked — untrack presence first
        if (channelRef.current) {
          channelRef.current.untrack().then(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
          });
        }
        setState(prev => ({
          ...prev,
          isJoined: false,
          messages: [],
          users: [],
          username: '',
          roomCode: '',
          typingUsers: [],
          frozen: false,
          frozenBy: null,
        }));
        setTimeout(() => {
          toast.error('YOU HAVE BEEN REMOVED', {
            description: 'An admin removed you from the void.',
            duration: 5000,
          });
        }, 100);
      } else {
        // Someone else was kicked — show system message
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: generateId(),
            username: 'system',
            text: `${parsed.username} was removed.`,
            timestamp: Date.now(),
            type: 'system',
          }],
        }));
      }
    });

    // Reaction event
    channel.on('broadcast', { event: 'reaction' }, (payload) => {
      const parsed = safeParse(ReactionSchema, payload.payload);
      if (!parsed) return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => {
          if (m.id !== parsed.messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = [...(reactions[parsed.emoji] || [])];
          const idx = users.indexOf(parsed.username);
          if (idx >= 0) {
            users.splice(idx, 1);
            if (users.length === 0) {
              delete reactions[parsed.emoji];
            } else {
              reactions[parsed.emoji] = users;
            }
          } else {
            reactions[parsed.emoji] = [...users, parsed.username];
          }
          return { ...m, reactions: Object.keys(reactions).length > 0 ? reactions : undefined };
        }),
      }));
    });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users: RoomUser[] = Object.keys(presenceState).map(key => ({
        username: key,
        joinedAt: (presenceState[key]?.[0] as any)?.joinedAt ?? Date.now(),
      }));
      setState(prev => ({ ...prev, users }));

      if (users.length === 0) {
        setState(prev => ({ ...prev, messages: [] }));
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username, joinedAt: Date.now() });
        channel.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      }
    });

    channelRef.current = channel;
  }, []);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      const leaveMsg: ChatMessage = {
        id: generateId(),
        username: 'system',
        text: `${usernameRef.current} left.`,
        timestamp: Date.now(),
        type: 'system',
      };
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: leaveMsg });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isJoined: false,
      messages: [],
      users: [],
      username: '',
      roomCode: '',
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    }));
  }, []);

  const sendMessage = useCallback((text: string, replyTo?: ReplyTo) => {
    if (!text.trim()) return;
    if (!checkRateLimit()) return;

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
      ...(replyTo ? { replyTo } : {}),
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, [checkRateLimit]);

  const sendTyping = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { username: usernameRef.current } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, []);

  const sendGif = useCallback((gifUrl: string) => {
    if (!checkRateLimit()) return;

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: '',
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
      imageUrl: gifUrl,
      imageExpiry: Date.now() + TEN_MINUTES,
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, [checkRateLimit]);

  const toggleNotifications = useCallback(async () => {
    if (!state.notificationsEnabled) {
      localStorage.setItem('chat_notif_pref', 'true');
      setState(prev => ({ ...prev, notificationsEnabled: true }));
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      localStorage.setItem('chat_notif_pref', 'false');
      setState(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, [state.notificationsEnabled]);

  const nukeRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'nuke', payload: {} });
    }
    setState(prev => ({
      ...prev,
      messages: [{
        id: generateId(),
        username: 'system',
        text: 'Session purged.',
        timestamp: Date.now(),
        type: 'system',
      }],
    }));
  }, []);

  const freezeChat = useCallback(() => {
    setState(prev => {
      const newFrozen = !prev.frozen;
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'freeze', payload: { frozen: newFrozen, by: usernameRef.current } });
      }
      return { ...prev, frozen: newFrozen, frozenBy: newFrozen ? usernameRef.current : null };
    });
  }, []);

  const sendAnnouncement = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text,
      timestamp: Date.now(),
      type: 'announcement',
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'announcement', payload: msg });
    }
  }, []);

  const editMessage = useCallback((messageId: string, newText: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m),
    }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'edit', payload: { messageId, newText } });
    }
  }, []);

  const unsendMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', deleted: true } : m),
    }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'unsend', payload: { messageId } });
    }
  }, []);

  const sendImage = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    if (!checkRateLimit()) return;

    const ext = file.name.split('.').pop() || 'png';
    const storedFileName = `${generateId()}_${Date.now()}.${ext}`;
    const expiry = Date.now() + TEN_MINUTES;
    const isImage = file.type.startsWith('image/');

    onProgress?.(10);

    const { error } = await supabase.storage
      .from('chat-images')
      .upload(storedFileName, file, { contentType: file.type });

    if (error) {
      console.error('Upload failed:', error.message);
      return;
    }

    onProgress?.(70);

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(storedFileName);

    onProgress?.(90);

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: '',
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
      ...(isImage
        ? {
            imageUrl: urlData.publicUrl,
            imageExpiry: expiry,
          }
        : {
            fileUrl: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileMimeType: file.type,
          }),
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }

    onProgress?.(100);
  }, [checkRateLimit]);

  const broadcastScreenshot = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'screenshot', payload: { username: usernameRef.current } });
    }
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: generateId(),
        username: 'system',
        text: '⚠ You took a screenshot — others have been notified',
        timestamp: Date.now(),
        type: 'system',
      }],
    }));
  }, []);

  const kickUser = useCallback((username: string) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'kick', payload: { username } });
    }
    // Also add local system message
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: generateId(),
        username: 'system',
        text: `${username} was removed.`,
        timestamp: Date.now(),
        type: 'system',
      }],
    }));
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    const username = usernameRef.current;
    // Update locally
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        const users = [...(reactions[emoji] || [])];
        const idx = users.indexOf(username);
        if (idx >= 0) {
          users.splice(idx, 1);
          if (users.length === 0) {
            delete reactions[emoji];
          } else {
            reactions[emoji] = users;
          }
        } else {
          reactions[emoji] = [...users, username];
        }
        return { ...m, reactions: Object.keys(reactions).length > 0 ? reactions : undefined };
      }),
    }));
    // Broadcast
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { messageId, emoji, username } });
    }
  }, []);

  return {
    state, joinRoom, leaveRoom, sendMessage, sendTyping, sendGif,
    toggleNotifications, nukeRoom, freezeChat, sendAnnouncement, editMessage, unsendMessage, sendImage,
    checkUsernameAvailable, broadcastScreenshot, kickUser, reactToMessage,
  };
}
