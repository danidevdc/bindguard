
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, LayoutList, Settings, ScanSearch } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardClient() {
  const { isCurrentUserAdmin } = useAuth(); 

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">
            Bienvenido!
          </CardTitle>
          
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {isCurrentUserAdmin && (
            <Link href="/scan-recipe" passHref legacyBehavior>
              <Button
                variant="default"
                className="w-full h-40 text-xl bg-purple-600 hover:bg-purple-600/90 text-white flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
                aria-label="Escanear Receta"
              >
                <ScanSearch className="h-16 w-16 mb-3" />
                Escanear
                Receta
              </Button>
            </Link>
          )}
          <Link href="/scan" passHref legacyBehavior>
            <Button
              variant="default"
              className="w-full h-40 text-xl bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105"
              aria-label="Escanear Medicamento"
            >
              <QrCode className="h-20 w-20 mb-3" />
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
              <LayoutList className="h-20 w-20 mb-3" />
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

