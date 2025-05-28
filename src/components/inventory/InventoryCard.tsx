
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, CalendarDays, UserCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale'; // For Spanish date formatting

interface InventoryCardProps {
  medicine: Medicine;
}

interface ProcessedRecord extends DispensingRecord {
  balance: number;
}

export default function InventoryCard({ medicine }: InventoryCardProps) {
  const stockLevelAlertThreshold = 10; // Example threshold

  // Sort history chronologically (oldest first) to calculate running balance correctly
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
  }).sort((a,b) => compareAsc(parseISO(b.date), parseISO(a.date))); // Then sort descending for display (most recent first)


  const isExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return compareAsc(parseISO(expirationDate), new Date()) < 0;
  };
  
  const isExpiringSoon = (expirationDate?: string, daysThreshold = 90) => {
    if(!expirationDate) return false;
    const expDate = parseISO(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= daysThreshold;
  }


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
            <ScrollArea className="h-[200px] w-full rounded-md border p-1">
              <Table className="text-sm">
                <TableHeader>
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
                    <TableRow key={record.id} className={cn(isExpired(record.expirationDate) && record.type === 'stocked' ? 'bg-red-100 dark:bg-red-900/30' : '')}>
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
                        {record.expirationDate ? (
                           <div className={cn("flex items-center gap-1 text-xs", 
                                isExpired(record.expirationDate) ? "text-red-500" : 
                                isExpiringSoon(record.expirationDate) ? "text-orange-500" : "text-muted-foreground"
                            )}>
                             {isExpired(record.expirationDate) && <ShieldAlert className="h-3.5 w-3.5 shrink-0" title="Expirado"/>}
                             {isExpiringSoon(record.expirationDate) && !isExpired(record.expirationDate) && <AlertTriangle className="h-3.5 w-3.5 shrink-0" title="Expira pronto"/>}
                             {!isExpired(record.expirationDate) && !isExpiringSoon(record.expirationDate) && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600" title="Vigente"/>}
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
