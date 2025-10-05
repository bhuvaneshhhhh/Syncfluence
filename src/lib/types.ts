export type User = {
  id: string; // This will be the Firebase uid
  uid: string; // This will be the Firebase uid
  displayName: string;
  email: string | null;
  avatarUrl: string;
  isOnline?: boolean;
  bio?: string;
  isAnonymous?: boolean;
};

export type Room = {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  userIds: string[];
  unreadCount?: number;
  privacy?: 'public' | 'private';
  password?: string;
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
