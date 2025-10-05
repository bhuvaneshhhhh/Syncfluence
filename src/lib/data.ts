import type { User, Room, Message } from './types';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const users: User[] = [
  { id: 'user-you', name: 'You', avatarUrl: findImage('user-you'), isOnline: true },
  { id: 'user-alex', name: 'Alex Ray', avatarUrl: findImage('user-alex'), isOnline: true },
  { id: 'user-sam', name: 'Sam Doe', avatarUrl: findImage('user-sam'), isOnline: false },
  { id: 'user-jordan', name: 'Jordan Lee', avatarUrl: findImage('user-jordan'), isOnline: true },
  { id: 'user-taylor', name: 'Taylor Kim', avatarUrl: findImage('user-taylor'), isOnline: false },
  { id: 'user-casey', name: 'Casey Smith', avatarUrl: findImage('user-casey'), isOnline: true },
];

export const rooms: Room[] = [
  { id: 'general', name: 'general', type: 'channel', unreadCount: 3 },
  { id: 'design-team', name: 'design-team', type: 'channel', unreadCount: 1 },
  { id: 'engineering', name: 'engineering', type: 'channel' },
  { id: 'project-exodus', name: 'project-exodus', type: 'channel' },
  { id: 'dm-alex', name: 'Alex Ray', type: 'dm', userIds: ['user-you', 'user-alex'] },
  { id: 'dm-jordan', name: 'Jordan Lee', type: 'dm', userIds: ['user-you', 'user-jordan'] },
  { id: 'dm-casey', name: 'Casey Smith', type: 'dm', userIds: ['user-you', 'user-casey'] },
];

export const messages: Message[] = [
  {
    id: 'msg-1',
    roomId: 'general',
    userId: 'user-alex',
    content: "Hey everyone, what's the plan for the weekend?",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'msg-2',
    roomId: 'general',
    userId: 'user-jordan',
    content: "I'm thinking of going for a hike. Anyone interested?",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'msg-3',
    roomId: 'general',
    userId: 'user-you',
    content: 'A hike sounds great! Where are you thinking of going?',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
    {
    id: 'msg-4',
    roomId: 'general',
    userId: 'user-jordan',
    content: 'Maybe the trails up by the north lake. The view is amazing.',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    id: 'msg-design-1',
    roomId: 'design-team',
    userId: 'user-sam',
    content: 'Can someone review the latest mockups for the landing page?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'msg-design-2',
    roomId: 'design-team',
    userId: 'user-alex',
    content: 'On it. Will send feedback by EOD.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'msg-dm-alex-1',
    roomId: 'dm-alex',
    userId: 'user-alex',
    content: 'Lunch today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'msg-dm-alex-2',
    roomId: 'dm-alex',
    userId: 'user-you',
    content: "Sure, the usual spot at 12:30?",
    timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
  },
];

export const getRoomBySlug = (slug: string): Room | undefined => {
  if (slug.startsWith('dm-')) {
    const user = users.find(u => slug === `dm-${u.id.split('-')[1]}`);
    if (user) {
      return { id: slug, name: user.name, type: 'dm', userIds: ['user-you', user.id] };
    }
  }
  return rooms.find(room => room.id === slug);
};

export const getMessagesByRoom = (roomId: string): Message[] => {
  return messages.filter(message => message.roomId === roomId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getUserById = (userId: string): User | undefined => {
  return users.find(user => user.id === userId);
};

export const getCurrentUser = (): User => {
    return users.find(user => user.id === 'user-you')!;
}
