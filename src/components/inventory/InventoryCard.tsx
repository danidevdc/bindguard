
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  const sortedHistory = [...medicine.dispensingHistory].sort((a, b) => 
    compareAsc(parseISO(a.date), parseISO(b.date))
  );

  let runningBalance = 0;
  const processedHistory: ProcessedRecord[] = sortedHistory.map(record => {
    if (record.type === 'stocked') {
      runningBalance += record.quantity;
    } else if (record.type === 'dispensed') {
      runningBalance -= record.quantity;
    }
    return { ...record, balance: runningBalance };
  });

  // Reverse history for display (newest on top), but calculations were done chronologically
  // const displayHistory = [...processedHistory].reverse(); 
  // Keeping chronological order as per user's last request (oldest first, newest last)
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
            <div className="rounded-md border"> {/* Container for the entire table structure */}
              {/* Fixed Header Part */}
              <div className="bg-card"> {/* Background for header */}
                {/* Using raw table element to avoid shadcn/Table's own overflow wrapper */}
                <table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID Rx/Lote</TableHead>
                      <TableHead className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Entrada</TableHead>
                      <TableHead className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Salida</TableHead>
                      <TableHead className="text-center w-[70px] h-12 px-4 align-middle font-medium text-muted-foreground">Saldo</TableHead>
                      <TableHead className="w-[90px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Exp.</TableHead>
                      <TableHead className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                </table>
              </div>

              {/* Scrollable Body Part */}
              {/* Adjusted height: 200px total - approx 48px for header (h-12) = 152px */}
              <ScrollArea className="h-[152px] w-full">
                 {/* Using raw table element here too */}
                <table className="w-full text-sm">
                  <TableBody>
                    {displayHistory.map((record) => (
                      <TableRow 
                        key={record.id} 
                        className={cn(
                          clientNow && record.expirationDate && record.type === 'stocked' && isExpiredClient(record.expirationDate, clientNow) 
                          ? 'bg-red-100 dark:bg-red-900/30' 
                          : '',
                          'border-b' // Ensure rows have bottom borders
                        )}
                      >
                        <TableCell className="w-[80px] p-4 align-middle">{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</TableCell>
                        <TableCell className="p-4 align-middle">{record.rxNumber}</TableCell>
                        <TableCell className="text-center w-[70px] p-4 align-middle text-green-600 font-medium">
                          {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </TableCell>
                        <TableCell className="text-center w-[70px] p-4 align-middle text-red-600 font-medium">
                          {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                        </TableCell>
                        <TableCell className="text-center font-semibold w-[70px] p-4 align-middle">{record.balance}</TableCell>
                        <TableCell className="w-[90px] p-4 align-middle">
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
                            record.type === 'stocked' ? <span className="text-xs text-muted-foreground">N/A</span> : ''
                          )}
                        </TableCell>
                        <TableCell className="w-[80px] p-4 align-middle">
                          <div className="flex items-center gap-1 text-xs">
                            <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0"/> 
                            {record.userName || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
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
        Última Actualización General: {format(parseISO(medicine.lastUpdated), 'PPP', { locale: es })}
      </CardFooter>
    </Card>
  );
}

