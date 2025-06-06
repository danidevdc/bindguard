
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import ScanForm, { type ScanFormRef } from '@/components/scan/ScanForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function DispensePage() {
  const router = useRouter();
  const scanFormRef = useRef<ScanFormRef>(null);

  const handleBackNavigation = () => {
    // Try to navigate back within ScanForm first
    if (scanFormRef.current && scanFormRef.current.navigateBackStep()) {
      return; // Navigation was handled by ScanForm
    }
    // If ScanForm can't go back further, use router.back()
    router.back();
  };

  return (
    <AuthWrapper>
      <div className="mb-6">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleBackNavigation}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="max-w-2xl mx-auto">
        <ScanForm ref={scanFormRef} />
      </div>
    </AuthWrapper>
  );
}

    