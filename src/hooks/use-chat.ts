import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, RoomUser, ChatState } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const generateId = () => Math.random().toString(36).substring(2, 12);

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
    };
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const notificationsRef = useRef(state.notificationsEnabled);
  const usernameRef = useRef(state.username);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { notificationsRef.current = state.notificationsEnabled; }, [state.notificationsEnabled]);
  useEffect(() => { usernameRef.current = state.username; }, [state.username]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const joinRoom = useCallback((username: string, roomCode: string, importedMessages?: ChatMessage[]) => {
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

    const initialMessages = importedMessages ? [...importedMessages, systemMsg] : [systemMsg];

    setState(prev => ({
      ...prev,
      username,
      roomCode,
      isJoined: true,
      messages: initialMessages,
      users: [],
      typingUsers: [],
    }));

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: username } },
    });

    // Incoming text/image/gif messages
    channel.on('broadcast', { event: 'message' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      if (msg.username === usernameRef.current) return;
      setState(prev => ({ ...prev, messages: [...prev.messages, { ...msg, status: 'delivered' }] }));

      if (!document.hidden && channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'read', payload: { messageId: msg.id, reader: usernameRef.current } });
      }

      if (notificationsRef.current && document.hidden) {
        const body = msg.type === 'image' ? '[Image]' : msg.type === 'gif' ? '[GIF]' : msg.text;
        new Notification(msg.username, { body });
      }
    });

    // System messages
    channel.on('broadcast', { event: 'system' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    });

    // Typing indicators
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { username: typingUser } = payload.payload as { username: string };
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

    // Read receipts
    channel.on('broadcast', { event: 'read' }, (payload) => {
      const { messageId } = payload.payload as { messageId: string; reader: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, status: 'read' } : m),
      }));
    });

    // Edit event: update the text of a specific message for all clients
    channel.on('broadcast', { event: 'edit' }, (payload) => {
      const { messageId, newText } = payload.payload as { messageId: string; newText: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId ? { ...m, text: newText, edited: true } : m
        ),
      }));
    });

    // Unsend event: replace message content with a tombstone for all clients
    channel.on('broadcast', { event: 'unsend' }, (payload) => {
      const { messageId } = payload.payload as { messageId: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId
            ? {
                ...m,
                text: '',
                imageDataUrl: undefined,
                imageMimeType: undefined,
                gifUrl: undefined,
                gifPreviewUrl: undefined,
                gifTitle: undefined,
                unsent: true,
              }
            : m
        ),
      }));
    });

    // Nuke / purge event
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
    }));
  }, []);

  /** Send a plain text message */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, []);

  /** Send an image (base64 data URL) */
  const sendImage = useCallback((dataUrl: string, mimeType: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: '',
      imageDataUrl: dataUrl,
      imageMimeType: mimeType,
      timestamp: Date.now(),
      type: 'image',
      status: 'sent',
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, []);

  /** Send a GIF (klipy item) */
  const sendGif = useCallback((gifUrl: string, gifPreviewUrl: string, gifTitle: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: '',
      gifUrl,
      gifPreviewUrl,
      gifTitle,
      timestamp: Date.now(),
      type: 'gif',
      status: 'sent',
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, []);

  /** Edit own text message (also updates local state immediately) */
  const editMessage = useCallback((messageId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId ? { ...m, text: trimmed, edited: true } : m
      ),
    }));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'edit',
        payload: { messageId, newText: trimmed },
      });
    }
  }, []);

  /** Unsend own message (tombstone it for all clients) */
  const unsendMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId
          ? {
              ...m,
              text: '',
              imageDataUrl: undefined,
              imageMimeType: undefined,
              gifUrl: undefined,
              gifPreviewUrl: undefined,
              gifTitle: undefined,
              unsent: true,
            }
          : m
      ),
    }));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'unsend',
        payload: { messageId },
      });
    }
  }, []);

  /** Purge the entire session (broadcast nuke to all clients) */
  const purgeSession = useCallback(() => {
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

  const sendTyping = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { username: usernameRef.current } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, []);

  const exportHistory = useCallback(() => {
    const data = JSON.stringify(state.messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.messages]);

  const toggleNotifications = useCallback(async () => {
    if (!state.notificationsEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          localStorage.setItem('chat_notif_pref', 'true');
          setState(prev => ({ ...prev, notificationsEnabled: true }));
        }
      }
    } else {
      localStorage.setItem('chat_notif_pref', 'false');
      setState(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, [state.notificationsEnabled]);

  return {
    state,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendImage,
    sendGif,
    editMessage,
    unsendMessage,
    purgeSession,
    sendTyping,
    exportHistory,
    toggleNotifications,
  };
}
