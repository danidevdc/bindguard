import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  backHref,
  backLabel,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-card lg:grid lg:grid-cols-[minmax(320px,0.8fr)_minmax(560px,1.2fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute inset-x-0 top-0 h-1 bg-sidebar-primary" />
        <Link href="/login" className="flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white">
            <Image src="/icon.png" alt="" width={30} height={30} priority />
          </span>
          <span className="text-xl font-semibold">BindGuard</span>
        </Link>

        <div className="my-auto max-w-md">
          <p className="font-mono text-xs font-semibold uppercase text-sidebar-primary" style={{ letterSpacing: '0.08em' }}>
            Inventario farmacéutico
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Control preciso en cada movimiento.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-sidebar-foreground/70">
            Una operación clara para registrar entradas, dispensar y mantener cada Bindcard al día.
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-sidebar-border pt-6 text-sm text-sidebar-foreground/70">
          <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
          Acceso protegido con Firebase
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/login" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-border">
                <Image src="/icon.png" alt="" width={27} height={27} priority />
              </span>
              <span className="text-lg font-semibold">BindGuard</span>
            </Link>
          </div>

          {backHref && (
            <Link
              href={backHref}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel || 'Volver'}
            </Link>
          )}

          <header className="mb-7">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </header>

          {children}
        </div>
      </section>
    </main>
  );
}
