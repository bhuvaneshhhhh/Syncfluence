'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  EmailAuthProvider,
  linkWithCredential,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, User, Mail, Lock, Image as ImageIcon, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, useFirebaseApp } from '@/firebase';
import { UserAvatar } from '@/components/chat/user-avatar';
import { getStorage } from 'firebase/storage';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(3, 'Too short').max(50, 'Too long'),
  bio: z.string().max(160, 'Too long').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Must be 6+ characters').optional().or(z.literal('')),
  currentPassword: z.string().optional(),
});

export default function SettingsPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      email: '',
      password: '',
      currentPassword: '',
    },
  });
  
  // Set form values once user data is loaded
  useEffect(() => {
    if (user && firestore) {
      form.setValue('displayName', user.displayName || '');
      form.setValue('email', user.email || '');

      const userDocRef = doc(firestore, 'users', user.uid);
      import('firebase/firestore').then(({ getDoc }) => {
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            form.setValue('bio', docSnap.data()?.bio || '');
          }
        });
      });
    }
  }, [user, firestore, form]);


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      let newAvatarUrl = user.photoURL;

      // 1. Upload new avatar if selected
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(storageRef, avatarFile);
        newAvatarUrl = await getDownloadURL(storageRef);
      }

      // 2. Reauthenticate if password is being changed
      if (values.password && user.email) {
        if (!values.currentPassword) {
          form.setError('currentPassword', { message: 'Current password is required to change it.' });
          setIsLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.password);
      }

      // 3. Link email/password if user is anonymous
      if (user.isAnonymous && values.email && values.password) {
        const credential = EmailAuthProvider.credential(values.email, values.password);
        await linkWithCredential(user, credential);
        // User is no longer anonymous, their data is preserved
      }

      // 4. Update Firebase Auth profile
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: newAvatarUrl,
      });

      // 5. Update Firestore user document
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        bio: values.bio,
        avatarUrl: newAvatarUrl,
        isAnonymous: user.isAnonymous && !(values.email && values.password), // Becomes non-anon if email/pass linked
        ...(user.isAnonymous && values.email && { email: values.email }), // only update email if it was just linked
      });

      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved.',
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl">
         <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your account details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <UserAvatar
                      user={{...user, photoURL: avatarPreview || user.photoURL}}
                      className="h-20 w-20"
                    />
                     <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground hover:bg-primary/90">
                        <ImageIcon className="h-4 w-4" />
                        <span className="sr-only">Upload new avatar</span>
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                   <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem className='flex-1'>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little about yourself"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {user.isAnonymous ? (
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className='text-lg'>Make Account Permanent</CardTitle>
                            <CardDescription>Add an email and password to save your profile and log in on other devices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className='text-lg'>Account Credentials</CardTitle>
                             <CardDescription>Your email is your permanent login ID. You can change your password below.</CardDescription>
                        </CardHeader>
                        <Collapsible>
                            <CollapsibleContent asChild>
                                <CardContent className="space-y-4 pt-4">
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <Input value={user.email || ''} disabled />
                                    </FormItem>
                                    <FormField
                                        control={form.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Current Password (required to change)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter current password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter new password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </CardContent>
                            </CollapsibleContent>
                             <div className='flex items-center justify-between p-6 pt-2'>
                                <span>Change Password</span>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                             </div>
                        </Collapsible>
                    </Card>
                )}


                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    