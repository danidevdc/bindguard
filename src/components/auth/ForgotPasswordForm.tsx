
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';
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
    <Card className="border-0 shadow-none">
          <CardContent className="p-0">
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
                  autoComplete="email"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isLoading || !email.trim()}>
                <Send className="mr-2 h-5 w-5" />
                {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>
            </form>
          </CardContent>
    </Card>
  );
}
