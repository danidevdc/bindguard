
import RegistrationForm from '@/components/auth/RegistrationForm';
import AuthShell from '@/components/auth/AuthShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrar Usuario - BindGuard',
  description: 'Crea una nueva cuenta para acceder al sistema de inventario.',
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Nuevo usuario"
      title="Crea tu cuenta"
      description="Completa tus datos para solicitar acceso al inventario."
      backHref="/login"
      backLabel="Volver al acceso"
    >
      <RegistrationForm />
    </AuthShell>
  );
}
