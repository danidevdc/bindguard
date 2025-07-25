
"use client";

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, PackagePlus, CalendarIcon, AlertTriangle, CheckCircle, Package, Search, Loader2, XCircle, ScanLine } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { type Medicine, getMedicineByIdFromFirestore, updateMedicineStockInFirestore } from '@/lib/medicineService';
import QrScanner from 'qr-scanner';
import { Timestamp } from 'firebase/firestore';

type StockEntryStep = "searchMedicine" | "enterLotDetails";

export default function StockEntryForm() {
  const [step, setStep] = useState<StockEntryStep>("searchMedicine");
  const [searchId, setSearchId] = useState('');
  const [foundMedicine, setFoundMedicine] = useState<Medicine | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(undefined);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { getCurrentUserUsername } = useAuth();

  const [isScanningQR, setIsScanningQR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showSearchVerificationDialog, setShowSearchVerificationDialog] = useState(false);
  const [scannedSearchId, setScannedSearchId] = useState('');


  useEffect(() => {
    const today = new Date();
    setClientNow(today);
    if (step === "enterLotDetails" && !transactionDate) {
        setTransactionDate(today); // Default transaction date
    }
     if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) { console.warn("Web Audio API not supported."); }
    }
  }, [step, transactionDate]);

  const playBeep = () => {
    if (!audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const handleQrScanSuccessForSearch = (result: QrScanner.ScanResult | string) => {
    const scannedData = typeof result === 'string' ? result : result.data;
    setIsScanningQR(false);
    let codeFromQR = '';
    try {
        const parsedData = JSON.parse(scannedData);
        if (parsedData && typeof parsedData.id === 'string') codeFromQR = parsedData.id;
        else codeFromQR = scannedData;
    } catch (e) { codeFromQR = scannedData; }

    if (codeFromQR) {
        playBeep();
        setScannedSearchId(codeFromQR);
        setSearchId(codeFromQR); // Update the input field as well
        setShowSearchVerificationDialog(true);
        toast({ title: "QR Detectado para Búsqueda", description: `Código: ${codeFromQR}. Verifica y busca.` });
    } else {
        toast({ title: "QR Inválido", description: "No se pudo extraer un código del QR.", variant: "destructive" });
    }
  };
  
  const handleQrScanError = (error: Error | string) => {
    console.error('QR Scan Error (Stock Entry):', error);
    if (typeof error === 'object' && error !== null && 'message' in error && (error as Error).message === 'No QR code found') return;
    if (typeof error === 'string' && error === 'No QR code found') return;
  };

  useEffect(() => {
    if (isScanningQR) {
      const startScanner = async () => {
        if (!videoRef.current) return;
        if (qrScannerRef.current) { qrScannerRef.current.stop(); qrScannerRef.current.destroy(); qrScannerRef.current = null; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          qrScannerRef.current = new QrScanner(videoRef.current, handleQrScanSuccessForSearch, { onDecodeError: handleQrScanError, preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true });
          await qrScannerRef.current.start();
        } catch (error) {
          console.error('Error accessing/starting camera (Stock Entry):', error);
          setHasCameraPermission(false);
          toast({ variant: 'destructive', title: 'Acceso a Cámara Denegado', description: 'Habilita los permisos de cámara para escanear.' });
          setIsScanningQR(false);
        }
      };
      startScanner();
    } else {
      if (qrScannerRef.current) { qrScannerRef.current.stop(); qrScannerRef.current.destroy(); qrScannerRef.current = null; }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; }
       if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanningQR]);


  const handleSearchMedicine = async (idToSearch?: string) => {
    const currentSearchId = idToSearch || searchId.trim();
    if (!currentSearchId) {
      toast({ title: 'ID Requerido', description: 'Por favor, ingresa un ID para buscar.', variant: 'destructive' });
      return;
    }
    setIsLoadingSearch(true);
    setFoundMedicine(null);
    try {
      const medicine = await getMedicineByIdFromFirestore(currentSearchId.toUpperCase());
      if (medicine) {
        if (medicine.isBlocked) {
            toast({ title: 'Medicamento Cerrado', description: `El medicamento "${medicine.name}" (ID: ${medicine.id}) está cerrado y no se puede ingresar stock.`, variant: 'destructive' });
            setFoundMedicine(null); // Don't proceed
        } else {
            setFoundMedicine(medicine);
            setStep("enterLotDetails");
            setTransactionDate(clientNow || new Date()); // Reset transaction date for new entry
            setExpirationDate(undefined);
            setQuantity('');
            toast({ title: 'Medicamento Encontrado', description: `Ingresando stock para: ${medicine.name}` });
        }
      } else {
        toast({ title: 'No Encontrado', description: `No se encontró medicamento con ID: ${currentSearchId.toUpperCase()}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error searching medicine:", error);
      toast({ title: 'Error en Búsqueda', description: 'No se pudo buscar el medicamento.', variant: 'destructive' });
    } finally {
      setIsLoadingSearch(false);
      setShowSearchVerificationDialog(false); // Close dialog if it was open
      setScannedSearchId('');
    }
  };

  const handleSubmitStockEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!foundMedicine || !quantity.trim() || !transactionDate || !expirationDate) {
      toast({ title: "Datos Incompletos", description: "Todos los campos (cantidad, fecha de transacción, fecha de expiración) son requeridos.", variant: "destructive" });
      return;
    }
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número positivo.", variant: "destructive" });
      return;
    }
    if (clientNow && expirationDate <= clientNow) {
      toast({ title: "Fecha de Expiración Inválida", description: "La fecha de expiración debe ser futura.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const currentUsername = getCurrentUserUsername() || 'System';
    try {
      await updateMedicineStockInFirestore(
        foundMedicine.id,
        quantityNum,
        'stocked',
        `LOTE-${Date.now().toString().slice(-6)}`, // Auto-generate a lot/rxNumber
        currentUsername,
        Timestamp.fromDate(transactionDate),
        Timestamp.fromDate(expirationDate)
      );
      toast({
        title: "Stock Añadido Exitosamente",
        description: `${foundMedicine.name}, Cant: ${quantityNum}, Exp: ${format(expirationDate, "dd/MM/yy", { locale: es })}.`,
      });
      resetFormAndSearch();
    } catch (error: any) {
      toast({ title: 'Error al Guardar Stock', description: error.message || 'No se pudo registrar la entrada de stock.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetFormAndSearch = () => {
    setStep("searchMedicine");
    setSearchId('');
    setFoundMedicine(null);
    setQuantity('');
    setTransactionDate(undefined);
    setExpirationDate(undefined);
    setIsLoadingSearch(false);
    setIsSaving(false);
    setIsScanningQR(false);
    setScannedSearchId('');
    setShowSearchVerificationDialog(false);
  };

  const handleScanButtonClick = () => {
    setIsScanningQR(prev => !prev);
    if (!isScanningQR) {
      // Clear previous scan results if opening camera
      setScannedSearchId('');
      setSearchId(''); // Optionally clear search input too
      setHasCameraPermission(null);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center">
          <PackagePlus className="mr-2 h-7 w-7 text-primary" />
          Añadir Stock al Inventario
        </CardTitle>
        <CardDescription className="text-center">
          {step === "searchMedicine" 
            ? "Busca el medicamento por su ID para añadir un nuevo lote."
            : `Ingresando lote para: ${foundMedicine?.name} (ID: ${foundMedicine?.id})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "searchMedicine" && (
          <form onSubmit={(e) => { e.preventDefault(); handleSearchMedicine(); }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="searchIdStock">ID del Medicamento</Label>
              <div className="flex gap-2">
                <Input
                  id="searchIdStock"
                  type="text"
                  placeholder="Ej: A0202 (será convertido a mayúsculas)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  required
                  className="bg-background flex-grow"
                  disabled={isScanningQR}
                />
                <Button type="button" variant="outline" onClick={handleScanButtonClick} className="px-3" title={isScanningQR ? "Cerrar Cámara" : "Escanear QR para ID"}>
                    <Camera className="h-5 w-5" />
                </Button>
              </div>
              {isScanningQR && (
                <div className="mt-2 p-2 border rounded-md bg-muted/30">
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                      <AlertDescription>Habilita los permisos de cámara.</AlertDescription>
                    </Alert>
                  )}
                  {hasCameraPermission === true && <p className="text-sm text-muted-foreground mt-2 text-center">Apuntando cámara a un código QR...</p>}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-600/90 text-white" disabled={isLoadingSearch || !searchId.trim()}>
              {isLoadingSearch ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
              Buscar Medicamento
            </Button>
          </form>
        )}

        {step === "enterLotDetails" && foundMedicine && (
          <form onSubmit={handleSubmitStockEntry} className="space-y-6">
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-md">
                <p className="text-sm font-medium text-accent">Medicamento: {foundMedicine.name}</p>
                <p className="text-xs text-accent/80">Presentación: {foundMedicine.presentation}</p>
                <p className="text-xs text-accent/80">ID: {foundMedicine.id}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionDateStock">Fecha de Transacción</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="transactionDateStock" variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} initialFocus locale={es} disabled={(date) => clientNow ? date > clientNow : false} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityStock">Cantidad Recibida</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="quantityStock" type="number" inputMode="numeric" placeholder="Ingresa cantidad" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)} required min="1" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDateStock">Fecha de Expiración del Lote</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="expirationDateStock" variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !expirationDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expirationDate} onSelect={setExpirationDate} initialFocus locale={es}
                    disabled={(date) => clientNow ? date <= clientNow : false} />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              Registrar Entrada de Stock
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={resetFormAndSearch} disabled={isSaving}>
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar / Buscar Otro
            </Button>
          </form>
        )}
      </CardContent>

        {/* Dialog for QR Scan Verification during Search Step */}
        <Dialog open={showSearchVerificationDialog} onOpenChange={(isOpen) => {
            setShowSearchVerificationDialog(isOpen);
            if (!isOpen) setScannedSearchId(''); // Clear if dialog is closed without action
        }}>
            <DialogContent className="sm:max-w-md border-blue-500 shadow-lg rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-blue-600 text-xl">
                        <ScanLine className="mr-2 h-6 w-6" />
                        Verificar ID Escaneado
                    </DialogTitle>
                    <DialogDescription className="pt-1">
                        Se ha detectado el siguiente ID de medicamento. ¿Deseas buscarlo?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <Label htmlFor="scannedIdDisplay" className="text-sm font-medium text-muted-foreground">ID Escaneado:</Label>
                    <div id="scannedIdDisplay" className="mt-1 text-2xl font-bold text-blue-600 bg-blue-600/10 p-4 rounded-md text-center tracking-wider">
                        {scannedSearchId}
                    </div>
                </div>
                <DialogFooter className="gap-3 sm:gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                        setShowSearchVerificationDialog(false);
                        setScannedSearchId('');
                        setSearchId(''); // Also clear main search input
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleSearchMedicine(scannedSearchId)}
                        className="bg-blue-600 hover:bg-blue-600/90 text-white"
                        disabled={!scannedSearchId.trim() || isLoadingSearch}
                    >
                        {isLoadingSearch ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                        Sí, Buscar este ID
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
