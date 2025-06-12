
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
    const fetchAndSetDisplayName = async () => {
      const userDetails = await getCurrentUserDetails(); // Use async/await for clarity
      if (userDetails) {
          if (userDetails.username === 'admin.admin') {
              setDisplayName('Admin');
          } else if (typeof userDetails.firstName === 'string' && userDetails.firstName.trim() !== '') {
              const firstName = userDetails.firstName;
              const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
              setDisplayName(capitalizedFirstName);
          } else {
              // Fallback if firstName is not a valid string or is empty
              setDisplayName(userDetails.username || "Usuario"); 
          }
      } else if (currentUser) { 
          // Fallback to currentUser if userDetails are null but currentUser (username string) exists
          // This part might be less common if getCurrentUserDetails always returns something or null
          const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
          if (username) {
            const nameParts = username.split('.');
            if (nameParts.length > 0 && nameParts[0]) {
                const firstNamePart = nameParts[0];
                const capitalizedFirstName = firstNamePart.charAt(0).toUpperCase() + firstNamePart.slice(1).toLowerCase();
                setDisplayName(capitalizedFirstName);
            } else {
                setDisplayName(username); // Use full username if splitting fails
            }
          } else {
             setDisplayName("Bienvenido"); // Generic fallback
          }
      } else {
        setDisplayName("Bienvenido"); // Most generic fallback
      }
    };

    fetchAndSetDisplayName();
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
              className="w-full h-40 text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Escanear Medicamento"
            >
              <QrCode className="h-20 w-20 mb-3" /> {/* Cambiado de h-16 w-16 */}
              <span>Escanear</span>
              <span>Medicamento</span>
            </Button>
          </Link>
          <Link href="/inventory" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-40 text-xl bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Ver Bindcards"
            >
              <LayoutList className="h-20 w-20 mb-3" /> {/* Cambiado de h-16 w-16 */}
              Bindcards
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

