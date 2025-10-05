'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ListTodo, Loader2, UserCog } from "lucide-react";
import type { Room, User } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { summarizeChatHistory } from "@/ai/flows/summarize-chat-history";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useUser } from '@/firebase';
import ManageMembersSheet from './manage-members-sheet';

type ChatHeaderProps = {
  room: Room;
  roomUsers: User[];
  allUsers: User[];
  onShowTasks: () => void;
  taskCount: number;
};

export default function ChatHeader({ room, roomUsers, allUsers, onShowTasks, taskCount }: ChatHeaderProps) {
  const { toast } = useToast();
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [isManageMembersOpen, setManageMembersOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { user: currentUser } = useUser();


  const handleSummarize = async () => {
    setShowSummaryDialog(true);
    setIsSummarizing(true);
    try {
      // In a real app, you'd pass the actual chat history
      const result = await summarizeChatHistory({ chatHistory: "A long conversation about project deadlines and weekend plans." });
      setSummary(result.summary);
    } catch (e) {
      console.error("Failed to summarize", e);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate summary.",
      });
      setSummary("Sorry, we couldn't generate a summary at this time.");
    } finally {
      setIsSummarizing(false);
    }
  };
  
  let headerName = room.name;
  if(room.type === 'dm' && currentUser && roomUsers.length > 0) {
    const otherUser = roomUsers.find(u => u.id !== currentUser.uid);
    if(otherUser) {
        headerName = otherUser.displayName;
    }
  }


  return (
    <>
      <div className="flex items-center p-4 border-b">
        <div className="flex-1">
          <h2 className="text-xl font-bold font-headline">
            {room.type === 'channel' ? '# ' : ''}{headerName}
          </h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{roomUsers.length} members</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleSummarize}>
                            <Sparkles className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>AI-Powered Summary</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative" onClick={onShowTasks}>
                            <ListTodo className="h-5 w-5" />
                            {taskCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">{taskCount}</Badge>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>View Tasks</p>
                    </TooltipContent>
                </Tooltip>
                {room.type === 'channel' && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setManageMembersOpen(true)}>
                                <UserCog className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Manage Members</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </TooltipProvider>

          <div className="flex -space-x-2 overflow-hidden">
            {roomUsers.map(member => (
              <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                <AvatarImage src={member.avatarUrl} alt={member.displayName} />
                <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              Conversation Summary
            </AlertDialogTitle>
            <AlertDialogDescription>
              Here's a quick summary of the conversation powered by AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-80 overflow-y-auto p-1">
            {isSummarizing ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <p className="text-sm text-foreground">{summary}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSummaryDialog(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ManageMembersSheet 
        open={isManageMembersOpen}
        onOpenChange={setManageMembersOpen}
        room={room}
        currentUsers={roomUsers}
        allUsers={allUsers}
       />
    </>
  );
}
