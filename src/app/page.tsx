"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4 p-8">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
      </div>
    </div>
  );
}
