
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, PackagePlus, Edit3, LockKeyhole, FileX2, Settings, PillBottle } from 'lucide-react';

export default function AdminPage() {
  const { isCurrentUserAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta página.',
        variant: 'destructive',
      });
      router.replace('/dashboard');
    }
  }, [isCurrentUserAdmin, authLoading, router, toast]);

  const handleComingSoon = (featureName: string) => {
    toast({
      title: "Próximamente",
      description: `La funcionalidad "${featureName}" estará disponible pronto.`,
      variant: "default",
    });
  };

  if (authLoading || !isCurrentUserAdmin) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
        </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="mb-6">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push('/dashboard')}
          aria-label="Volver al Dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
             <Settings className="h-12 w-12 mx-auto text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Panel de Administración
            </CardTitle>
            <CardDescription>
              Gestiona el inventario, recetas y otras configuraciones del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Gestión de Inventario */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Gestión de Medicamentos e Inventario</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/add-medicine" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <PillBottle className="mr-3 h-6 w-6 text-primary" />
                    Añadir Nuevo Medicamento
                  </Button>
                </Link>
                 <Link href="/stock-entry" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <PackagePlus className="mr-3 h-6 w-6 text-accent" />
                    Añadir Stock (Lote Existente)
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start text-base py-6" onClick={() => handleComingSoon('Editar Medicamentos')}>
                  <Edit3 className="mr-3 h-6 w-6 text-green-600" />
                  Editar Medicamentos
                </Button>
                <Button variant="outline" className="w-full justify-start text-base py-6" onClick={() => handleComingSoon('Gestionar Lotes (Bloquear/Editar Vencimiento)')}>
                  <LockKeyhole className="mr-3 h-6 w-6 text-destructive" />
                  Gestionar Lotes (Bloquear/Editar Vencimiento)
                </Button>
              </div>
            </div>

            {/* Gestión de Recetas */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Gestión de Recetas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full justify-start text-base py-6" onClick={() => handleComingSoon('Anular Receta')}>
                  <FileX2 className="mr-3 h-6 w-6 text-destructive" />
                  Anular Receta
                </Button>
              </div>
            </div>

            {/* Placeholder para más funcionalidades */}
            <p className="text-center text-muted-foreground mt-6">
              Más herramientas de administración se añadirán aquí progresivamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
