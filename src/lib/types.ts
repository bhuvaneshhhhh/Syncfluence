export type User = {
  id: string; // This will be the Firebase uid
  displayName: string;
  email: string | null;
  avatarUrl: string;
  isOnline?: boolean;
};

export type Room = {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  userIds?: string[];
  unreadCount?: number;
};

export type Message = {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  timestamp: any; // Allow for Firestore Timestamp
  fileUrl?: string;
  fileName?: string;
};

export type Task = {
  id: string;
  task: string;
  assignee?: string;
  completed: boolean;
};
