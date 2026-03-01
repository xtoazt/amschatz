export type MessageType = 'message' | 'system' | 'image' | 'gif';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  type: MessageType;
  status?: 'sent' | 'delivered' | 'read';
  // Image messages
  imageDataUrl?: string;
  imageMimeType?: string;
  // GIF messages
  gifUrl?: string;
  gifPreviewUrl?: string;
  gifTitle?: string;
  // Edit / unsend
  edited?: boolean;
  unsent?: boolean;
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
}
