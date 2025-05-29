
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, CalendarDays, UserCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck, Download } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface InventoryCardProps {
  medicine: Medicine;
}

interface ProcessedRecord extends DispensingRecord {
  balance: number;
}

export default function InventoryCard({ medicine }: InventoryCardProps) {
  const stockLevelAlertThreshold = 10;
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setClientNow(new Date());
  }, []);

  const sortedHistoryForBalance = [...medicine.dispensingHistory].sort((a, b) =>
    compareAsc(parseISO(a.date), parseISO(b.date))
  );

  let runningBalance = 0;
  const processedHistoryWithBalance: ProcessedRecord[] = sortedHistoryForBalance.map(record => {
    if (record.type === 'stocked') {
      runningBalance += record.quantity;
    } else if (record.type === 'dispensed') {
      runningBalance -= record.quantity;
    }
    return { ...record, balance: runningBalance };
  });

  const displayHistory = processedHistoryWithBalance;


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

  const handleDownloadExcel = () => {
    if (!clientNow) {
      toast({ title: "Error", description: "Por favor, espera a que la fecha se cargue.", variant: "destructive"});
      return;
    }

    const dataForExcel = [
      ["Nombre Medicamento:", medicine.name],
      ["ID:", medicine.id],
      ["Descripción:", medicine.description || "Sin descripción."],
      ["Stock Actual:", medicine.currentStock],
      [], 
      ["Historial de Transacciones"], 
    ];

    const historyHeaders = ["Fecha", "ID Rx/Lote", "Entrada", "Salida", "Saldo", "Fecha Exp.", "Usuario"];
    dataForExcel.push(historyHeaders);

    displayHistory.forEach(record => {
      const entrada = record.type === 'stocked' ? record.quantity : '';
      const salida = record.type === 'dispensed' ? record.quantity : '';
      const fechaExp = record.expirationDate ? format(parseISO(record.expirationDate), 'MM/yy', { locale: es }) : 'N/A';
      
      dataForExcel.push([
        format(parseISO(record.date), 'dd/MM/yy', { locale: es }),
        record.rxNumber,
        entrada,
        salida,
        record.balance,
        fechaExp,
        record.userName || 'N/A'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(dataForExcel);
    worksheet['!cols'] = [
      { wch: 25 }, 
      { wch: 15 }, 
      { wch: 8 },  
      { wch: 8 },  
      { wch: 8 },  
      { wch: 10 }, 
      { wch: 12 }  
    ];
    
    const headerCellStyle = { font: { bold: true } };
    if(worksheet['A1']) worksheet['A1'].s = headerCellStyle;
    if(worksheet['A2']) worksheet['A2'].s = headerCellStyle;
    if(worksheet['A3']) worksheet['A3'].s = headerCellStyle;
    if(worksheet['A4']) worksheet['A4'].s = headerCellStyle;
    if(worksheet['A6']) worksheet['A6'].s = headerCellStyle; 

    const historyHeaderRowIndex = 6; 
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((colLetter) => {
      const cellAddress = `${colLetter}${historyHeaderRowIndex + 1}`;
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = headerCellStyle;
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ficha Medicamento");

    const fileName = `${medicine.id}_${medicine.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0,50)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Descarga Iniciada",
      description: `El archivo ${fileName} se está descargando.`,
    });
  };


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-grow">
            <CardTitle className="text-base sm:text-lg md:text-xl text-primary">{medicine.name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{medicine.description || 'Sin descripción.'}</CardDescription>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end">
            <Badge
              variant={"secondary"}
              className="whitespace-nowrap text-xs px-2 py-0.5 mb-1.5" 
            >
              ID: {medicine.id}
            </Badge>
            <Button
              onClick={handleDownloadExcel}
              size="sm"
              variant="default"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs px-3 py-1 h-auto"
            >
              <Download className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Descargar Ficha
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 md:space-y-4 px-2 py-3 sm:px-4 sm:py-3 md:p-6">
        <div className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-foreground">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            <span className="font-medium text-xs sm:text-sm md:text-base">Stock Actual:</span>
          </div>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold ${medicine.currentStock <= stockLevelAlertThreshold ? 'text-destructive' : 'text-primary'}`}>
            {medicine.currentStock}
          </span>
        </div>
         {medicine.currentStock <= stockLevelAlertThreshold && (
          <div className="flex items-center text-xs md:text-sm text-destructive p-1.5 md:p-2 rounded-md border border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 shrink-0" />
            ¡Alerta de stock bajo!
          </div>
        )}

        <div>
          <h4 className="font-medium text-xs sm:text-sm md:text-base text-foreground mb-1 sm:mb-1.5 md:mb-2">Historial de Transacciones:</h4>
          {displayHistory.length > 0 ? (
            <div className="rounded-md border overflow-auto h-[calc(120px+2.5rem+2px)] md:h-[calc(148px+2.5rem+2px)]">
              <table className="text-xs md:text-sm table-fixed min-w-max w-full">
                <thead className="bg-card sticky top-0 z-10">
                  <tr className="border-b"> 
                    <th className="min-w-[85px] h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Fecha</th>
                    <th className="min-w-[90px] h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">ID Rx/Lote</th>
                    <th className="min-w-[70px] text-center h-10 px-1 align-middle font-medium text-muted-foreground whitespace-nowrap">Entrada</th>
                    <th className="min-w-[70px] text-center h-10 px-1 align-middle font-medium text-muted-foreground whitespace-nowrap">Salida</th>
                    <th className="min-w-[70px] text-center h-10 px-1 align-middle font-medium text-muted-foreground whitespace-nowrap">Saldo</th>
                    <th className="min-w-[95px] h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Fecha Exp.</th>
                    <th className="min-w-[100px] h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Usuario</th>
                  </tr>
                </thead>
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
                      <td className="min-w-[85px] p-2 align-middle whitespace-nowrap">{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</td>
                      <td className="min-w-[90px] p-2 align-middle break-words">{record.rxNumber}</td>
                      <td className="text-center min-w-[70px] p-1 align-middle text-green-600 font-medium whitespace-nowrap">
                        {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-0.5"/>{record.quantity}</> : '-'}
                      </td>
                      <td className="text-center min-w-[70px] p-1 align-middle text-red-600 font-medium whitespace-nowrap">
                        {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-0.5"/>{record.quantity}</> : '-'}
                      </td>
                      <td className="text-center font-semibold min-w-[70px] p-1 align-middle whitespace-nowrap">{record.balance}</td>
                      <td className="min-w-[95px] p-2 align-middle whitespace-nowrap">
                        {record.expirationDate && clientNow ? (
                          <div className={cn("flex items-center gap-1 text-[0.7rem] sm:text-xs whitespace-nowrap", 
                                isExpiredClient(record.expirationDate, clientNow) ? "text-red-500" :
                                isExpiringSoonClient(record.expirationDate, clientNow) ? "text-orange-500" : "text-muted-foreground"
                            )}>
                            {isExpiredClient(record.expirationDate, clientNow) && <ShieldAlert className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0" title="Expirado"/>}
                            {isExpiringSoonClient(record.expirationDate, clientNow) && !isExpiredClient(record.expirationDate, clientNow) && <AlertTriangle className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0" title="Expira pronto"/>}
                            {!isExpiredClient(record.expirationDate, clientNow) && !isExpiringSoonClient(record.expirationDate, clientNow) && <ShieldCheck className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0 text-green-600" title="Vigente"/>}
                            {format(parseISO(record.expirationDate), 'MM/yy', { locale: es })}
                          </div>
                        ) : (
                           <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="min-w-[100px] p-2 align-middle break-words"> 
                        <div className="flex items-center gap-1 text-[0.7rem] sm:text-xs whitespace-nowrap"> 
                          <UserCircle className="h-3 md:h-3.5 w-3 md:w-3.5 text-muted-foreground shrink-0"/>
                          {record.userName || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-4">Sin historial de transacciones.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-2 md:pt-3 pb-2 md:pb-3 px-2 sm:px-4 md:px-6">
        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
        Última Actualización: {clientNow && medicine.lastUpdated ? format(parseISO(medicine.lastUpdated), 'dd/MM/yy HH:mm', { locale: es }) : 'Cargando...'}
      </CardFooter>
    </Card>
  );
}

    