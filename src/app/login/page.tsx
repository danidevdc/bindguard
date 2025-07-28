
import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/icon.png"
            alt="BindGuard Logo"
            width={90}
            height={90}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground">BindGuard</h1>
          <p className="text-muted-foreground">Acceso seguro a tu sistema de inventario.</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
         <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BindGuard.
        </p>
      </div>
    </div>
  );
}
