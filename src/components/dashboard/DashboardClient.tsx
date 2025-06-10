
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, LayoutList, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function DashboardClient() {
  const { currentUser, isCurrentUserAdmin, getCurrentUserDetails } = useAuth(); 
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const userDetails = getCurrentUserDetails();
    if (userDetails) {
        // For admin.admin, display "Admin"
        if (userDetails.username === 'admin.admin') {
            setDisplayName('Admin');
        } else {
            const firstName = userDetails.firstName;
            const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            setDisplayName(capitalizedFirstName);
        }
    } else if (currentUser) { // Fallback if details are not yet fully loaded but username is
        const nameParts = currentUser.split('.');
         if (nameParts.length > 0) {
            const firstName = nameParts[0];
            const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            setDisplayName(capitalizedFirstName);
        } else {
            setDisplayName(currentUser);
        }
    }
  }, [currentUser, getCurrentUserDetails]);

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
        {isCurrentUserAdmin && (
          <CardContent className="p-6 pt-0">
            <Link href="/admin" passHref legacyBehavior>
              <Button
                variant="destructive"
                className="w-full h-20 text-lg flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
                aria-label="Administrar Sitio"
              >
                <Settings className="h-10 w-10 mb-1" />
                Administrar Sitio
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
