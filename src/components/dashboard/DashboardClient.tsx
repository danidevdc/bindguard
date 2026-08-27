"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const mainActions = [
  {
    href: '/dispense',
    title: 'Dispensar medicamento',
    description: 'Registra una salida contra receta y actualiza el saldo.',
    icon: ArrowDownToLine,
    tone: 'primary',
    index: '01',
  },
  {
    href: '/stock-entry',
    title: 'Registrar entrada',
    description: 'Añade existencias, lote y fecha de vencimiento.',
    icon: ArrowUpFromLine,
    tone: 'accent',
    index: '02',
  },
  {
    href: '/inventory',
    title: 'Consultar Bindcards',
    description: 'Revisa stock, movimientos y alertas por medicamento.',
    icon: Boxes,
    tone: 'neutral',
    index: '03',
  },
] as const;

export default function DashboardClient() {
  const { currentUserData, isCurrentUserAdmin } = useAuth();
  const firstName = currentUserData?.firstName || 'Usuario';
  const [greeting, setGreeting] = useState('Hola');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches');
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Panel operativo</p>
          <h1 className="page-heading mt-2">{greeting}, {firstName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Selecciona una operación para continuar.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Sistema conectado
        </div>
      </header>

      <section aria-labelledby="quick-actions-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="quick-actions-heading" className="text-base font-semibold">Operaciones frecuentes</h2>
          <span className="font-mono text-xs text-muted-foreground">ACCESO RÁPIDO</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {mainActions.map(({ href, title, description, icon: Icon, tone, index }) => (
            <Link
              key={href}
              href={href}
              className="group relative min-h-52 overflow-hidden rounded-lg border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-md',
                    tone === 'primary' && 'bg-primary text-primary-foreground',
                    tone === 'accent' && 'bg-accent text-accent-foreground',
                    tone === 'neutral' && 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{index}</span>
              </div>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
              <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {isCurrentUserAdmin && (
        <section className="grid gap-4 border-t pt-8 md:grid-cols-2">
          <div>
            <p className="eyebrow">Administración</p>
            <h2 className="mt-2 text-xl font-semibold">Herramientas de control</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Gestión de catálogo, usuarios y captura asistida de recetas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/scan-recipe"
              className="flex items-center gap-3 rounded-lg border bg-card p-4 font-semibold transition-colors hover:border-accent/50 hover:bg-accent/5"
            >
              <ScanSearch className="h-5 w-5 text-accent" />
              Escanear receta
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg border bg-card p-4 font-semibold transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              Administrar
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
