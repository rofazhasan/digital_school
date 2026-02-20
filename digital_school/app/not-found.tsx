"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl glass-card text-center">
        <CardHeader className="space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2 animate-bounce">
            <span className="text-4xl">🤔</span>
          </div>
          <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            404
          </CardTitle>
          <h2 className="text-xl font-semibold">Page Not Found</h2>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Home Page
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}