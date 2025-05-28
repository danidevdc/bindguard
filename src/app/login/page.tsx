import LoginForm from '@/components/auth/LoginForm';
import { Pill } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Pill className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-foreground">RxLocal Inventory</h1>
          <p className="text-muted-foreground">Secure access to your inventory system.</p>
        </div>
        <LoginForm />
         <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RxLocal Inventory.
        </p>
      </div>
    </div>
  );
}
