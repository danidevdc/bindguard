
"use client";

import Link from 'next/link';
import { LogOut, Home as HomeIcon } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Import useRouter
import Image from 'next/image';

export default function AppHeader() {
  const { logout } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const LOCAL_STORAGE_KEY = 'inProgressPrescription';

  const handleNavigateHome = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Could not clear in-progress prescription from localStorage", error);
    }
    router.push('/dashboard');
  };


  return (
    <header className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <button onClick={handleNavigateHome} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Image src="/icon.png" alt="BindGuard Logo" width={28} height={28} />
          <h1 className="text-xl font-semibold">BindGuard</h1>
        </button>
        <div className="flex items-center space-x-2"> 
          <Button
            variant="ghost" // Changed to ghost for transparent background by default
            className="text-primary hover:bg-primary/10 hover:text-primary [&>svg]:text-primary"
            onClick={handleNavigateHome}
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

    
