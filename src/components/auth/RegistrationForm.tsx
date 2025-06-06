
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RegistrationForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const generateUsername = () => {
      if (firstName.trim() && lastName.trim()) {
        const username = `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`;
        setGeneratedUsername(username);
      } else {
        setGeneratedUsername('');
      }
    };
    generateUsername();
  }, [firstName, lastName]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName || !lastName || !password || !confirmPassword) {
      toast({
        title: "Error de Registro",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Error de Registro",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    // Username is generated (firstName.lastName) and passed from useAuth
    await register(firstName, lastName, password);
    // Toast for success/failure is handled within useAuth's register
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Registro de Usuario</CardTitle>
        <CardDescription className="text-center">Crea tu cuenta para acceder al sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Ingresa tu nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Ingresa tu apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usernameDisplay">Usuario (generado)</Label>
            <Input
              id="usernameDisplay"
              type="text"
              value={generatedUsername}
              readOnly
              className="bg-muted/50 border-dashed cursor-default focus:ring-0 focus:outline-none pointer-events-none"
              placeholder="nombre.apellido"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crea una contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            <UserPlus className="mr-2 h-5 w-5" />
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
