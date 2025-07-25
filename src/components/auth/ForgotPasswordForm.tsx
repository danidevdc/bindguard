
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail, isLoading } = useAuth();
  const { toast } = useToast();

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast({
        title: "Correo Requerido",
        description: "Por favor, ingresa tu correo electrónico.",
        variant: "destructive",
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast({
            title: "Correo Inválido",
            description: "Por favor, ingresa un formato de correo electrónico válido.",
            variant: "destructive",
        });
        return;
    }

    await sendPasswordResetEmail(email);
  };

  return (
    <Card className="shadow-xl">
        <>
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center">
                <Mail className="mr-2 h-6 w-6 text-primary"/>
                Correo de Recuperación
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || !email.trim()}>
                <Send className="mr-2 h-5 w-5" />
                {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>
            </form>
          </CardContent>
        </>
      <CardFooter className="pt-4">
        <p className="text-center text-sm w-full">
            <Link href="/login" passHref legacyBehavior>
                <a className="font-medium text-primary hover:underline">Volver a Iniciar Sesión</a>
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
