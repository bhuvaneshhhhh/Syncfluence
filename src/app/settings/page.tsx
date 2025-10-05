'use client';

import { useState, useEffect, type FormEvent } from 'react';
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
import { getStorage } from 'firebase/storage';
import { Loader2, User, Mail, Lock, Image as ImageIcon, ArrowLeft, ChevronDown } from 'lucide-react';

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const profileFormSchema = z.object({
  displayName: z.string().min(3, 'Too short').max(50, 'Too long'),
  bio: z.string().max(160, 'Too long').optional(),
});

const accountFormSchema = z.object({
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Must be 6+ characters').optional().or(z.literal('')),
});

const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

export default function SettingsPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
    },
  });

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const passwordChangeForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (user && firestore) {
      profileForm.setValue('displayName', user.displayName || '');
      accountForm.setValue('email', user.email || '');

      const userDocRef = doc(firestore, 'users', user.uid);
      import('firebase/firestore').then(({ getDoc }) => {
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            profileForm.setValue('bio', docSnap.data()?.bio || '');
          }
        });
      });
    }
  }, [user, firestore, profileForm, accountForm]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user || !firestore) return;
    setIsProfileLoading(true);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      let newAvatarUrl = user.photoURL;

      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(storageRef, avatarFile);
        newAvatarUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: newAvatarUrl,
      });

      await updateDoc(userDocRef, {
        displayName: values.displayName,
        bio: values.bio,
        avatarUrl: newAvatarUrl,
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
      setIsProfileLoading(false);
    }
  };
  
  const onAccountSubmit = async (values: z.infer<typeof accountFormSchema>) => {
    if (!user || !firestore || !user.isAnonymous) return;
    setIsAccountLoading(true);

    try {
       if (user.isAnonymous && values.email && values.password) {
        const credential = EmailAuthProvider.credential(values.email, values.password);
        await linkWithCredential(user, credential);

        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            isAnonymous: false,
            email: values.email
        });

        toast({
            title: 'Account Secured',
            description: 'Your account is now permanent.',
        });
       }
    } catch (error: any) {
         console.error('Error securing account:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsAccountLoading(false);
    }
  };
  
    const onPasswordChangeSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
        if (!user || !user.email) return;
        setIsPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, values.newPassword);
            toast({
                title: 'Password Updated',
                description: 'Your password has been changed successfully.',
            });
            passwordChangeForm.reset();
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast({
                variant: 'destructive',
                title: 'Password Change Failed',
                description: error.code === 'auth/wrong-password' ? 'Incorrect current password.' : 'An error occurred.',
            });
        } finally {
            setIsPasswordLoading(false);
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
      <div className="w-full max-w-2xl space-y-8">
         <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your display name, bio, and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
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
                    control={profileForm.control}
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
                  control={profileForm.control}
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
                
                <Button type="submit" className="w-full" disabled={isProfileLoading}>
                  {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {user.isAnonymous ? (
            <Card className="bg-card">
                 <Form {...accountForm}>
                    <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
                        <CardHeader>
                            <CardTitle className='text-lg'>Make Account Permanent</CardTitle>
                            <CardDescription>Add an email and password to save your profile and log in on other devices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={accountForm.control}
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
                                control={accountForm.control}
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
                         <CardContent>
                             <Button type="submit" className="w-full" disabled={isAccountLoading}>
                                {isAccountLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Account
                            </Button>
                        </CardContent>
                    </form>
                 </Form>
            </Card>
        ) : (
             <Card>
                <Collapsible>
                     <div className='flex items-center justify-between p-6'>
                        <div>
                             <CardTitle className='text-lg'>Account Credentials</CardTitle>
                             <CardDescription>Your email is your permanent login ID. You can change your password below.</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                     </div>
                    <CollapsibleContent asChild>
                        <CardContent className="space-y-4 pt-4 border-t">
                             <Form {...passwordChangeForm}>
                                <form onSubmit={passwordChangeForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
                                     <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <Input value={user.email || ''} disabled />
                                    </FormItem>
                                    <FormField
                                        control={passwordChangeForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter current password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                        control={passwordChangeForm.control}
                                        name="newPassword"
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
                                    <Button type="submit" className="w-full" disabled={isPasswordLoading}>
                                        {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Change Password
                                    </Button>
                                </form>
                             </Form>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        )}
      </div>
    </div>
  );
}
