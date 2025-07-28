
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Edit3, FileX2, Settings, PillBottle, Users, Power, LayoutList, ClipboardEdit, ScanSearch } from 'lucide-react';

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
                    Añadir Medicamento
                  </Button>
                </Link>
                <Link href="/admin/edit-medicine" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <Edit3 className="mr-3 h-6 w-6 text-blue-600" />
                    Editar Medicamentos
                  </Button>
                </Link>
                <Link href="/admin/toggle-medicine-status" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <Power className="mr-3 h-6 w-6 text-orange-500" />
                    Abrir/Cerrar Medicamento
                  </Button>
                </Link>
                <Link href="/admin/inventory" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <ClipboardEdit className="mr-3 h-6 w-6 text-indigo-600" />
                    Gestionar Bindcards
                  </Button>
                </Link>
              </div>
            </div>

            {/* Gestión de Recetas */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Gestión de Recetas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Link href="/scan-recipe" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <ScanSearch className="mr-3 h-6 w-6 text-purple-600" />
                    Escanear Receta (IA)
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start text-base py-6" onClick={() => handleComingSoon('Anular Receta')}>
                  <FileX2 className="mr-3 h-6 w-6 text-destructive" />
                  Anular Receta
                </Button>
              </div>
            </div>

            {/* Gestión de Usuarios */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Gestión de Usuarios</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/manage-users" passHref legacyBehavior>
                  <Button variant="outline" className="w-full justify-start text-base py-6">
                    <Users className="mr-3 h-6 w-6 text-blue-600" />
                    Gestionar Usuarios
                  </Button>
                </Link>
              </div>
            </div>

            <p className="text-center text-muted-foreground mt-6">
              Más herramientas de administración se añadirán aquí progresivamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
