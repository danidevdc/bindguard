
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import ScanForm from '@/components/scan/ScanForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DispensePage() {
  const router = useRouter();

  return (
    <AuthWrapper>
      <div className="mb-6">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.back()}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="max-w-2xl mx-auto">
        <ScanForm />
      </div>
    </AuthWrapper>
  );
}
