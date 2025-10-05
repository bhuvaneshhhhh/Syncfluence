'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  LogOut,
  MessageSquare,
  MessageSquareText,
  PlusCircle,
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
import { rooms, users, getCurrentUser } from '@/lib/data';
import type { Room } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import { Button } from '../ui/button';

const channels = rooms.filter(r => r.type === 'channel');
const dms = rooms.filter(r => r.type === 'dm');
const currentUser = getCurrentUser();

export default function SidebarContentComponent() {
  const params = useParams();
  const slug = params.slug?.join('/') || 'general';

  const getRoomUser = (room: Room) => {
    if (room.type === 'dm' && room.userIds) {
      const otherUserId = room.userIds.find(id => id !== currentUser.id);
      return users.find(u => u.id === otherUserId);
    }
    return null;
  };

  return (
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
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center">
            <MessageSquare className="mr-2" />
            Channels
          </SidebarGroupLabel>
          <SidebarGroupAction>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <PlusCircle />
            </Button>
          </SidebarGroupAction>
          {channels.map(room => (
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
          <SidebarGroupAction>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <PlusCircle />
            </Button>
          </SidebarGroupAction>
          {dms.map(room => {
            const user = getRoomUser(room);
            if (!user) return null;
            return (
              <SidebarMenuItem key={room.id}>
                <Link href={`/chat/${room.id}`} className="w-full">
                  <SidebarMenuButton isActive={slug === room.id} className="w-full justify-start">
                    <UserAvatar user={user} className="w-6 h-6" />
                    <span>{user.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarGroup>
      </SidebarMenu>

      <SidebarFooter>
        <SidebarSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-sidebar-accent">
              <UserAvatar user={currentUser} />
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate">{currentUser.name}</p>
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
             <Link href="/login">
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </SidebarContent>
  );
}
