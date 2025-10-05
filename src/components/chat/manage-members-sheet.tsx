'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from './user-avatar';
import type { Room, User } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { UserPlus, X, Search } from 'lucide-react';

type ManageMembersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  currentUsers: User[];
  allUsers: User[];
};

export default function ManageMembersSheet({
  open,
  onOpenChange,
  room,
  currentUsers,
  allUsers,
}: ManageMembersSheetProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemoveMember = async (userId: string) => {
    if (!firestore || !room) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    try {
      await updateDoc(roomRef, {
        userIds: arrayRemove(userId),
      });
      toast({ title: 'Member removed' });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove member.' });
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!firestore || !room) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    try {
      await updateDoc(roomRef, {
        userIds: arrayUnion(userId),
      });
      toast({ title: 'Member added' });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add member.' });
    }
  };

  const nonMemberUsers = allUsers.filter(
    (user) => !currentUsers.some((member) => member.id === user.id) && !user.isAnonymous
  );

  const filteredUsers = searchQuery
    ? nonMemberUsers.filter((user) =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Manage Members in #{room.name}</SheetTitle>
          <SheetDescription>Add or remove members from this channel.</SheetDescription>
        </SheetHeader>
        <Separator />
        
        <div className="py-4">
            <h4 className="text-lg font-semibold mb-2">Add New Members</h4>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for users to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
             <ScrollArea className="h-40 mt-2 border rounded-md">
                <div className="p-2">
                {searchQuery && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                        <div className="flex items-center gap-2">
                        <UserAvatar user={user} className="h-8 w-8" />
                        <span>{user.displayName}</span>
                        </div>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(user.id)}
                        >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add
                        </Button>
                    </div>
                    ))
                ) : searchQuery ? (
                    <p className="text-sm text-center text-muted-foreground p-4">No users found.</p>
                ) : (
                    <p className="text-sm text-center text-muted-foreground p-4">Start typing to find users.</p>
                )}
                </div>
            </ScrollArea>
        </div>

        <Separator />

        <h4 className="text-lg font-semibold pt-4">Current Members ({currentUsers.length})</h4>
        <ScrollArea className="flex-1 -mx-6">
          <div className="p-6 space-y-2">
            {currentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} className="h-9 w-9" />
                  <span className="font-medium">{user.displayName}</span>
                </div>
                {currentUser?.uid !== user.id && ( // Can't remove yourself
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(user.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
