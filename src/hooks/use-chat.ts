import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, RoomUser, ChatState } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const generateId = () => Math.random().toString(36).substring(2, 12);

export function useChat() {
  const [state, setState] = useState<ChatState>({
    username: '',
    roomCode: '',
    messages: [],
    users: [],
    isJoined: false,
    notificationsEnabled: false,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const notificationsRef = useRef(state.notificationsEnabled);
  const usernameRef = useRef(state.username);

  useEffect(() => { notificationsRef.current = state.notificationsEnabled; }, [state.notificationsEnabled]);
  useEffect(() => { usernameRef.current = state.username; }, [state.username]);

  // Clean up channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const joinRoom = useCallback((username: string, roomCode: string, importedMessages?: ChatMessage[]) => {
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'HELIOS',
      text: `${username} has joined the room.`,
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
    }));

    // Create realtime channel for this room
    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: { key: username },
      },
    });

    // Listen for broadcast messages
    channel.on('broadcast', { event: 'message' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      // Don't duplicate own messages - we already added them optimistically
      if (msg.username === usernameRef.current) return;

      setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

      // Send notification if tab not focused
      if (notificationsRef.current && document.hidden) {
        new Notification(`${msg.username}`, { body: msg.text });
      }
    });

    // Listen for system broadcasts (join/leave)
    channel.on('broadcast', { event: 'system' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    });

    // Presence: track who's online
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users: RoomUser[] = Object.keys(presenceState).map(key => ({
        username: key,
        joinedAt: (presenceState[key]?.[0] as any)?.joinedAt ?? Date.now(),
      }));
      setState(prev => ({ ...prev, users }));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username, joinedAt: Date.now() });
        // Broadcast join event to others
        channel.send({
          type: 'broadcast',
          event: 'system',
          payload: systemMsg,
        });
      }
    });

    channelRef.current = channel;
  }, []);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      // Broadcast leave before unsubscribing
      const leaveMsg: ChatMessage = {
        id: generateId(),
        username: 'HELIOS',
        text: `${usernameRef.current} has left the room.`,
        timestamp: Date.now(),
        type: 'system',
      };
      channelRef.current.send({
        type: 'broadcast',
        event: 'system',
        payload: leaveMsg,
      });
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
    }));
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'message',
    };

    // Optimistically add to local state
    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    // Broadcast to room
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: msg,
      });
    }
  }, []);

  const exportHistory = useCallback(() => {
    const data = JSON.stringify(state.messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'helios_chat.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.messages]);

  const toggleNotifications = useCallback(async () => {
    if (!state.notificationsEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setState(prev => ({ ...prev, notificationsEnabled: true }));
        }
      }
    } else {
      setState(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, [state.notificationsEnabled]);

  return { state, joinRoom, leaveRoom, sendMessage, exportHistory, toggleNotifications };
}
