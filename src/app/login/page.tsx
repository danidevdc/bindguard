
import LoginForm from '@/components/auth/LoginForm';
import AuthShell from '@/components/auth/AuthShell';

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Acceso"
      title="Inicia sesión"
      description="Ingresa tus credenciales para continuar con la operación."
    >
      <LoginForm />
    </AuthShell>
  );
}
