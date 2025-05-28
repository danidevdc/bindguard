
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, CalendarDays, UserCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale'; // For Spanish date formatting
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface InventoryCardProps {
  medicine: Medicine;
}

interface ProcessedRecord extends DispensingRecord {
  balance: number;
}

export default function InventoryCard({ medicine }: InventoryCardProps) {
  const stockLevelAlertThreshold = 10; // Example threshold
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
  }, []);

  // Sort history chronologically (oldest first) to calculate running balance correctly
  const sortedHistory = [...medicine.dispensingHistory].sort((a, b) => 
    compareAsc(parseISO(a.date), parseISO(b.date))
  );

  let runningBalance = 0;
  // processedHistory will now be in ascending chronological order (oldest first, newest last)
  const processedHistory: ProcessedRecord[] = sortedHistory.map(record => {
    if (record.type === 'stocked') {
      runningBalance += record.quantity;
    } else if (record.type === 'dispensed') {
      runningBalance -= record.quantity;
    }
    return { ...record, balance: runningBalance };
  });


  const isExpiredClient = (expirationDate: string | undefined, comparisonDate: Date): boolean => {
    if (!expirationDate) return false;
    try {
      const parsedExpDate = parseISO(expirationDate);
      if (isNaN(parsedExpDate.getTime())) return false; // Invalid date string
      return compareAsc(parsedExpDate, comparisonDate) < 0;
    } catch (error) {
      return false; // Error during parsing
    }
  };
  
  const isExpiringSoonClient = (expirationDate: string | undefined, comparisonDate: Date, daysThreshold = 90): boolean => {
    if (!expirationDate) return false;
    try {
      const expDate = parseISO(expirationDate);
      if (isNaN(expDate.getTime())) return false; // Invalid date string
      
      const diffTime = expDate.getTime() - comparisonDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= daysThreshold;
    } catch (error) {
      return false; // Error during parsing or calculation
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
          {processedHistory.length > 0 ? (
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <Table className="text-sm">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-[80px]">Fecha</TableHead>
                    <TableHead>ID Rx/Lote</TableHead>
                    <TableHead className="text-center w-[60px]">Entrada</TableHead>
                    <TableHead className="text-center w-[60px]">Salida</TableHead>
                    <TableHead className="text-center w-[60px]">Saldo</TableHead>
                    <TableHead className="w-[90px]">Fecha Exp.</TableHead>
                    <TableHead className="w-[80px]">Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedHistory.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className={cn(
                        clientNow && record.expirationDate && record.type === 'stocked' && isExpiredClient(record.expirationDate, clientNow) 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : ''
                      )}
                    >
                      <TableCell>{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</TableCell>
                      <TableCell>{record.rxNumber}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-1"/>{record.quantity}</> : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{record.balance}</TableCell>
                      <TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                           <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0"/> 
                           {record.userName || 'N/A'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
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
