'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatHeader from '@/components/chat/chat-header';
import MessageList from '@/components/chat/message-list';
import MessageInput from '@/components/chat/message-input';
import type { Room, Message, Task, User } from '@/lib/types';
import { extractTasksFromMessages } from '@/ai/flows/extract-tasks-from-messages';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import TaskSheet from './task-sheet';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, where, getDocs } from 'firebase/firestore';

export default function ChatRoom({ roomSlug }: { roomSlug: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  // Fetch current room
  const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'chatRooms', roomSlug) : null, [firestore, roomSlug]);
  const { data: room, isLoading: isRoomLoading } = useDoc<Room>(roomRef);

  // Fetch messages for the current room
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, room]);
  const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);
  
  // Fetch all users in the room
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !room?.userIds || room.userIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('uid', 'in', room.userIds));
  }, [firestore, room]);
  const { data: roomUsers } = useCollection<User>(usersQuery);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!room || !currentUser || !firestore) return;

    // We don't handle file uploads yet, but this is where you would.
    if (file) {
        toast({ title: "File upload not implemented", description: "This is a demo."});
    }

    const newMessage: Omit<Message, 'id'> = {
      roomId: room.id,
      userId: currentUser.uid,
      content,
      timestamp: serverTimestamp(),
      ...(file ? { fileName: file.name } : {}),
    };
    
    await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), newMessage);

    // AI Task Extraction (no change needed here for now)
  };

  const isLoading = isUserLoading || isRoomLoading || areMessagesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <p>Room not found or you don't have access.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ChatHeader room={room} roomUsers={roomUsers || []} onShowTasks={() => setIsTaskSheetOpen(true)} taskCount={tasks.length} />
        <MessageList messages={messages || []} allUsers={roomUsers || []} />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      <TaskSheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen} tasks={tasks} setTasks={setTasks} />
    </>
  );
}
