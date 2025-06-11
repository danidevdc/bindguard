
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail, isLoading } = useAuth(); // Assuming isLoading state for this too
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast({
        title: "Correo Requerido",
        description: "Por favor, ingresa tu correo electrónico.",
        variant: "destructive",
      });
      return;
    }
    // Basic email format validation (can be more robust)
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast({
            title: "Correo Inválido",
            description: "Por favor, ingresa un formato de correo electrónico válido.",
            variant: "destructive",
        });
        return;
    }

    try {
      // This function is a placeholder in useAuth and will show a toast.
      // The actual email sending needs backend implementation.
      await sendPasswordResetEmail(email); 
      // Toast for simulation is handled within sendPasswordResetEmail
      setEmail(''); // Clear email field after "submission"
    } catch (error) {
      console.error("Error in password reset simulation:", error);
      toast({
        title: "Error",
        description: "Ocurrió un problema al procesar tu solicitud.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">Restablecer Contraseña</CardTitle>
        <CardDescription className="text-center">
          Te enviaremos un enlace a tu correo para restablecer tu contraseña (funcionalidad simulada).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu.correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            <Send className="mr-2 h-5 w-5" />
            {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" passHref legacyBehavior>
            <a className="font-medium text-primary hover:underline">Volver a Iniciar Sesión</a>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
