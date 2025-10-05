import { MessageSquareText } from 'lucide-react';

export default function ChatHomePage() {
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
