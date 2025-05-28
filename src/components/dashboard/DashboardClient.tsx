"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, LayoutList } from 'lucide-react';

export default function DashboardClient() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold">Welcome to RxLocal</CardTitle>
          <CardDescription>Manage your pharmacy inventory efficiently.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <Link href="/scan" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-32 text-lg bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Scan Medicine or Manual Entry"
            >
              <QrCode className="h-10 w-10 mb-2" />
              Scan / Manual Entry
            </Button>
          </Link>
          <Link href="/inventory" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-32 text-lg bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="View Inventory"
            >
              <LayoutList className="h-10 w-10 mb-2" />
              Inventory View
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
