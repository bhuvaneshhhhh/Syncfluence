'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, User, Github } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons/google-icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';

export default function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleIsLoading] = useState(false);
  const [isGithubLoading, setGithubIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: "Password must be at least 6 characters long.",
        });
        return;
    }
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`
      });

      toast({
        title: 'Sign Up Successful',
        description: 'Welcome to Syncfluence!',
      });
      router.push('/chat');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    if (provider.providerId === 'google.com') {
      setGoogleIsLoading(true);
    } else {
      setGithubIsLoading(true);
    }
    
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Create user profile in Firestore if it's a new user
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`
      }, { merge: true });


      toast({
        title: 'Sign Up Successful',
        description: 'Welcome to Syncfluence!',
      });
      router.push('/chat');
    } catch (error: any) {
      console.error(error);
      let title = `${provider.providerId === 'google.com' ? 'Google' : 'GitHub'} Sign-In Failed`;
      let description = error.message || 'Could not sign in.';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        title = 'Account Exists';
        description = 'An account with this email already exists using a different sign-in method. Please sign in using the original provider.';
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
      if (provider.providerId === 'google.com') {
        setGoogleIsLoading(false);
      } else {
        setGithubIsLoading(false);
      }
    }
  };


  return (
    <Card className="shadow-lg">
      <form onSubmit={handleSignup}>
        <CardHeader className="space-y-1 text-center">
            <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="displayName" type="text" placeholder="John Doe" required className="pl-10" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
          </div>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isGithubLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
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
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
