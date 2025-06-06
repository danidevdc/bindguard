
"use client";

import AuthWrapper from '@/components/AuthWrapper';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription removed
import { ShoppingCart, PackagePlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScanModeSelectionPage() {
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
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Seleccionar una opción
            </CardTitle>
            {/* CardDescription removed */}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <Link href="/dispense" passHref legacyBehavior>
              <Button
                variant="default"
                className="w-full h-36 text-lg bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105 p-4"
                aria-label="Dispensar Medicamentos de Receta"
              >
                <ShoppingCart className="h-10 w-10 mb-2" />
                Dispensar Medicamentos
                <span className="text-xs mt-1">(Receta)</span>
                <ArrowRight className="h-5 w-5 mt-2 opacity-75" />
              </Button>
            </Link>
            <Link href="/stock-entry" passHref legacyBehavior>
              <Button
                variant="default"
                className="w-full h-36 text-lg bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center shadow-md rounded-lg transition-transform hover:scale-105 p-4"
                aria-label="Añadir Stock al Inventario"
              >
                <PackagePlus className="h-10 w-10 mb-2" />
                Añadir Stock
                <span className="text-xs mt-1">(Ingreso)</span>
                <ArrowRight className="h-5 w-5 mt-2 opacity-75" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
