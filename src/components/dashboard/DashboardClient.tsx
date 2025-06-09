
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, LayoutList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function DashboardClient() {
  const { currentUser } = useAuth(); 
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.split('.');
      if (nameParts.length > 0) {
        const firstName = nameParts[0];
        const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        setDisplayName(capitalizedFirstName);
      } else {
        setDisplayName(currentUser); 
      }
    }
  }, [currentUser]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">
            {displayName ? `Hola, ${displayName}` : 'Bienvenido'}
          </CardTitle>
          
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <Link href="/scan" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-40 text-xl bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Escanear Medicamento"
            >
              <QrCode className="h-16 w-16 mb-3" />
              <span>Escanear</span>
              <span>Medicamento</span>
            </Button>
          </Link>
          <Link href="/inventory" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-40 text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Ver Inventario"
            >
              <LayoutList className="h-16 w-16 mb-3" />
              Inventario
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
