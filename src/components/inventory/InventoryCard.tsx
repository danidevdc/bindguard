
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, CalendarDays, UserCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface InventoryCardProps {
  medicine: Medicine;
}

interface ProcessedRecord extends DispensingRecord {
  balance: number;
}

export default function InventoryCard({ medicine }: InventoryCardProps) {
  const stockLevelAlertThreshold = 10;
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
  }, []);

  // Sort history chronologically (oldest first) for balance calculation
  const sortedHistoryForBalance = [...medicine.dispensingHistory].sort((a, b) =>
    compareAsc(parseISO(a.date), parseISO(b.date))
  );

  let runningBalance = 0;
  const processedHistory: ProcessedRecord[] = sortedHistoryForBalance.map(record => {
    if (record.type === 'stocked') {
      runningBalance += record.quantity;
    } else if (record.type === 'dispensed') {
      runningBalance -= record.quantity;
    }
    return { ...record, balance: runningBalance };
  });

  // For display, show newest first by reversing the processed (and balance-calculated) history
  // Or, if you want oldest first for display as well, just use processedHistory directly.
  // Based on the request "el ultimo cambio en la ultima fila", we want oldest first.
  const displayHistory = processedHistory; // Oldest first, newest at the bottom

  const isExpiredClient = (expirationDate: string | undefined, comparisonDate: Date): boolean => {
    if (!expirationDate) return false;
    try {
      const parsedExpDate = parseISO(expirationDate);
      // Check if parsedExpDate is a valid date
      if (isNaN(parsedExpDate.getTime())) return false;
      return compareAsc(parsedExpDate, comparisonDate) < 0;
    } catch (error) {
      // console.error("Error parsing expirationDate in isExpiredClient:", error);
      return false; // Treat as not expired if parsing fails
    }
  };
  
  const isExpiringSoonClient = (expirationDate: string | undefined, comparisonDate: Date, daysThreshold = 90): boolean => {
    if (!expirationDate) return false;
    try {
      const expDate = parseISO(expirationDate);
      if (isNaN(expDate.getTime())) return false;
      
      const diffTime = expDate.getTime() - comparisonDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= daysThreshold;
    } catch (error) {
      // console.error("Error parsing expirationDate in isExpiringSoonClient:", error);
      return false; // Treat as not expiring soon if parsing fails
    }
  };


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary">{medicine.name}</CardTitle>
            <CardDescription>{medicine.description || 'Sin descripción.'}</CardDescription>
          </div>
          <Badge
            variant={medicine.currentStock <= stockLevelAlertThreshold ? "destructive" : "secondary"}
            className="ml-2 whitespace-nowrap"
          >
            ID: {medicine.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-foreground">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-medium">Stock Actual:</span>
          </div>
          <span className={`text-2xl font-bold ${medicine.currentStock <= stockLevelAlertThreshold ? 'text-destructive' : 'text-primary'}`}>
            {medicine.currentStock}
          </span>
        </div>
         {medicine.currentStock <= stockLevelAlertThreshold && (
          <div className="flex items-center text-sm text-destructive p-2 rounded-md border border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
            ¡Alerta de stock bajo!
          </div>
        )}

        <div>
          <h4 className="font-medium text-foreground mb-2">Historial de Transacciones:</h4>
          {displayHistory.length > 0 ? (
            <div className="rounded-md border">
              <div className="bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b"> {/* Shadcn TableRow equivalent */}
                      <th className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID Rx/Lote</th>
                      <th className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Entrada</th>
                      <th className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Salida</th>
                      <th className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Saldo</th>
                      <th className="w-[90px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Exp.</th>
                      <th className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                    </tr>
                  </thead>
                </table>
              </div>

              <ScrollArea className="h-[152px] w-full">
                <table className="w-full text-sm">
                  <tbody> {/* Use tbody for semantic body */}
                    {displayHistory.map((record) => (
                      <tr
                        key={record.id}
                        className={cn(
                          clientNow && record.expirationDate && isExpiredClient(record.expirationDate, clientNow)
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : '',
                          'border-b'
                        )}
                      >
                        <td className="w-[80px] p-4 align-middle">{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</td>
                        <td className="p-4 align-middle">{record.rxNumber}</td>
                        <td className="text-center w-[70px] p-4 align-middle text-green-600 font-medium">
                          {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </td>
                        <td className="text-center w-[70px] p-4 align-middle text-red-600 font-medium">
                          {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </td>
                        <td className="text-center font-semibold w-[70px] p-4 align-middle">{record.balance}</td>
                        <td className="w-[90px] p-4 align-middle">
                          {record.expirationDate && clientNow ? (
                            <div className={cn("flex items-center gap-1 text-xs",
                                  isExpiredClient(record.expirationDate, clientNow) ? "text-red-500" :
                                  isExpiringSoonClient(record.expirationDate, clientNow) ? "text-orange-500" : "text-muted-foreground"
                              )}>
                              {isExpiredClient(record.expirationDate, clientNow) && <ShieldAlert className="h-3.5 w-3.5 shrink-0" title="Expirado"/>}
                              {isExpiringSoonClient(record.expirationDate, clientNow) && !isExpiredClient(record.expirationDate, clientNow) && <AlertTriangle className="h-3.5 w-3.5 shrink-0" title="Expira pronto"/>}
                              {!isExpiredClient(record.expirationDate, clientNow) && !isExpiringSoonClient(record.expirationDate, clientNow) && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600" title="Vigente"/>}
                              {format(parseISO(record.expirationDate), 'MM/yy', { locale: es })}
                            </div>
                          ) : (
                             <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="w-[80px] p-4 align-middle">
                          <div className="flex items-center gap-1 text-xs">
                            <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                            {record.userName || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin historial de transacciones.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3">
        <CalendarDays className="h-4 w-4 mr-1.5" />
        Última Actualización General: {clientNow && medicine.lastUpdated ? format(parseISO(medicine.lastUpdated), 'PPP', { locale: es }) : 'Cargando...'}
      </CardFooter>
    </Card>
  );
}
