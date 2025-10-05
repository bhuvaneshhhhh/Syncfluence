import ChatRoom from '@/components/chat/chat-room';

// This is a server component that renders the main client component for the chat room
export default function RoomPage({ params }: { params: { slug?: string[] } }) {
  // We determine the room slug from the URL params, defaulting to 'general'
  const roomSlug = params.slug?.join('/') || 'general';

  return <ChatRoom roomSlug={roomSlug} />;
}
