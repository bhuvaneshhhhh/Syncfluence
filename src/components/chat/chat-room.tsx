'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatHeader from '@/components/chat/chat-header';
import MessageList from '@/components/chat/message-list';
import MessageInput from '@/components/chat/message-input';
import type { Room, Message, Task, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import TaskSheet from './task-sheet';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { extractTasksFromMessages } from '@/ai/flows/extract-tasks-from-messages';

export default function ChatRoom({ roomSlug }: { roomSlug: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);


  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  // Fetch current room
  const roomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'chatRooms', roomSlug);
  }, [firestore, roomSlug]);
  const { data: room, isLoading: isRoomLoading } = useDoc<Room>(roomRef);

  // Add user to room if they are not already a member (for public rooms)
  useEffect(() => {
    if (room && currentUser && room.privacy === 'public' && !room.userIds.includes(currentUser.uid)) {
      const newUsers = [...room.userIds, currentUser.uid];
      updateDoc(roomRef!, { userIds: newUsers });
    }
  }, [room, currentUser, roomRef]);

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

    const newMessageData: Omit<Message, 'id'> = {
      roomId: room.id,
      userId: currentUser.uid,
      content,
      timestamp: serverTimestamp(),
      ...(file ? { fileName: file.name } : {}),
    };
    
    await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), newMessageData);
  };
  
    // Fetch and extract tasks
    useEffect(() => {
      if (messages && messages.length > 0 && roomUsers && roomUsers.length > 0) {
        const fetchTasks = async () => {
          setIsExtractingTasks(true);
          try {
            const messagesForTaskExtraction = messages.map(m => {
                const sender = roomUsers.find(u => u.uid === m.userId);
                return {
                    sender: sender?.displayName || 'Unknown User',
                    content: m.content
                }
            });

            const extracted = await extractTasksFromMessages({ messages: messagesForTaskExtraction });

            // Check for existing tasks to avoid duplicates
            const tasksCollectionRef = collection(firestore, 'chatRooms', roomSlug, 'tasks');
            const existingTasksSnapshot = await getDocs(tasksCollectionRef);
            const existingTaskDescriptions = existingTasksSnapshot.docs.map(d => d.data().description);

            const batch = writeBatch(firestore);
            const newTasks: Task[] = [];

            for (const item of extracted) {
                if (!existingTaskDescriptions.includes(item.task)) {
                    let assigneeId: string | undefined = undefined;
                    if (item.assignee) {
                        const assignedUser = roomUsers.find(u => u.displayName.toLowerCase() === item.assignee?.toLowerCase());
                        if (assignedUser) {
                            assigneeId = assignedUser.uid;
                        }
                    }
                    
                    const newTaskRef = doc(collection(tasksCollectionRef));
                    const newTaskData = {
                        description: item.task,
                        assigneeId,
                        completed: false,
                        roomId: roomSlug,
                    };
                    batch.set(newTaskRef, newTaskData);
                    newTasks.push({ id: newTaskRef.id, ...newTaskData, task: item.task, assignee: item.assignee });
                }
            }
            
            if (newTasks.length > 0) {
              await batch.commit();
            }

          } catch (error) {
            console.error("Error extracting tasks:", error);
          } finally {
            setIsExtractingTasks(false);
          }
        };
        fetchTasks();
      }
    }, [messages, roomUsers, firestore, roomSlug]);

    // Fetch tasks from subcollection
    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !room) return null;
        return query(collection(firestore, 'chatRooms', room.id, 'tasks'));
    }, [firestore, room]);
    const { data: fetchedTasks } = useCollection<Omit<Task, 'task' | 'assignee' > & { description: string }>(tasksQuery);


    useEffect(() => {
        if (fetchedTasks && roomUsers) {
            const formattedTasks = fetchedTasks.map(t => {
                const assignee = roomUsers.find(u => u.uid === t.assigneeId);
                return {
                    ...t,
                    task: t.description,
                    assignee: assignee?.displayName,
                }
            });
            setTasks(formattedTasks);
        }
    }, [fetchedTasks, roomUsers]);


  const isLoading = isUserLoading || isRoomLoading || areMessagesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    if(!isUserLoading && currentUser) {
        return (
          <div className="flex h-full flex-1 items-center justify-center">
            <p>Room not found or you don't have access.</p>
          </div>
        );
    }
     return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <TaskSheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen} tasks={tasks} roomSlug={roomSlug} />
    </>
  );
}
