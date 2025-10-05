import ChatRoom from '@/components/chat/chat-room';
import { MessageSquareText } from 'lucide-react';

// This is a server component that renders the main client component for the chat room
export default function RoomPage({ params }: { params: { slug?: string[] } }) {
  // We determine the room slug from the URL params.
  const roomSlug = params.slug?.join('/');

  // If there's no slug, it means we are at the root of the chat section.
  if (!roomSlug) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-center">
        <div className="flex items-center gap-4 mb-4">
          <MessageSquareText className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-headline">Welcome to Syncfluence</h2>
        <p className="text-muted-foreground mt-2">Select a channel or conversation to start messaging.</p>
      </div>
    );
  }

  return <ChatRoom roomSlug={roomSlug} />;
}
