'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  LogOut,
  MessageSquare,
  MessageSquareText,
  PlusCircle,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuBadge,
  SidebarGroupAction,
  SidebarInput,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import type { Room, User } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export default function SidebarContentComponent() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug?.join('/') || 'general';
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch all users for search
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // This is okay, assuming all users' profiles are public.
    return query(collection(firestore, "users"));
  }, [firestore]);
  const { data: allUsers } = useCollection<User>(usersQuery);

  // Fetch channels user is a member of
  const channelsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return query(
        collection(firestore, "chatRooms"), 
        where("type", "==", "channel"),
        where("userIds", "array-contains", currentUser.uid)
    );
  }, [firestore, currentUser?.uid]);
  const { data: channels } = useCollection<Room>(channelsQuery);

  // Fetch DMs user is a member of
  const dmsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return query(
      collection(firestore, "chatRooms"), 
      where("type", "==", "dm"), 
      where("userIds", "array-contains", currentUser.uid)
    );
  }, [firestore, currentUser?.uid]);
  const { data: dms } = useCollection<Room>(dmsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getRoomUser = (room: Room) => {
    if (room.type === 'dm' && room.userIds && allUsers && currentUser) {
      const otherUserId = room.userIds.find(id => id !== currentUser.uid);
      return allUsers.find(u => u.id === otherUserId);
    }
    return null;
  };
  
  const handleSelectUser = async (user: User) => {
    if (!currentUser || !firestore) return;
    
    // Check if a DM room already exists with this user
    const existingDmQuery = query(
      collection(firestore, 'chatRooms'),
      where('type', '==', 'dm'),
      where('userIds', 'array-contains', currentUser.uid)
    );

    const querySnapshot = await getDocs(existingDmQuery);
    const existingDm = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Room).find(dm => dm.userIds.includes(user.id));

    if (existingDm) {
      router.push(`/chat/${existingDm.id}`);
      setOpen(false);
      return;
    }

    // Create a new DM room
    const newRoom: Omit<Room, 'id'> = {
      name: `DM with ${user.displayName}`,
      type: 'dm',
      userIds: [currentUser.uid, user.id],
    };
    const docRef = await addDoc(collection(firestore, 'chatRooms'), newRoom);
    
    router.push(`/chat/${docRef.id}`);
    setOpen(false);
  }

  const filteredUsers = allUsers?.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()) && u.id !== currentUser?.uid);

  return (
    <>
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-8 h-8 text-primary" />
            <div className="flex flex-col">
              <h2 className="text-lg font-headline font-semibold tracking-tight">Syncfluence</h2>
            </div>
          </div>
        </SidebarHeader>

        <SidebarMenu>
          <div className="px-2 mb-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setOpen(true)}>
              <Search className="mr-2" />
              Search users...
            </Button>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center">
              <MessageSquare className="mr-2" />
              Channels
            </SidebarGroupLabel>
            {channels?.map(room => (
              <SidebarMenuItem key={room.id}>
                <Link href={`/chat/${room.id}`} className="w-full">
                  <SidebarMenuButton isActive={slug === room.id} className="w-full">
                    # {room.name}
                    {room.unreadCount && room.unreadCount > 0 && (
                      <SidebarMenuBadge>{room.unreadCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center">
              <Users className="mr-2" />
              Direct Messages
            </SidebarGroupLabel>
            {dms?.map(room => {
              const user = getRoomUser(room);
              if (!user) return null;
              return (
                <SidebarMenuItem key={room.id}>
                  <Link href={`/chat/${room.id}`} className="w-full">
                    <SidebarMenuButton isActive={slug === room.id} className="w-full justify-start">
                      <UserAvatar user={user} className="w-6 h-6" />
                      <span>{user.displayName}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarGroup>
        </SidebarMenu>

        <SidebarFooter>
          <SidebarSeparator />
          {currentUser && !isUserLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-sidebar-accent">
                  <UserAvatar user={{...currentUser, displayName: currentUser.displayName || 'User'}} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{currentUser.displayName}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarFooter>
      </SidebarContent>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for users by name..." value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>{search.length > 1 ? 'No users found.' : 'Type to search for users.'}</CommandEmpty>
          <CommandGroup heading="Users">
            {filteredUsers && filteredUsers.map(user => (
              <CommandItem key={user.id} onSelect={() => handleSelectUser(user)} className='flex items-center gap-2'>
                <UserAvatar user={user} className='w-6 h-6' />
                <span>{user.displayName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
