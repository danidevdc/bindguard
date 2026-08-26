import Link from 'next/link';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine } from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';
import { cn } from '@/lib/utils';

const options = [
  {
    href: '/dispense',
    title: 'Dispensar',
    description: 'Registra una salida de inventario asociada a una receta.',
    icon: ArrowDownToLine,
    label: 'Salida',
    className: 'bg-primary text-primary-foreground',
  },
  {
    href: '/stock-entry',
    title: 'Añadir stock',
    description: 'Registra un ingreso con lote y fecha de vencimiento.',
    icon: ArrowUpFromLine,
    label: 'Entrada',
    className: 'bg-accent text-accent-foreground',
  },
] as const;

export default function ScanModeSelectionPage() {
  return (
    <AuthWrapper>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al resumen
        </Link>

        <header className="mb-7">
          <p className="eyebrow">Movimientos</p>
          <h1 className="page-heading mt-2">¿Qué operación realizarás?</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Elige el tipo de movimiento para actualizar la Bindcard correspondiente.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {options.map(({ href, title, description, icon: Icon, label, className }) => (
            <Link
              key={href}
              href={href}
              className="group relative min-h-64 rounded-lg border bg-card p-6 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between">
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-md', className)}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">{label}</span>
              </div>
              <h2 className="mt-10 text-2xl font-semibold">{title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </AuthWrapper>
  );
}
