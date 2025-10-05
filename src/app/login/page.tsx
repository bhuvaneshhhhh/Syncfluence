'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnonymousLoginForm from '@/components/auth/anonymous-login-form';
import SocialLoginForm from '@/components/auth/social-login-form';
import EmailLoginForm from '@/components/auth/email-login-form';
import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <MessageSquareText className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-headline text-foreground">Syncfluence</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Sign in to your account or join anonymously.
          </p>
        </div>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="anonymous">Join Anonymously</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="space-y-4">
              <EmailLoginForm />
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <SocialLoginForm />
               <p className="px-8 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                    href="/signup"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Sign Up
                </Link>
                .
            </p>
            </div>
          </TabsContent>
          <TabsContent value="anonymous">
            <AnonymousLoginForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
