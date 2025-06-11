
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Basic password strength calculation (for UI feedback only)
const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]/)) strength += 15;
  if (password.match(/[A-Z]/)) strength += 15;
  if (password.match(/[0-9]/)) strength += 15;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 15; // Special characters
  if (password.length >= 12) strength += 15;
  return Math.min(strength, 100);
};

const getStrengthColor = (strength: number) => {
  if (strength < 30) return "bg-destructive";
  if (strength < 60) return "bg-orange-500";
  if (strength < 85) return "bg-yellow-500";
  return "bg-primary";
};

export default function RegistrationForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const { register, isLoading, checkUsernameExists } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Debounce username check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }
    const handler = setTimeout(async () => {
      setUsernameCheckLoading(true);
      const exists = await checkUsernameExists(username.trim().toLowerCase());
      setUsernameAvailable(!exists);
      setUsernameCheckLoading(false);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [username, checkUsernameExists]);

  // Validate form for button disable state
  useEffect(() => {
    const allFieldsFilled =
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      username.trim() !== '' &&
      password !== '' &&
      confirmPassword !== '';
    const passwordsMatch = password === confirmPassword;
    const usernameIsAvailable = usernameAvailable === true;
    const passwordIsStrongEnough = passwordStrength >= 50;

    setIsFormValid(
      allFieldsFilled &&
      passwordsMatch &&
      usernameIsAvailable &&
      !usernameCheckLoading &&
      passwordIsStrongEnough &&
      !isLoading // Also consider global loading state
    );
  }, [
    firstName,
    lastName,
    username,
    password,
    confirmPassword,
    usernameAvailable,
    usernameCheckLoading,
    passwordStrength,
    isLoading
  ]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Re-check conditions for safety, though button state should prevent this
    if (!isFormValid) {
       toast({
        title: "Error de Registro",
        description: "Por favor, completa y corrige todos los campos.",
        variant: "destructive",
      });
      return;
    }

    // Redundant checks (already handled by isFormValid for button state, but good as a safeguard)
    if (!firstName || !lastName || !username || !password || !confirmPassword) {
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
    if (passwordStrength < 50) { 
        toast({
            title: "Contraseña Débil",
            description: "Por favor, elige una contraseña más segura.",
            variant: "destructive",
        });
        return;
    }
    if (usernameAvailable === false) {
      toast({
        title: "Nombre de Usuario No Disponible",
        description: "El nombre de usuario ingresado ya está en uso. Por favor, elige otro.",
        variant: "destructive",
      });
      return;
    }

    await register(firstName, lastName, username.trim().toLowerCase(), password);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Registro de Usuario</CardTitle>
        <CardDescription className="text-center">Crea tu cuenta para acceder al sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
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
            <div className="space-y-1">
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
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Elige un nombre de usuario (ej: juan.perez)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-background"
            />
            {usernameCheckLoading && <p className="text-xs text-muted-foreground">Verificando disponibilidad...</p>}
            {username.trim() && !usernameCheckLoading && usernameAvailable === true && (
              <p className="text-xs text-green-600">Nombre de usuario disponible.</p>
            )}
            {username.trim() && !usernameCheckLoading && usernameAvailable === false && (
              <p className="text-xs text-destructive">Este nombre de usuario ya existe.</p>
            )}
             <p className="text-xs text-muted-foreground">
              Será usado para iniciar sesión. Ejemplo: {firstName.trim().toLowerCase() || 'nombre'}.{lastName.trim().toLowerCase() || 'apellido'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crea una contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {password && (
              <div className="mt-1">
                <Progress value={passwordStrength} className={`h-2 ${getStrengthColor(passwordStrength)}`} />
                <p className="text-xs mt-1 text-muted-foreground">
                  Fortaleza: {passwordStrength < 30 ? "Muy débil" : passwordStrength < 60 ? "Débil" : passwordStrength < 85 ? "Buena" : "Fuerte"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
             <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/>Las contraseñas no coinciden.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/50">
            <span className="font-semibold">Nota de seguridad:</span> Este es un sistema de demostración. En una aplicación real, las contraseñas se almacenarían de forma segura (hashed). Aquí se almacenan directamente para simplificar, lo cual <span className="text-destructive font-medium">no es seguro para producción</span>.
          </p>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={!isFormValid || isLoading}
          >
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


    