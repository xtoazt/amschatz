export interface ReplyTo {
  id: string;
  username: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system' | 'announcement';
  status?: 'sent' | 'delivered' | 'read';
  edited?: boolean;
  deleted?: boolean;
  imageUrl?: string;
  imageExpiry?: number;
  isGif?: boolean;
  // File attachment properties
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  // Reply
  replyTo?: ReplyTo;
}

export interface RoomUser {
  username: string;
  joinedAt: number;
}

export interface ChatState {
  username: string;
  roomCode: string;
  messages: ChatMessage[];
  users: RoomUser[];
  isJoined: boolean;
  notificationsEnabled: boolean;
  typingUsers: string[];
  frozen: boolean;
  frozenBy: string | null;
  isPasswordProtected: boolean;
}
