
"use client";

import Link from 'next/link';
import { Pill, LogOut, Home as HomeIcon } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter(); // Initialize useRouter

  return (
    <header className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Pill className="h-7 w-7" />
          <h1 className="text-xl font-semibold">BindGuard</h1>
        </Link>
        <div className="flex items-center space-x-2"> 
          <Button
            variant="ghost" // Changed to ghost for transparent background by default
            className="text-primary hover:bg-primary/10 hover:text-primary [&>svg]:text-primary"
            onClick={() => router.push('/dashboard')}
            aria-label="Inicio"
          >
            <HomeIcon className="mr-2 h-5 w-5" />
            Inicio
          </Button>
          <Button 
            variant="ghost" // Changed to ghost for transparent background by default
            onClick={logout} 
            className="text-primary hover:bg-primary/10 hover:text-primary [&>svg]:text-primary"
            aria-label="Salir"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}

