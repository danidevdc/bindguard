
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

  const displayHistory = processedHistory;

  const isExpiredClient = (expirationDate: string | undefined, comparisonDate: Date): boolean => {
    if (!expirationDate) return false;
    try {
      const parsedExpDate = parseISO(expirationDate);
      if (isNaN(parsedExpDate.getTime())) return false;
      return compareAsc(parsedExpDate, comparisonDate) < 0;
    } catch (error) {
      return false;
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
      return false;
    }
  };


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg md:text-xl text-primary">{medicine.name}</CardTitle>
            <CardDescription className="text-xs md:text-sm">{medicine.description || 'Sin descripción.'}</CardDescription>
          </div>
          <Badge
            variant={medicine.currentStock <= stockLevelAlertThreshold ? "destructive" : "secondary"}
            className="ml-2 whitespace-nowrap text-xs px-2 py-0.5"
          >
            ID: {medicine.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 md:space-y-4 px-4 py-3 md:p-6">
        <div className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-foreground">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="font-medium text-sm md:text-base">Stock Actual:</span>
          </div>
          <span className={`text-xl md:text-2xl font-bold ${medicine.currentStock <= stockLevelAlertThreshold ? 'text-destructive' : 'text-primary'}`}>
            {medicine.currentStock}
          </span>
        </div>
         {medicine.currentStock <= stockLevelAlertThreshold && (
          <div className="flex items-center text-xs md:text-sm text-destructive p-1.5 md:p-2 rounded-md border border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 shrink-0" />
            ¡Alerta de stock bajo!
          </div>
        )}

        <div>
          <h4 className="font-medium text-sm md:text-base text-foreground mb-1.5 md:mb-2">Historial de Transacciones:</h4>
          {displayHistory.length > 0 ? (
            <div className="rounded-md border">
              {/* Table for Headers - Fixed */}
              <div className="bg-card">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="w-[70px] md:w-[80px] h-10 px-2 text-left align-middle font-medium text-muted-foreground md:h-12 md:px-3">Fecha</th>
                      <th className="min-w-[90px] md:min-w-[100px] h-10 px-2 text-left align-middle font-medium text-muted-foreground md:h-12 md:px-3">ID Rx/Lote</th>
                      <th className="w-[60px] md:w-[70px] text-center h-10 px-1 md:px-2 align-middle font-medium text-muted-foreground md:h-12">Entrada</th>
                      <th className="w-[60px] md:w-[70px] text-center h-10 px-1 md:px-2 align-middle font-medium text-muted-foreground md:h-12">Salida</th>
                      <th className="w-[60px] md:w-[70px] text-center h-10 px-1 md:px-2 align-middle font-medium text-muted-foreground md:h-12">Saldo</th>
                      <th className="w-[80px] md:w-[90px] h-10 px-2 text-left align-middle font-medium text-muted-foreground md:h-12 md:px-3">Fecha Exp.</th>
                      <th className="w-[70px] md:w-[80px] h-10 px-2 text-left align-middle font-medium text-muted-foreground md:h-12 md:px-3">Usuario</th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Scrollable Table Body */}
              <ScrollArea className="h-[120px] md:h-[152px] w-full">
                <table className="w-full text-xs md:text-sm">
                  <tbody>
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
                        <td className="w-[70px] md:w-[80px] p-2 md:px-3 align-middle">{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</td>
                        <td className="min-w-[90px] md:min-w-[100px] p-2 md:px-3 align-middle">{record.rxNumber}</td>
                        <td className="text-center w-[60px] md:w-[70px] p-1 md:p-2 align-middle text-green-600 font-medium">
                          {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </td>
                        <td className="text-center w-[60px] md:w-[70px] p-1 md:p-2 align-middle text-red-600 font-medium">
                          {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </td>
                        <td className="text-center font-semibold w-[60px] md:w-[70px] p-1 md:p-2 align-middle">{record.balance}</td>
                        <td className="w-[80px] md:w-[90px] p-2 md:px-3 align-middle">
                          {record.expirationDate && clientNow ? (
                            <div className={cn("flex items-center gap-1 text-[0.7rem] md:text-xs", // slightly smaller text for expiration
                                  isExpiredClient(record.expirationDate, clientNow) ? "text-red-500" :
                                  isExpiringSoonClient(record.expirationDate, clientNow) ? "text-orange-500" : "text-muted-foreground"
                              )}>
                              {isExpiredClient(record.expirationDate, clientNow) && <ShieldAlert className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" title="Expirado"/>}
                              {isExpiringSoonClient(record.expirationDate, clientNow) && !isExpiredClient(record.expirationDate, clientNow) && <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" title="Expira pronto"/>}
                              {!isExpiredClient(record.expirationDate, clientNow) && !isExpiringSoonClient(record.expirationDate, clientNow) && <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 text-green-600" title="Vigente"/>}
                              {format(parseISO(record.expirationDate), 'MM/yy', { locale: es })}
                            </div>
                          ) : (
                             <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="w-[70px] md:w-[80px] p-2 md:px-3 align-middle">
                          <div className="flex items-center gap-1 text-[0.7rem] md:text-xs"> {/* slightly smaller text for user */}
                            <UserCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground shrink-0"/>
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
            <p className="text-xs md:text-sm text-muted-foreground text-center py-4">Sin historial de transacciones.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-2 md:pt-3 pb-2 md:pb-3 px-4 md:px-6">
        <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
        Última Actualización General: {clientNow && medicine.lastUpdated ? format(parseISO(medicine.lastUpdated), 'PPP', { locale: es }) : 'Cargando...'}
      </CardFooter>
    </Card>
  );
}
