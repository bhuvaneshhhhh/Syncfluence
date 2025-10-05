'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Users, ListTodo, Loader2 } from "lucide-react";
import type { Room } from "@/lib/types";
import { users } from "@/lib/data";
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

type ChatHeaderProps = {
  room: Room;
  onShowTasks: () => void;
  taskCount: number;
};

export default function ChatHeader({ room, onShowTasks, taskCount }: ChatHeaderProps) {
  const { toast } = useToast();
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const roomMembers = room.userIds
    ? users.filter(u => room.userIds?.includes(u.id))
    : users.slice(0, 4); // Fallback for channels

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

  return (
    <>
      <div className="flex items-center p-4 border-b">
        <div className="flex-1">
          <h2 className="text-xl font-bold font-headline">
            {room.type === 'channel' ? '# ' : ''}{room.name}
          </h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{roomMembers.length} members</span>
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
            </TooltipProvider>

          <div className="flex -space-x-2 overflow-hidden">
            {roomMembers.map(member => (
              <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
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
    </>
  );
}
