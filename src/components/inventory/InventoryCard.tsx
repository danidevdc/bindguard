
"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, CalendarDays, UserCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck, Download, QrCode } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [qrDialogMedicine, setQrDialogMedicine] = useState<Medicine | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);


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
    if (!comparisonDate || isNaN(comparisonDate.getTime())) return false;
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
    if (!comparisonDate || isNaN(comparisonDate.getTime())) return false;
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
      ["Presentación:", medicine.presentation],
      ["ID:", medicine.id],
      ["Stock Actual:", medicine.currentStock],
      [],
      ["Historial de Transacciones"],
    ];

    const historyHeaders = ["Fecha", "Pedidos", "Entrada", "Salida", "Saldo", "Fecha Exp.", "Usuario"];
    dataForExcel.push(historyHeaders);

    processedHistoryWithBalance.forEach(record => {
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
      { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 15 }
    ];

    const headerCellStyle = { font: { bold: true } };
    if(worksheet['A1']) worksheet['A1'].s = headerCellStyle;
    if(worksheet['A2']) worksheet['A2'].s = headerCellStyle;
    if(worksheet['A3']) worksheet['A3'].s = headerCellStyle;
    if(worksheet['A4']) worksheet['A4'].s = headerCellStyle;
    if(worksheet['A6']) worksheet['A6'].s = headerCellStyle;


    const historyHeaderRowIndex = 6; 
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((colLetter) => {
      const cellAddress = `${colLetter}${historyHeaderRowIndex}`;
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

  const qrCodeValue = JSON.stringify({
    id: medicine.id,
    nombre: medicine.name,
    presentacion: medicine.presentation,
  });
  
  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${medicine.id}_${medicine.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "QR Descargado",
          description: "El código QR ha sido guardado como imagen PNG.",
        });
      }
    }
  };


  return (
    <>
      <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-grow">
              <CardTitle className="text-lg md:text-xl text-primary">{medicine.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-0.5">
                {medicine.presentation}
              </CardDescription>
              <Badge
                variant={"secondary"}
                className="whitespace-nowrap text-xs px-2 py-0.5 mt-1.5 inline-block"
              >
                ID: {medicine.id}
              </Badge>
            </div>
            <div className="flex-shrink-0">
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  onClick={() => setQrDialogMedicine(medicine)}
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 py-1 h-auto hover:bg-primary/10 hover:text-primary"
                  title="Generar Código QR"
                >
                  <QrCode className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  QR
                </Button>
                <Button
                  onClick={handleDownloadExcel}
                  size="sm"
                  variant="default"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs px-3 py-1 h-auto"
                  title="Descargar Ficha Excel"
                >
                  <Download className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Descargar Ficha
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 md:space-y-4 px-2 py-3 sm:px-4 sm:py-3 md:p-6">
          <div className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-md shadow-md">
            <div className="flex items-center space-x-2 text-foreground">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              <span className="font-medium text-sm md:text-base">Stock Actual:</span>
            </div>
            <span className={`text-xl md:text-2xl font-bold ${medicine.currentStock <= stockLevelAlertThreshold ? 'text-destructive' : 'text-primary'}`}>
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
            <h4 className="font-medium text-sm md:text-base text-foreground mb-2">Historial de Transacciones:</h4>
            <div className="overflow-auto rounded-md border max-h-60 bg-card p-px">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="h-10 bg-muted shadow-md">
                    <th className="min-w-[70px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">Fecha</th>
                    <th className="min-w-[70px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">
                      Pedidos
                    </th>
                    <th className="min-w-[60px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">Entrada</th>
                    <th className="min-w-[60px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">Salida</th>
                    <th className="min-w-[60px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">Saldo</th>
                    <th className="min-w-[85px] px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap border-r border-border">
                      Fecha Exp.
                    </th>
                    <th className="px-0 py-2 text-center align-middle font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">Usuario</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-b-0">
                  {displayHistory.map((record) => (
                    <tr
                      key={record.id}
                      className={cn(
                        "border-b border-border",
                        clientNow && record.expirationDate && isExpiredClient(record.expirationDate, clientNow)
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : ''
                      )}
                    >
                      <td className="min-w-[70px] px-0 py-2 align-middle whitespace-nowrap text-xs text-center border-r border-border">{format(parseISO(record.date), 'dd/MM/yy', { locale: es })}</td>
                      <td className="min-w-[70px] px-0 py-2 align-middle whitespace-nowrap text-xs text-center border-r border-border">{record.rxNumber}</td>
                      <td className="min-w-[60px] text-center px-0 py-2 align-middle text-green-600 font-medium whitespace-nowrap text-xs border-r border-border">
                        {record.type === 'stocked' ? <><TrendingUp className="h-3.5 w-3.5 inline mr-0.5"/>{record.quantity}</> : '-'}
                      </td>
                      <td className="min-w-[60px] text-center px-0 py-2 align-middle text-red-600 font-medium whitespace-nowrap text-xs border-r border-border">
                        {record.type === 'dispensed' ? <><TrendingDown className="h-3.5 w-3.5 inline mr-0.5"/>{record.quantity}</> : '-'}
                      </td>
                      <td className="min-w-[60px] text-center font-semibold px-0 py-2 align-middle whitespace-nowrap text-xs border-r border-border">{record.balance}</td>
                      <td className="min-w-[85px] px-0 py-2 align-middle whitespace-nowrap border-r border-border text-center justify-center">
                        <div className={cn("flex items-center justify-center gap-1 text-xs whitespace-nowrap",
                                clientNow && record.expirationDate && isExpiredClient(record.expirationDate, clientNow) ? "text-red-500" :
                                clientNow && record.expirationDate && isExpiringSoonClient(record.expirationDate, clientNow) ? "text-orange-500" : "text-muted-foreground"
                            )}>
                            {clientNow && record.expirationDate && isExpiredClient(record.expirationDate, clientNow) && <ShieldAlert className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0" title="Expirado"/>}
                            {clientNow && record.expirationDate && isExpiringSoonClient(record.expirationDate, clientNow) && !isExpiredClient(record.expirationDate, clientNow) && <AlertTriangle className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0" title="Expira pronto"/>}
                            {clientNow && record.expirationDate && !isExpiredClient(record.expirationDate, clientNow) && !isExpiringSoonClient(record.expirationDate, clientNow) && <ShieldCheck className="h-3 md:h-3.5 w-3 md:w-3.5 shrink-0 text-green-600" title="Vigente"/>}
                            {record.expirationDate ? format(parseISO(record.expirationDate), 'MM/yy', { locale: es }) : <span className="text-xs text-muted-foreground">N/A</span>}
                          </div>
                      </td>
                      <td className="min-w-[100px] py-2 px-0 align-middle whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <UserCircle className="h-3 md:h-3.5 w-3 md:w-3.5 text-muted-foreground shrink-0"/>
                          {record.userName || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {displayHistory.length === 0 && (
              <p className="text-xs md:text-sm text-muted-foreground text-center py-4">Sin historial de transacciones.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-2 md:pt-3 pb-2 md:pb-3 px-2 sm:px-4 md:px-6">
          <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
          Última Actualización: {clientNow && medicine.lastUpdated ? format(parseISO(medicine.lastUpdated), 'dd/MM/yy HH:mm', { locale: es }) : 'Cargando...'}
        </CardFooter>
      </Card>

      {qrDialogMedicine && (
        <AlertDialog open={!!qrDialogMedicine} onOpenChange={(isOpen) => { if (!isOpen) setQrDialogMedicine(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5 text-primary" />
                Código QR para: {qrDialogMedicine.id} - {qrDialogMedicine.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este código QR contiene la identificación básica del medicamento. Puedes escanearlo o descargarlo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div ref={qrCodeRef} className="flex justify-center items-center py-4 bg-white rounded-md p-4">
              <QRCodeCanvas
                value={JSON.stringify({
                  id: qrDialogMedicine.id,
                  nombre: qrDialogMedicine.name,
                  presentacion: qrDialogMedicine.presentation,
                })}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={true}
              />
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleDownloadQR}>
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
              </Button>
              <AlertDialogCancel onClick={() => setQrDialogMedicine(null)}>Cerrar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
