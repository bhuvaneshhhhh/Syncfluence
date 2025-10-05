'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task, User as AppUser } from '@/lib/types';
import { ListTodo, UserCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';

type TaskSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  roomSlug: string;
};

export default function TaskSheet({ open, onOpenChange, tasks, roomSlug }: TaskSheetProps) {
    const firestore = useFirestore();

    const handleTaskCheck = async (taskId: string, checked: boolean) => {
        if (!firestore || !roomSlug) return;
        const taskRef = doc(firestore, 'chatRooms', roomSlug, 'tasks', taskId);
        await updateDoc(taskRef, { completed: checked });
    }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline">
            <ListTodo />
            Extracted Tasks
          </SheetTitle>
          <SheetDescription>
            These tasks were automatically extracted from the conversation by AI.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 -mx-6">
          <div className="p-6 space-y-4">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div key={task.id} className="p-3 bg-card rounded-lg border flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                        <Checkbox 
                            id={`task-${task.id}`} 
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskCheck(task.id, !!checked)}
                            className="mt-1"
                        />
                        <label htmlFor={`task-${task.id}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.task}</span>
                        </label>
                    </div>
                    {task.assignee && (
                        <div className="pl-8">
                             <Badge variant="secondary" className="gap-1.5 pl-1.5">
                                <UserCircle className="h-3.5 w-3.5" />
                                {task.assignee}
                            </Badge>
                        </div>
                    )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No tasks extracted yet.</p>
                <p className="text-xs mt-1">Keep chatting and AI will find them!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
