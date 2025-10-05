'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Loader2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';

export default function AnonymousLoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Display Name Required',
        description: 'Please enter a name to join.',
      });
      return;
    }
    setIsLoading(true);

    try {
      // Check for unique display name
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('displayName', '==', displayName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Name Taken',
          description: 'That name is already in use. Please choose another.',
        });
        setIsLoading(false);
        return;
      }

      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName });

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: null,
        avatarUrl: `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
        bio: '',
        isAnonymous: true,
      });

      toast({
        title: 'Welcome!',
        description: 'You have joined the chat anonymously.',
      });
      router.push('/chat');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <form onSubmit={handleLogin}>
        <CardHeader className="space-y-1 text-center">
            <CardTitle>Join as a Guest</CardTitle>
            <CardDescription>
                Choose a temporary display name to start chatting.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="displayName" 
                type="text" 
                placeholder="Enter your name..." 
                required 
                className="pl-10" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Chat
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
