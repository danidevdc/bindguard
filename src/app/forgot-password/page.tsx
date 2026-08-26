
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import AuthShell from '@/components/auth/AuthShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña - BindGuard',
  description: 'Inicia el proceso para restablecer tu contraseña.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperación"
      title="Restablece tu contraseña"
      description="Te enviaremos un enlace seguro al correo asociado con tu cuenta."
      backHref="/login"
      backLabel="Volver al acceso"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
