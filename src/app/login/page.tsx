import LoginForm from '@/components/auth/login-form';
import ClientOnly from '@/components/client-only';
import { MessageSquareText } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <MessageSquareText className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-headline text-foreground">Syncfluence</h1>
          </div>
          <p className="text-muted-foreground">Welcome back! Please sign in to continue.</p>
        </div>
        <ClientOnly>
          <LoginForm />
        </ClientOnly>
      </div>
    </div>
  );
}
