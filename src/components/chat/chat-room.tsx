'use client';

import { useState, useEffect } from 'react';
import ChatHeader from '@/components/chat/chat-header';
import MessageList from '@/components/chat/message-list';
import MessageInput from '@/components/chat/message-input';
import { getRoomBySlug, getMessagesByRoom, getCurrentUser, getUserById } from '@/lib/data';
import type { Room, Message, Task } from '@/lib/types';
import { extractTasksFromMessages } from '@/ai/flows/extract-tasks-from-messages';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import TaskSheet from './task-sheet';

export default function ChatRoom({ roomSlug }: { roomSlug: string }) {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const currentRoom = getRoomBySlug(roomSlug);
    if (currentRoom) {
      setRoom(currentRoom);
      // Simulate fetching messages
      setTimeout(() => {
        setMessages(getMessagesByRoom(currentRoom.id));
        setIsLoading(false);
      }, 500);
    } else {
      setRoom(null);
      setMessages([]);
      setIsLoading(false);
    }
    setTasks([]); // Reset tasks when room changes
  }, [roomSlug]);

  const handleSendMessage = async (content: string, file?: File) => {
    const currentUser = getCurrentUser();
    if (!room || !currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      ...(file ? { fileUrl: URL.createObjectURL(file), fileName: file.name } : {}),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // AI Task Extraction
    try {
      const formattedMessages = updatedMessages.map(m => {
        const sender = getUserById(m.userId);
        return {
          sender: sender?.name || 'Unknown',
          content: m.content,
        };
      });

      const extracted = await extractTasksFromMessages({ messages: formattedMessages });
      
      if (extracted.length > 0) {
        const newTasks = extracted.filter(newTask => !tasks.some(existingTask => existingTask.task === newTask.task));
        if (newTasks.length > 0) {
            setTasks(prev => [...prev, ...newTasks.map(t => ({ ...t, id: `task-${Date.now()}-${Math.random()}`, completed: false }))]);
            toast({
              title: "AI Tasks Extracted!",
              description: `${newTasks.length} new task(s) were found.`,
            });
        }
      }
    } catch (e) {
      console.error("Failed to extract tasks", e);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not extract tasks.",
      });
    }
  };

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
        <p>Room not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <ChatHeader room={room} onShowTasks={() => setIsTaskSheetOpen(true)} taskCount={tasks.length} />
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      <TaskSheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen} tasks={tasks} setTasks={setTasks} />
    </>
  );
}
