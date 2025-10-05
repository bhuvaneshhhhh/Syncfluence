'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  LogOut,
  MessageSquare,
  MessageSquareText,
  Plus,
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, addDoc, getDocs, doc, serverTimestamp } from 'firebase/firestore';
import type { Room, User } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, DialogTitle, DialogDescription } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';

function DirectMessageItem({ room }: { room: Room }) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [otherUser, setOtherUser] = useState<User | null>(null);

  const otherUserId = useMemoFirebase(() => {
    if (!currentUser || !room || room.type !== 'dm') return null;
    return room.userIds?.find(id => id !== currentUser.uid);
  }, [currentUser, room]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !otherUserId) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);

  const { data: userData } = useDoc<User>(userDocRef);

  useEffect(() => {
    if (userData) {
      setOtherUser(userData);
    }
  }, [userData]);
  
  const params = useParams();
  const slug = params.slug?.join('/') || 'general';

  if (!otherUser) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start">
                <div className='w-6 h-6 rounded-full bg-muted animate-pulse' />
                <span className='h-4 w-20 rounded-md bg-muted animate-pulse'></span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Link href={`/chat/${room.id}`} className="w-full">
        <SidebarMenuButton isActive={slug === room.id} className="w-full justify-start">
          <UserAvatar user={otherUser} className="w-6 h-6" />
          <span>{otherUser.displayName}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

function CreateChannelDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [channelName, setChannelName] = useState('');
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const router = useRouter();

    const handleCreateChannel = async () => {
        if (!channelName.trim() || !currentUser) return;

        try {
            const newRoom: Omit<Room, 'id'> = {
                name: channelName,
                type: 'channel',
                userIds: [currentUser.uid],
                privacy: 'public', // Default to public for now
            };
            const docRef = await addDoc(collection(firestore, 'chatRooms'), newRoom);
            toast({ title: 'Channel created!', description: `#${channelName} is now live.` });
            onOpenChange(false);
            setChannelName('');
            router.push(`/chat/${docRef.id}`);
        } catch (error) {
            console.error('Error creating channel:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create channel.' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
                    <DialogDescription>
                        Channels are for topic-based conversations. Give your new channel a name.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="channel-name">Channel Name</Label>
                    <Input
                        id="channel-name"
                        placeholder="e.g. project-gamma"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreateChannel} disabled={!channelName.trim()}>Create Channel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function SidebarContentComponent() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug?.join('/') || 'general';
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateChannelOpen, setCreateChannelOpen] = useState(false);


  // Fetch all users for search
   const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  const { data: allUsers } = useCollection<User>(allUsersQuery);


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
      privacy: 'private'
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
             <SidebarGroupAction asChild>
                <button onClick={() => setCreateChannelOpen(true)}><Plus /></button>
            </SidebarGroupAction>
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
            {dms?.map(room => (
                <DirectMessageItem key={room.id} room={room} />
             ))}
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
        <DialogTitle className="sr-only">Search Users</DialogTitle>
        <DialogDescription className="sr-only">Search for users to start a new direct message.</DialogDescription>
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
      
      <CreateChannelDialog open={isCreateChannelOpen} onOpenChange={setCreateChannelOpen} />
    </>
  );
}
