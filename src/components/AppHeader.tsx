"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, LogOut, ScanLine, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/scan', label: 'Movimientos', icon: ScanLine },
  { href: '/inventory', label: 'Bindcards', icon: Boxes },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { currentUserData, isCurrentUserAdmin, logout } = useAuth();
  const initial = currentUserData?.firstName?.charAt(0).toUpperCase() || 'B';

  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <Link
          href="/dashboard"
          className="mr-auto flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
            <Image src="/icon.png" alt="" width={26} height={26} priority />
          </span>
          <span className="hidden text-lg font-semibold text-white sm:block">BindGuard</span>
        </Link>

        <nav aria-label="Navegación principal" className="flex items-center gap-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white'
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}

          {isCurrentUserAdmin && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white'
              )}
              title="Administración"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden lg:inline">Administrar</span>
            </Link>
          )}
        </nav>

        <div className="ml-1 flex items-center gap-2 border-l border-sidebar-border pl-3">
          <div
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground sm:flex"
            aria-label={currentUserData ? `${currentUserData.firstName} ${currentUserData.lastName}` : 'Usuario'}
            title={currentUserData ? `${currentUserData.firstName} ${currentUserData.lastName}` : 'Usuario'}
          >
            {initial}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
