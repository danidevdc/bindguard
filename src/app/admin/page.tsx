
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

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

  if (authLoading || !isCurrentUserAdmin) {
    // Show loading or redirect will handle via useEffect
    // To prevent flash of content for non-admins, we can return a loader or null
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
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
              Panel de Administración
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Bienvenido al panel de administración. Aquí podrás gestionar usuarios, inventario y otras configuraciones del sistema.
            </p>
            <p className="text-center text-muted-foreground mt-4">
              (Más funcionalidades serán añadidas aquí pronto)
            </p>
            {/* Placeholder for future admin functionalities */}
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
