'use client';

import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/icons/google-icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';

export default function SocialLoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile already exists
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user profile in Firestore for new users
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
          bio: '',
          isAnonymous: false,
        });
      }
      
      toast({
        title: 'Signed In!',
        description: 'Welcome to Syncfluence.',
      });
      router.push('/chat');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <Button variant="outline" onClick={handleGoogleSignIn}>
        <GoogleIcon className="mr-2 h-5 w-5" />
        Google
      </Button>
    </div>
  );
}
