
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { MailQuestion } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña - BindGuard',
  description: 'Solicita un enlace para restablecer tu contraseña.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <MailQuestion className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">Ingresa tu correo electrónico asociado a tu cuenta.</p>
        </div>
        <ForgotPasswordForm />
         <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BindGuard.
        </p>
      </div>
    </div>
  );
}
