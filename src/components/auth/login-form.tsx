'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Github, Loader2, Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons/google-icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';

export default function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleIsLoading] = useState(false);
  const [isGithubLoading, setGithubIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/chat');
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please try again.';
      } else {
        console.error(error);
        if (error.message) {
            description = error.message;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProviderSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    const providerId = provider.providerId;
    if (providerId === 'google.com') {
      setGoogleIsLoading(true);
    } else if (providerId === 'github.com') {
      setGithubIsLoading(true);
    }

    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/chat');
    } catch (error: any) {
      console.error(error);
      let title = 'Sign-In Failed';
      let description = error.message || 'Could not sign in.';

      if (error.code === 'auth/account-exists-with-different-credential') {
        title = 'Account Exists';
        description = 'An account with this email already exists using a different sign-in method. Please sign in with the original provider.';
      }
      
      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
       if (providerId === 'google.com') {
        setGoogleIsLoading(false);
      } else if (providerId === 'github.com') {
        setGithubIsLoading(false);
      }
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
          <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="m@example.com" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required placeholder="********" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center p-6 pt-0 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isGithubLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="relative w-full">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-sm text-muted-foreground">
              OR
            </span>
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" type="button" disabled={isLoading || isGoogleLoading || isGithubLoading} onClick={() => handleProviderSignIn(new GoogleAuthProvider())}>
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
              Google
            </Button>
            <Button variant="outline" className="w-full" type="button" disabled={isLoading || isGoogleLoading || isGithubLoading} onClick={() => handleProviderSignIn(new GithubAuthProvider())}>
              {isGithubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
              GitHub
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
