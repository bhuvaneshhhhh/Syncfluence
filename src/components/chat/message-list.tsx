'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message, User } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, fromUnixTime } from 'date-fns';
import { FileText } from 'lucide-react';
import { useUser } from '@/firebase';

type MessageListProps = {
  messages: Message[];
  allUsers: User[];
};

const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Convert Firestore Timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
}

export default function MessageList({ messages, allUsers }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useUser();

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="p-4 space-y-4">
        {messages.map((message, index) => {
          const user = getUserById(message.userId, allUsers);
          const prevMessage = messages[index - 1];
          const isSameUser = prevMessage?.userId === message.userId;
          const isCurrentUser = message.userId === currentUser?.uid;

          if (!user) return null;

          if (isSameUser) {
            return (
              <div key={message.id} className={cn("flex items-start gap-3", isCurrentUser && "justify-end")}>
                <div className={cn("group flex items-center gap-3", isCurrentUser && "flex-row-reverse")}>
                  <div className="w-10" />
                  <div className={cn(
                    "flex max-w-xs md:max-w-md lg:max-w-lg flex-col items-start rounded-lg px-3 py-2",
                    isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border rounded-bl-none"
                  )}>
                     {message.content && <p className="text-sm">{message.content}</p>}
                     {message.fileUrl && (
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 bg-background/10 p-2 rounded-md hover:bg-background/20">
                            <FileText className="h-5 w-5"/>
                            <span className="text-sm font-medium truncate">{message.fileName}</span>
                        </a>
                     )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex items-start gap-3">
              <UserAvatar user={user} />
              <div className="flex flex-col items-start">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                </div>
                 <div className={cn(
                    "flex max-w-xs md:max-w-md lg:max-w-lg flex-col items-start rounded-lg px-3 py-2 mt-1",
                    "bg-card border rounded-tl-none"
                  )}>
                     {message.content && <p className="text-sm">{message.content}</p>}
                     {message.fileUrl && (
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 bg-muted/50 p-2 rounded-md hover:bg-muted">
                            <FileText className="h-5 w-5"/>
                            <span className="text-sm font-medium truncate">{message.fileName}</span>
                        </a>
                     )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
