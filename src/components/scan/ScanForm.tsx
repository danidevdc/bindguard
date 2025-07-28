
"use client";

import { useState, useEffect, type FormEvent, useRef, forwardRef, useImperativeHandle, useCallback }
from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Camera, FileText, CheckCircle, AlertTriangle, Pill, ShoppingCart, CheckSquare, CalendarIcon, Trash2, ScanLine, Hash, ClipboardList, ArrowRight, PlusCircle, XCircle, VideoOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { type Medicine, getMedicineByIdFromFirestore, updateMedicineStockInFirestore, type DispensingRecord } from '@/lib/medicineService';
import QrScanner from 'qr-scanner';
import { Timestamp } from 'firebase/firestore';

interface MedicineForPrescription {
  id: string; 
  name: string;
  code: string; 
  quantity: number;
}

type ScanStep =
  "enterPrescriptionNumber" |
  "identifyMedicine" |
  "enterQuantity" |
  "reviewPrescription";

type VerificationStatus = "idle" | "loading" | "success" | "error";

interface VerificationResult {
    status: VerificationStatus;
    medicine?: Medicine | null;
    message?: string;
}

export interface ScanFormRef {
  navigateBackStep: () => boolean;
}

const ScanForm = forwardRef<ScanFormRef, {}>((props, ref) => {
  const [step, setStep] = useState<ScanStep>("enterPrescriptionNumber");
  const router = useRouter();

  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [recipeDate, setRecipeDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [manualCodeInputValue, setManualCodeInputValue] = useState(''); 
  const [identifiedMedicine, setIdentifiedMedicine] = useState<Medicine | null>(null);

  const [currentQuantity, setCurrentQuantity] = useState('');
  const [medicinesInPrescription, setMedicinesInPrescription] = useState<MedicineForPrescription[]>([]);

  const [clientNow, setClientNow] = useState<Date | null>(null);
  const { toast } = useToast();
  const { getCurrentUserUsername } = useAuth();

  const [isScanningQR, setIsScanningQR] = useState(false);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => { setVideoNode(node); }, []);

  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult>({ status: 'idle' });
  const [verificationCode, setVerificationCode] = useState('');
  
  const LOCAL_STORAGE_KEY = 'inProgressPrescription';


  // Restore state from localStorage on initial mount
  useEffect(() => {
    try {
        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState.prescriptionNumber && savedState.medicinesInPrescription) {
                setPrescriptionNumber(savedState.prescriptionNumber);
                setMedicinesInPrescription(savedState.medicinesInPrescription);
                // Use a default date if not saved, or restore it if you save it too
                const restoredDate = savedState.recipeDate ? new Date(savedState.recipeDate) : new Date();
                setRecipeDate(restoredDate);
                setStep("identifyMedicine"); // Jump to the appropriate step
                toast({ title: "Progreso Restaurado", description: "Se ha restaurado una receta que estaba en progreso." });
            }
        }
    } catch (error) {
        console.error("Failed to parse state from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
    }
  }, [toast]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Only save if there's a prescription number to avoid saving an empty initial state
    if (prescriptionNumber) {
        const stateToSave = {
            prescriptionNumber,
            medicinesInPrescription,
            recipeDate: recipeDate?.toISOString(), // Save date as ISO string
        };
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }
  }, [prescriptionNumber, medicinesInPrescription, recipeDate]);


  useEffect(() => {
    const today = new Date();
    setClientNow(today);
    // Set default recipe date only if it's not already set (e.g., from restored state)
    if (!recipeDate && step === "identifyMedicine") {
      setRecipeDate(today);
    }
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser.");
        }
    }
  }, [step, recipeDate]);

  const playBeep = useCallback(() => {
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
  }, []);
  
 const handleQrScanSuccess = useCallback((result: QrScanner.ScanResult | string) => {
    const scannedData = typeof result === 'string' ? result : result.data;
    setIsScanningQR(false); 

    let codeFromQR = '';
    try {
        const parsedData = JSON.parse(scannedData);
        if (parsedData && typeof parsedData.id === 'string') {
            codeFromQR = parsedData.id;
        } else { 
            codeFromQR = scannedData; 
        }
    } catch (e) { 
        codeFromQR = scannedData; 
    }

    if (codeFromQR) {
        playBeep();
        setManualCodeInputValue(codeFromQR); 
        triggerVerification(codeFromQR);
    } else {
        toast({
            title: "QR Inválido",
            description: "No se pudo extraer un código del QR escaneado.",
            variant: "destructive",
        });
    }
  }, [playBeep, toast]); 

  const handleQrScanError = useCallback((error: Error | string) => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        if ((error as Error).message === 'No QR code found') return;
    } else if (typeof error === 'string' && error === 'No QR code found') return;
  }, []); 

  const stopCameraAndScanner = useCallback(() => {
    if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
    }
    if (videoNode && videoNode.srcObject) {
        const stream = videoNode.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoNode.srcObject = null;
    }
  }, [videoNode]);

  useEffect(() => {
    if (isScanningQR) {
      const startScanner = async () => {
        if (!videoNode) return;
        stopCameraAndScanner();
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          videoNode.srcObject = stream;
          await videoNode.play();
          qrScannerRef.current = new QrScanner(videoNode, handleQrScanSuccess, { onDecodeError: handleQrScanError, preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true });
          await qrScannerRef.current.start();
        } catch (error) {
          setHasCameraPermission(false); 
          toast({ variant: 'destructive', title: 'Acceso a Cámara Denegado', description: 'Por favor, habilita los permisos de cámara en tu navegador.' });
          setIsScanningQR(false);
        }
      };
      startScanner();
    } else {
      stopCameraAndScanner();
    }
    return () => stopCameraAndScanner();
  }, [isScanningQR, videoNode, stopCameraAndScanner, handleQrScanSuccess, handleQrScanError, toast]);

  useImperativeHandle(ref, () => ({
    navigateBackStep: () => {
      if (isScanningQR) { setIsScanningQR(false); return true; }
      if (showVerificationDialog) { setShowVerificationDialog(false); return true; }
      if (step === "reviewPrescription") { setStep("identifyMedicine"); return true; }
      if (step === "enterQuantity") { setIdentifiedMedicine(null); setCurrentQuantity(''); setStep("identifyMedicine"); return true; }
      if (step === "identifyMedicine") { setStep("enterPrescriptionNumber"); return true; }
      return false;
    }
  }));

  const handleStartPrescription = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (!prescriptionNumber.trim()) {
      toast({ title: "Número de Receta Requerido", variant: "destructive" });
      return;
    }
    setStep("identifyMedicine");
  }, [prescriptionNumber, toast]);

  const triggerVerification = useCallback(async (codeToVerifyRaw: string) => {
    const codeToVerify = codeToVerifyRaw.trim().toUpperCase();
    if (!codeToVerify) {
        toast({ title: "Código Requerido", description: "Ingresa un código para verificar.", variant: "destructive" });
        return;
    }

    setShowVerificationDialog(true);
    setVerificationResult({ status: 'loading' });
    setVerificationCode(codeToVerify);

    if (!recipeDate) {
        setVerificationResult({ status: 'error', message: 'Por favor, selecciona una fecha para la receta.' });
        return;
    }

    try {
        const foundMedicine = await getMedicineByIdFromFirestore(codeToVerify);

        if (!foundMedicine) {
            setVerificationResult({ status: 'error', medicine: null, message: `El código "${codeToVerify}" no existe en la base de datos.` });
            return;
        }

        if (foundMedicine.isBlocked) {
            setVerificationResult({ status: 'error', medicine: foundMedicine, message: `Medicamento "${foundMedicine.name}" cerrado por el administrador.` });
            return;
        }

        if (medicinesInPrescription.some(med => med.code.toUpperCase() === foundMedicine.id.toUpperCase())) {
            setVerificationResult({ status: 'error', medicine: foundMedicine, message: `${foundMedicine.name} ya ha sido añadido a esta receta.` });
            return;
        }
        
        setVerificationResult({ status: 'success', medicine: foundMedicine });

    } catch (error) {
        setVerificationResult({ status: 'error', message: "Error al conectar con la base de datos." });
    }
  }, [recipeDate, medicinesInPrescription, toast]);

  const handleVerificationDialogContinue = useCallback(() => {
    if (verificationResult.status === 'success' && verificationResult.medicine) {
        setIdentifiedMedicine(verificationResult.medicine);
        setStep("enterQuantity");
        setShowVerificationDialog(false);
    }
  }, [verificationResult]);
  
  const handleManualCodeSubmit = useCallback(() => {
    triggerVerification(manualCodeInputValue);
  }, [manualCodeInputValue, triggerVerification]);

  const addCurrentMedicineToList = useCallback((): boolean => {
    if (!currentQuantity.trim() || !identifiedMedicine) {
      toast({ title: "Datos incompletos", variant: "destructive" });
      return false;
    }
    const quantityNum = parseInt(currentQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Cantidad Inválida", variant: "destructive" });
      return false;
    }

    if (identifiedMedicine.currentStock === null || quantityNum > identifiedMedicine.currentStock) {
        toast({ title: "Stock Insuficiente", description: `Stock actual: ${identifiedMedicine.currentStock || 0}.`, variant: "destructive" });
        return false;
    }
    
    const newMedicineEntry: MedicineForPrescription = {
      id: Date.now().toString(), 
      name: identifiedMedicine.name,
      code: identifiedMedicine.id, 
      quantity: quantityNum,
    };
    setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);

    toast({ title: "Medicamento Añadido", description: `${identifiedMedicine.name}, Cant: ${quantityNum}.` });
    return true;
  }, [currentQuantity, identifiedMedicine, toast]);

  const handleAddMedicineAndContinueScanning = useCallback(() => {
    if (addCurrentMedicineToList()) {
      setManualCodeInputValue('');
      setIdentifiedMedicine(null);
      setCurrentQuantity('');
      setStep("identifyMedicine");
    }
  }, [addCurrentMedicineToList]);

  const handleGoToReviewFromQuantity = useCallback(() => {
    let itemAddedSuccessfully = false;
    if (identifiedMedicine && currentQuantity.trim()) {
        itemAddedSuccessfully = addCurrentMedicineToList();
        if (!itemAddedSuccessfully) return; 
    } else if (medicinesInPrescription.length === 0) {
        toast({ title: "Receta Vacía", description: "Añade al menos un medicamento válido para revisar.", variant: "destructive" });
        return;
    }
    
    setManualCodeInputValue('');
    setIdentifiedMedicine(null);
    setCurrentQuantity('');
    setStep("reviewPrescription");
  }, [identifiedMedicine, currentQuantity, addCurrentMedicineToList, medicinesInPrescription, toast]);

  const handleGoToReviewFromIdentify = useCallback(() => {
    if (medicinesInPrescription.length > 0) {
      setStep("reviewPrescription");
    } else {
      toast({ title: "Receta Vacía", description: "Añade al menos un medicamento para poder revisar la receta.", variant: "destructive" });
    }
  }, [medicinesInPrescription, toast]);

  const handleRemoveMedicineFromReview = useCallback((medicineEntryId: string) => {
    setMedicinesInPrescription(prevMeds => prevMeds.filter(med => med.id !== medicineEntryId));
    toast({ title: "Medicamento Eliminado" });
  }, [toast]);

  const finalizeAndRedirect = useCallback(async (action: "confirmed" | "cancelled") => {
    const currentUsername = getCurrentUserUsername(); 
    if (action === "confirmed") {
        if (medicinesInPrescription.some(med => med.quantity <= 0)) {
            toast({ title: "Cantidades Inválidas", variant: "destructive" }); return;
        }
        if (!recipeDate) {
            toast({ title: "Fecha de Receta Requerida", variant: "destructive"}); return;
        }
        for (const med of medicinesInPrescription) {
            try {
                await updateMedicineStockInFirestore(med.code, med.quantity, 'dispensed', prescriptionNumber, currentUsername, Timestamp.fromDate(recipeDate));
            } catch (error: any) {
                toast({ title: `Error al procesar ${med.name}`, description: error.message, variant: "destructive", duration: 10000 });
            }
        }
        toast({ title: "Receta Confirmada", description: `Receta Nº ${prescriptionNumber} procesada.` });
    } else { 
        toast({ title: "Receta Cancelada", description: `Receta Nº ${prescriptionNumber} cancelada.` });
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear the saved state
    router.push('/dashboard');
  }, [getCurrentUserUsername, medicinesInPrescription, recipeDate, prescriptionNumber, router, toast]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setRecipeDate(date);
    setIsCalendarOpen(false);
  }, []);

  if (step === "enterPrescriptionNumber") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Ingrese Nº de Receta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartPrescription} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="prescriptionNumberInput"
                type="text"
                inputMode="numeric"
                value={prescriptionNumber}
                onChange={(e) => setPrescriptionNumber(e.target.value.replace(/\D/g, ''))}
                required
                className="text-lg p-3"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
              OK
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "identifyMedicine") {
    return (
      <>
        <Card className="w-full max-w-lg mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center">
              <ScanLine className="mr-2 h-6 w-6 text-primary" />
              Receta Nº {prescriptionNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Dialog open={isScanningQR} onOpenChange={setIsScanningQR}>
              <DialogTrigger asChild>
                <Button variant="default" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-600/90 text-white flex items-center justify-center"
                  onClick={() => { setHasCameraPermission(null); setIsScanningQR(true); }}>
                  <Camera className="mr-2 h-6 w-6" /> Escanear QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg p-4 md:p-6">
                <DialogHeader><DialogTitle>Escaneando Código QR</DialogTitle></DialogHeader>
                <div className="mt-2 p-2 border rounded-md bg-muted/30">
                  <video ref={videoCallbackRef} className="w-full aspect-video rounded-md bg-black object-cover" autoPlay playsInline muted />
                  {hasCameraPermission === false && ( 
                      <Alert variant="destructive" className="w-full mt-2">
                        <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                        <AlertDescription>Habilita los permisos de cámara para escanear.</AlertDescription>
                      </Alert>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsScanningQR(false)}>Cerrar Cámara</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="relative flex items-center"><span className="flex-shrink px-3 text-muted-foreground">O</span><div className="flex-grow border-t"></div></div>
            <div className="space-y-2">
              <Label htmlFor="manualCodeInput">Ingresa el código del medicamento</Label>
              <div className="flex gap-2">
                <Input id="manualCodeInput" type="text" placeholder="Código (Ej: MED001)" value={manualCodeInputValue} onChange={(e) => setManualCodeInputValue(e.target.value)} className="flex-grow"/>
                <Button type="button" onClick={handleManualCodeSubmit} disabled={!manualCodeInputValue.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">Verificar</Button>
              </div>
            </div>
            <div className="space-y-2 mt-4">
                <Label htmlFor="recipeDate" className="text-accent">Fecha de la Receta</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button id="recipeDate" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !recipeDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recipeDate ? format(recipeDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={recipeDate} onSelect={handleDateSelect} initialFocus locale={es} disabled={(date) => clientNow ? date > clientNow : false} />
                  </PopoverContent>
                </Popover>
            </div>
            {medicinesInPrescription.length > 0 && (
                <div className='pt-4 space-y-3'>
                    <h3 className="text-lg font-semibold text-center">Resumen Receta</h3>
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Medicamento</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {medicinesInPrescription.map(med => (
                                    <TableRow key={med.id}>
                                        <TableCell className="font-mono text-xs">{med.code}</TableCell>
                                        <TableCell>{med.name}</TableCell>
                                        <TableCell className="text-right">{med.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button type="button" variant="default" onClick={handleGoToReviewFromIdentify} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
                        <ClipboardList className="mr-2 h-5 w-5" /> Revisar Receta ({medicinesInPrescription.length} items)
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
        
        <Dialog open={showVerificationDialog} onOpenChange={(isOpen) => { if (!isOpen) { setVerificationResult({status: 'idle'}); setManualCodeInputValue(''); setShowVerificationDialog(false); }}}>
            <DialogContent className={cn("sm:max-w-md shadow-lg rounded-lg", 
                verificationResult.status === 'success' && 'border-green-500', 
                verificationResult.status === 'error' && 'border-destructive'
            )}>
                <DialogHeader>
                    <DialogTitle className="flex items-center text-xl">
                        {verificationResult.status === 'loading' && <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />}
                        {verificationResult.status === 'success' && <CheckCircle className="mr-2 h-6 w-6 text-green-600" />}
                        {verificationResult.status === 'error' && <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />}
                        Verificando Medicamento
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    {verificationResult.status === 'loading' && (
                        <div className="text-center text-muted-foreground">Buscando en la base de datos...</div>
                    )}
                    {verificationResult.status === 'error' && (
                         <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{verificationResult.message}</AlertDescription>
                        </Alert>
                    )}
                    {verificationResult.status === 'success' && verificationResult.medicine && (
                       <div className="text-center p-4 rounded-md bg-green-50 dark:bg-green-900/20">
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">{verificationResult.medicine.id}</p>
                            <p className="text-lg text-green-800 dark:text-green-200">{verificationResult.medicine.name}</p>
                            <p className="text-sm text-muted-foreground mt-2">Stock Actual: {verificationResult.medicine.currentStock}</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="gap-3 sm:gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowVerificationDialog(false)}>
                       {verificationResult.status === 'success' ? 'Cancelar' : 'Cerrar'}
                    </Button>
                    {verificationResult.status === 'success' && (
                        <Button type="button" onClick={handleVerificationDialogContinue} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <CheckCircle className="mr-2 h-5 w-5" /> OK
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
  }

  if (step === "enterQuantity") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-bold">{identifiedMedicine?.name}</CardTitle>
          <CardDescription>Código: {identifiedMedicine?.id} - Stock Actual: {identifiedMedicine?.currentStock ?? 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quantityInput" className="text-lg">Cantidad a Dispensar</Label>
            <Input id="quantityInput" type="number" inputMode="numeric" placeholder="0" value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value.replace(/\D/g, ''))} required className="text-4xl h-20 p-4 text-center"
              min="1" max={identifiedMedicine?.currentStock?.toString()}/>
             {identifiedMedicine && identifiedMedicine.currentStock !== null && parseInt(currentQuantity) > identifiedMedicine.currentStock && (
                <p className="text-sm text-destructive text-center">La cantidad excede el stock disponible.</p>
            )}
          </div>
          <div className="space-y-3">
            <Button onClick={handleAddMedicineAndContinueScanning} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-md py-3"
              disabled={!currentQuantity.trim() || parseInt(currentQuantity) <= 0 || (identifiedMedicine != null && identifiedMedicine.currentStock !== null && parseInt(currentQuantity) > identifiedMedicine.currentStock)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Agregar y Escanear Otro
            </Button>
            <Button onClick={handleGoToReviewFromQuantity} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                disabled={(medicinesInPrescription.length === 0 && (!currentQuantity.trim() || parseInt(currentQuantity) <= 0)) || (identifiedMedicine != null && identifiedMedicine.currentStock !== null && parseInt(currentQuantity) > identifiedMedicine.currentStock && currentQuantity.trim() !== "")}>
              <ClipboardList className="mr-2 h-5 w-5" /> Finalizar y Revisar Receta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "reviewPrescription") {
    return (
      <Card className="w-full max-w-xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center">
            <ClipboardList className="mr-2 h-6 w-6 text-primary" /> Resumen Receta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm p-3 bg-muted/30 rounded-md border">
            <p>Receta Nro: <strong className="text-foreground">{prescriptionNumber}</strong></p>
            <p>Fecha: <strong className="text-foreground">{recipeDate ? format(recipeDate, "dd/MM/yyyy", { locale: es }) : 'N/A'}</strong></p>
          </div>
          {medicinesInPrescription.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="w-[100px]">Cantidad</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicinesInPrescription.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-mono text-xs">{med.code}</TableCell>
                      <TableCell>{med.name}</TableCell>
                      <TableCell><Input type="number" value={med.quantity > 0 ? med.quantity : ""} onChange={(e) => { const newQty = parseInt(e.target.value.replace(/\D/g, '')); setMedicinesInPrescription(prev => prev.map(p => p.id === med.id ? {...p, quantity: isNaN(newQty) ? 0 : newQty} : p))}} className="w-20 h-9 p-1" min="1"/></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMedicineFromReview(med.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (<p className="text-center text-muted-foreground py-4">No hay medicamentos en esta receta.</p>)}
          <div className="flex flex-col gap-4 pt-4">
            <Button onClick={() => finalizeAndRedirect("confirmed")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3" disabled={medicinesInPrescription.length === 0 || medicinesInPrescription.some(m => m.quantity <= 0)}>
              <CheckSquare className="mr-2 h-5 w-5" /> Confirmar
            </Button>
            <Button onClick={() => finalizeAndRedirect("cancelled")} variant="destructive" className="w-full text-md py-3">
              <XCircle className="mr-2 h-5 w-5" /> Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
});

ScanForm.displayName = 'ScanForm';
export default ScanForm;
