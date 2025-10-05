'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Paperclip, SendHorizonal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type MessageInputProps = {
  onSendMessage: (content: string, file?: File) => void;
};

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (message.trim() === '' && !file) return;
    onSendMessage(message, file || undefined);
    setMessage('');
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      <div className="relative">
        {file && (
          <div className="absolute bottom-full left-0 right-0 p-2 bg-muted/50 rounded-t-lg">
            <div className="flex items-center justify-between bg-card p-2 rounded-md border">
              <div className="flex items-center gap-2 overflow-hidden">
                <Paperclip className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm truncate">{file.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                setFile(null)
                if(fileInputRef.current) fileInputRef.current.value = ""
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <Textarea
          placeholder="Type a message..."
          className="pr-24 min-h-[48px] resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Attach file</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={message.trim() === '' && !file}
                    >
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Send message</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      </div>
    </div>
  );
}
