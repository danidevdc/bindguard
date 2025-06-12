
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
import { Camera, FileText, CheckCircle, AlertTriangle, Pill, ShoppingCart, CheckSquare, CalendarIcon, Trash2, ScanLine, Hash, ClipboardList, ArrowRight, PlusCircle, XCircle, VideoOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { type Medicine, getMedicineByIdFromFirestore, updateMedicineStockInFirestore } from '@/lib/medicineService';
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

export interface ScanFormRef {
  navigateBackStep: () => boolean;
}

const ScanForm = forwardRef<ScanFormRef, {}>((props, ref) => {
  const [step, setStep] = useState<ScanStep>("enterPrescriptionNumber");
  const router = useRouter();

  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [recipeDate, setRecipeDate] = useState<Date | undefined>(undefined);

  const [currentScannedCode, setCurrentScannedCode] = useState(''); 
  const [manualCodeInputValue, setManualCodeInputValue] = useState(''); 
  const [identifiedMedicineName, setIdentifiedMedicineName] = useState(''); 
  const [identifiedMedicineCode, setIdentifiedMedicineCode] = useState('');
  const [identifiedMedicineStock, setIdentifiedMedicineStock] = useState<number | null>(null);


  const [currentQuantity, setCurrentQuantity] = useState('');
  const [medicinesInPrescription, setMedicinesInPrescription] = useState<MedicineForPrescription[]>([]);

  const [clientNow, setClientNow] = useState<Date | null>(null);

  const { toast } = useToast();
  const { getCurrentUserUsername } = useAuth();

  const [isScanningQR, setIsScanningQR] = useState(false);
  
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    console.log("DEBUG: videoCallbackRef called with node:", node);
    setVideoNode(node);
  }, []);

  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraStreamActive, setIsCameraStreamActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);


  useEffect(() => {
    const today = new Date();
    setClientNow(today);
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
  
 const handleQrScanSuccess = useCallback((result: QrScanner.ScanResult | string) => {
    const scannedData = typeof result === 'string' ? result : result.data;
    console.log('DEBUG: QR Scan Successful. Raw Data:', scannedData);
    
    toast({
        title: "QR Detectado (Debug)",
        description: `Dato crudo: ${scannedData.substring(0, 50)}...`,
        duration: 2000 
    });
    
    setIsScanningQR(false); 

    let codeFromQR = '';
    let medicineNameFromQR = ''; 

    try {
        const parsedData = JSON.parse(scannedData);
        console.log('DEBUG: Parsed QR Data:', parsedData);
        if (parsedData && typeof parsedData.id === 'string') {
            codeFromQR = parsedData.id;
            if (typeof parsedData.nombre === 'string') {
                medicineNameFromQR = parsedData.nombre;
            }
        } else { 
            codeFromQR = scannedData; 
             console.warn('DEBUG: QR data is not the expected JSON format or does not have an id field. Treating as raw ID.');
        }
    } catch (e) { 
        codeFromQR = scannedData; 
        console.warn('DEBUG: QR data is not valid JSON. Treating as raw ID.', e);
    }

    if (codeFromQR) {
        playBeep();
        setCurrentScannedCode(codeFromQR);
        setManualCodeInputValue(codeFromQR); 
        setShowVerificationDialog(true); 
        toast({
            title: "QR Procesado",
            description: medicineNameFromQR 
                         ? `Medicamento: ${medicineNameFromQR} (Código: ${codeFromQR}). Verifica y continúa.`
                         : `Código: ${codeFromQR}. Verifica y continúa.`
        });
    } else {
        toast({
            title: "QR Inválido",
            description: "No se pudo extraer un código del QR escaneado después del procesamiento.",
            variant: "destructive",
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  const handleQrScanError = useCallback((error: Error | string) => {
    console.log('DEBUG: QR Scan Error/Event:', error); 
     if (typeof error === 'object' && error !== null && 'message' in error) {
        if ((error as Error).message === 'No QR code found') {
            return; 
        }
    } else if (typeof error === 'string' && error === 'No QR code found') {
        return; 
    }
  }, []);

  useEffect(() => {
    console.log("DEBUG: useEffect for [isScanningQR, videoNode] triggered. isScanningQR:", isScanningQR, "videoNode exists:", !!videoNode);

    if (isScanningQR && videoNode) {
      const startScanner = async () => {
        setIsCameraStreamActive(false);
        setHasCameraPermission(null); // Reset permission status for new attempt

        let stream: MediaStream | null = null;
        try {
          console.log("DEBUG: Attempting to get environment camera for videoNode:", videoNode);
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          videoNode.srcObject = stream;
          await videoNode.play();
          setIsCameraStreamActive(true);
          console.log("DEBUG: Environment camera stream started and playing.");

          if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
          }
          qrScannerRef.current = new QrScanner(
            videoNode,
            handleQrScanSuccess,
            {
              onDecodeError: handleQrScanError,
              preferredCamera: "environment",
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          await qrScannerRef.current.start();
          console.log("DEBUG: QR Scanner started with environment camera.");

        } catch (error: any) {
          console.error('DEBUG: Error accessing environment camera or starting scanner:', error);
          if (stream) stream.getTracks().forEach(track => track.stop());
          if(videoNode) videoNode.srcObject = null;
          setIsCameraStreamActive(false);

          try { 
            console.log("DEBUG: Attempting to get fallback camera (any) for videoNode:", videoNode);
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            videoNode.srcObject = stream;
            await videoNode.play();
            setIsCameraStreamActive(true);
            console.log("DEBUG: Fallback camera stream started and playing.");
            
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
            }
            qrScannerRef.current = new QrScanner(
                videoNode,
                handleQrScanSuccess,
                {
                    onDecodeError: handleQrScanError,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                }
            );
            await qrScannerRef.current.start();
            console.log("DEBUG: QR Scanner started with fallback camera.");
          } catch (fallbackError: any) {
             console.error('DEBUG: Fallback camera access error:', fallbackError);
             if (stream) stream.getTracks().forEach(track => track.stop());
             if(videoNode) videoNode.srcObject = null;
             setHasCameraPermission(false);
             setIsCameraStreamActive(false);
             toast({
                variant: 'destructive',
                title: 'Acceso a Cámara Denegado',
                description: 'Por favor, habilita los permisos de cámara para escanear.',
             });
             setIsScanningQR(false); 
          }
        }
      };
      startScanner();
    } else if (!isScanningQR) { // Explicitly stop if dialog is closed
        console.log("DEBUG: isScanningQR is false, ensuring scanner and camera are stopped.");
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
        setIsCameraStreamActive(false);
    }

    return () => { 
      console.log("DEBUG: Cleanup function for [isScanningQR, videoNode] useEffect.");
      if (qrScannerRef.current) {
        console.log("DEBUG: Cleanup: Destroying QR scanner.");
        qrScannerRef.current.stop(); 
        qrScannerRef.current.destroy(); 
        qrScannerRef.current = null;
      }
       if (videoNode && videoNode.srcObject) {
        console.log("DEBUG: Cleanup: Stopping camera tracks.");
        const stream = videoNode.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoNode.srcObject = null; 
      }
      setIsCameraStreamActive(false); 
    };
  }, [isScanningQR, videoNode, handleQrScanSuccess, handleQrScanError, toast]);


  useImperativeHandle(ref, () => ({
    navigateBackStep: () => {
      if (isScanningQR) { 
        setIsScanningQR(false); 
        return true;
      }
      if (showVerificationDialog) { 
        setShowVerificationDialog(false);
        setCurrentScannedCode('');
        setManualCodeInputValue('');
        return true;
      }
      if (step === "reviewPrescription") {
        setStep("identifyMedicine");
        return true;
      }
      if (step === "enterQuantity") {
        setIdentifiedMedicineName(''); 
        setIdentifiedMedicineCode('');
        setIdentifiedMedicineStock(null);
        setCurrentQuantity(''); 
        setStep("identifyMedicine");
        return true;
      }
      if (step === "identifyMedicine") {
        setStep("enterPrescriptionNumber");
        return true;
      }
      return false;
    }
  }));


  const handleStartPrescription = (event: FormEvent) => {
    event.preventDefault();
    if (!prescriptionNumber.trim()) {
      toast({
        title: "Número de Receta Requerido",
        description: "Por favor, ingresa un número de receta.",
        variant: "destructive",
      });
      return;
    }
    setStep("identifyMedicine");
  };

  const verifyAndPrepareMedicine = async (codeToVerifyRaw: string) => {
    const codeToVerify = codeToVerifyRaw.trim().toUpperCase();

    if (!codeToVerify) {
        toast({ title: "Error", description: "No hay código de medicamento para verificar.", variant: "destructive" });
        setCurrentScannedCode(''); 
        setManualCodeInputValue('');
        return;
    }
    if (!recipeDate) {
        toast({ title: "Fecha de Receta Requerida", description: "Por favor, selecciona una fecha para la receta.", variant: "destructive"});
        return;
    }

    const foundMedicine = await getMedicineByIdFromFirestore(codeToVerify);

    if (!foundMedicine) {
        toast({ title: "Medicamento No Encontrado", description: `El medicamento con código "${codeToVerifyRaw}" no existe en la base de datos.`, variant: "destructive" });
        setCurrentScannedCode(''); 
        setManualCodeInputValue('');
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        setIdentifiedMedicineStock(null);
        return;
    }

    if (foundMedicine.isBlocked) {
        toast({ title: "Medicamento Cerrado", description: `El medicamento "${foundMedicine.name}" (ID: ${foundMedicine.id}) está cerrado y no se puede dispensar.`, variant: "destructive" });
        setCurrentScannedCode('');
        setManualCodeInputValue('');
        setIdentifiedMedicineName(''); 
        setIdentifiedMedicineCode('');
        setIdentifiedMedicineStock(null);
        return;
    }

    const isDuplicateInPrescription = medicinesInPrescription.some(
        med => med.code.toUpperCase() === foundMedicine.id.toUpperCase()
    );

    if (isDuplicateInPrescription) {
        toast({ title: "Medicamento Duplicado", description: `${foundMedicine.name} ya ha sido añadido a esta receta. No se puede agregar de nuevo.`, variant: "destructive" });
        setCurrentScannedCode('');
        setManualCodeInputValue('');
        setIdentifiedMedicineName(''); 
        setIdentifiedMedicineCode('');
        setIdentifiedMedicineStock(null);
        return; 
    }

    setIdentifiedMedicineName(foundMedicine.name);
    setIdentifiedMedicineCode(foundMedicine.id);
    setIdentifiedMedicineStock(foundMedicine.currentStock);
    setStep("enterQuantity");
    setCurrentScannedCode(''); 
    setManualCodeInputValue('');
};

  
  const handleManualCodeSubmit = () => {
    if (manualCodeInputValue.trim()) {
        setCurrentScannedCode(manualCodeInputValue.trim()); 
        setShowVerificationDialog(true); 
    } else {
        toast({ title: "Código Requerido", description: "Ingresa un código de medicamento para verificar.", variant: "destructive"});
    }
  };


  const addCurrentMedicineToList = (): boolean => {
    if (!currentQuantity.trim()) {
      toast({ title: "Cantidad Requerida", description: "Ingresa la cantidad a dispensar.", variant: "destructive" });
      return false;
    }
    const quantityNum = parseInt(currentQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número positivo mayor a 0.", variant: "destructive" });
      return false;
    }

    if (identifiedMedicineStock === null || quantityNum > identifiedMedicineStock) {
        toast({ title: "Stock Insuficiente", description: `No hay suficiente stock para ${identifiedMedicineName}. Stock actual: ${identifiedMedicineStock || 0}.`, variant: "destructive" });
        return false;
    }
    
    if (medicinesInPrescription.some(med => med.code.toUpperCase() === identifiedMedicineCode.toUpperCase())) {
        toast({ title: "Error: Duplicado", description: `${identifiedMedicineName} ya está en la receta.`, variant: "destructive" });
        return false; 
    }

    const newMedicineEntry: MedicineForPrescription = {
      id: Date.now().toString(), 
      name: identifiedMedicineName,
      code: identifiedMedicineCode, 
      quantity: quantityNum,
    };
    setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);

    toast({
      title: "Medicamento Añadido a Receta",
      description: `${identifiedMedicineName} (Cód: ${identifiedMedicineCode}), Cant: ${quantityNum}.`,
    });
    return true;
  };

  const handleAddMedicineAndContinueScanning = () => {
    if (addCurrentMedicineToList()) {
      setCurrentScannedCode('');
      setManualCodeInputValue('');
      setIdentifiedMedicineName('');
      setIdentifiedMedicineCode('');
      setIdentifiedMedicineStock(null);
      setCurrentQuantity('');
      setStep("identifyMedicine");
    }
  };

  const handleGoToReviewFromQuantity = () => {
    let itemAddedSuccessfully = false;
    if (identifiedMedicineCode && identifiedMedicineName && currentQuantity.trim()) {
        itemAddedSuccessfully = addCurrentMedicineToList();
        if (!itemAddedSuccessfully) return; 
    } else if (medicinesInPrescription.length === 0) {
        toast({ title: "Receta Vacía", description: "Añade al menos un medicamento válido para revisar.", variant: "destructive" });
        return;
    }
    
    if (itemAddedSuccessfully || medicinesInPrescription.length > 0) {
        setCurrentScannedCode('');
        setManualCodeInputValue('');
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        setIdentifiedMedicineStock(null); 
        setCurrentQuantity('');
        setStep("reviewPrescription");
    } else { 
        toast({ title: "Receta Vacía", description: "Añade al menos un medicamento para finalizar.", variant: "destructive" });
    }
  };

  const handleGoToReviewFromIdentify = () => {
    if (medicinesInPrescription.length > 0) {
      setCurrentScannedCode('');
      setManualCodeInputValue('');
      setIdentifiedMedicineName('');
      setIdentifiedMedicineCode('');
      setIdentifiedMedicineStock(null);
      setCurrentQuantity('');
      setStep("reviewPrescription");
    } else {
      toast({ title: "Receta Vacía", description: "Añade al menos un medicamento para poder revisar la receta.", variant: "destructive" });
    }
  };

  const handleUpdateMedicineQuantityInReview = (medicineEntryId: string, newQuantityStr: string) => {
    if (newQuantityStr === "" || parseInt(newQuantityStr) <= 0) {
      setMedicinesInPrescription(prevMeds =>
        prevMeds.map(med => med.id === medicineEntryId ? { ...med, quantity: 0 } : med)
      );
      if (newQuantityStr !== "") { 
         toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número positivo mayor a 0.", variant: "destructive" });
      }
      return;
    }
    const newQuantity = parseInt(newQuantityStr);
     if (isNaN(newQuantity)) {
        toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número.", variant: "destructive" });
        return;
    }
    setMedicinesInPrescription(prevMeds =>
      prevMeds.map(med => med.id === medicineEntryId ? { ...med, quantity: newQuantity } : med)
    );
  };

  const handleRemoveMedicineFromReview = (medicineEntryId: string) => {
    setMedicinesInPrescription(prevMeds => prevMeds.filter(med => med.id !== medicineEntryId));
    toast({ title: "Medicamento Eliminado", description: "El medicamento ha sido eliminado de la lista de revisión." });
  };

  const finalizeAndRedirect = async (action: "confirmed" | "cancelled") => {
    const currentUsername = getCurrentUserUsername(); 

    if (action === "confirmed") {
        if (medicinesInPrescription.some(med => med.quantity <= 0)) {
            toast({ title: "Cantidades Inválidas", description: "Asegúrate que todos los medicamentos tengan una cantidad válida (mayor a 0).", variant: "destructive" });
            return;
        }
        if (!recipeDate) {
            toast({ title: "Fecha de Receta Requerida", description: "Por favor, selecciona una fecha para la receta antes de confirmar.", variant: "destructive"});
            return;
        }

        let allUpdatesSuccessful = true;
        const batchErrors: string[] = [];

        for (const med of medicinesInPrescription) {
            try {
                await updateMedicineStockInFirestore(
                    med.code,
                    med.quantity,
                    'dispensed',
                    prescriptionNumber,
                    currentUsername, 
                    Timestamp.fromDate(recipeDate) 
                );
            } catch (error: any) {
                allUpdatesSuccessful = false;
                const errorMessage = error.message || "No se pudo actualizar el stock de este medicamento.";
                batchErrors.push(`Error al dispensar ${med.name}: ${errorMessage}`);
                console.error(`Error updating stock for ${med.name} (ID: ${med.code}):`, error);
            }
        }

        if (allUpdatesSuccessful) {
            toast({ title: "Receta Confirmada y Procesada", description: `Receta Nº ${prescriptionNumber} actualizada en la base de datos.` });
        } else {
            toast({ 
                title: "Receta Procesada con Errores", 
                description: `Algunos medicamentos de la Receta Nº ${prescriptionNumber} no pudieron ser actualizados. ${batchErrors.join(' ')} Revisa el inventario.`, 
                variant: "destructive",
                duration: 10000 
            });
        }

    } else { 
        toast({ title: "Receta Cancelada", description: `Receta Nº ${prescriptionNumber} ha sido cancelada. No se guardaron cambios.` });
    }

    setPrescriptionNumber('');
    setRecipeDate(clientNow || new Date());
    setCurrentScannedCode('');
    setManualCodeInputValue('');
    setIdentifiedMedicineName('');
    setIdentifiedMedicineCode('');
    setIdentifiedMedicineStock(null);
    setCurrentQuantity('');
    setMedicinesInPrescription([]);
    setIsScanningQR(false);
    setHasCameraPermission(null);
    setIsCameraStreamActive(false);
    setShowVerificationDialog(false);
    router.push('/dashboard');
  };


  if (step === "enterPrescriptionNumber") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Nº de Receta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartPrescription} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prescriptionNumberInput">Número de Receta</Label>
              <Input
                id="prescriptionNumberInput"
                type="text"
                inputMode="numeric"
                placeholder="Nº"
                value={prescriptionNumber}
                onChange={(e) => setPrescriptionNumber(e.target.value.replace(/\D/g, ''))}
                required
                className="text-lg p-3"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
              <ArrowRight className="mr-2 h-5 w-5" />
              Siguiente
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
            
            <Dialog open={isScanningQR} onOpenChange={(open) => {
                console.log("DEBUG: Dialog onOpenChange called. New open state:", open);
                setIsScanningQR(open);
                // La limpieza del scanner y cámara ahora se maneja principalmente en el useEffect [isScanningQR, videoNode]
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-600/90 text-white"
                  onClick={() => {
                    setCurrentScannedCode(''); 
                    setManualCodeInputValue('');
                    setHasCameraPermission(null); 
                    setIsCameraStreamActive(false);
                    setIsScanningQR(true); 
                  }}
                >
                  <Camera className="mr-3 h-8 w-8" />
                  Escanear QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Camera className="mr-2 h-5 w-5 text-primary" />
                    Escaneando Código QR
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-2 p-2 border rounded-md bg-muted/30">
                  <video ref={videoCallbackRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                      <AlertDescription>Habilita los permisos de cámara para escanear.</AlertDescription>
                    </Alert>
                  )}
                  {hasCameraPermission === null && !isCameraStreamActive && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">Iniciando cámara...</p>
                  )}
                  {hasCameraPermission === true && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        {isCameraStreamActive ? "Cámara activa. " : "Estableciendo conexión con cámara... "}
                        Apunta la cámara al código QR. Asegura buena iluminación, enfoque y que el QR esté centrado.
                        Las guías amarillas aparecerán al detectar un QR.
                      </p>
                  )}
                   {hasCameraPermission === true && !isCameraStreamActive && videoNode && videoNode.HAVE_NOTHING && (
                     <div className="flex items-center justify-center text-muted-foreground mt-2">
                        <VideoOff className="mr-2 h-4 w-4"/> No se pudo activar el stream de la cámara. Verifica los permisos.
                     </div>
                  )}
                </div>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsScanningQR(false)}>
                        Cerrar Cámara
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="relative flex items-center">
              <span className="flex-shrink px-3 text-muted-foreground">O</span>
              <div className="flex-grow border-t"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualCodeInput">Ingresa el código del medicamento</Label>
              <div className="flex gap-2">
                <Input id="manualCodeInput" type="text" placeholder="Código (Ej: MED001)"
                  value={manualCodeInputValue} 
                  onChange={(e) => setManualCodeInputValue(e.target.value)}
                  className="flex-grow"
                />
                <Button 
                    type="button" 
                    onClick={handleManualCodeSubmit}
                    disabled={!manualCodeInputValue.trim()}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                    Verificar
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
                <Label htmlFor="recipeDate" className="text-accent">Fecha de la Receta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="recipeDate" variant={"outline"}
                      className={cn(
                          "w-full justify-start text-left font-normal",
                          !recipeDate && "text-muted-foreground",
                          recipeDate && "bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent"
                      )}>
                      <CalendarIcon className={cn("mr-2 h-4 w-4", recipeDate && "text-accent-foreground")} />
                      {recipeDate ? format(recipeDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={recipeDate} onSelect={setRecipeDate} initialFocus locale={es} disabled={(date) => clientNow ? date > clientNow : false} />
                  </PopoverContent>
                </Popover>
            </div>
            {medicinesInPrescription.length > 0 && (
              <Button
                type="button"
                variant="default"
                onClick={handleGoToReviewFromIdentify}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3 mt-4"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Revisar Receta ({medicinesInPrescription.length} items)
              </Button>
            )}
          </CardContent>
        </Card>
        
        <Dialog open={showVerificationDialog} onOpenChange={(isOpen) => {
            setShowVerificationDialog(isOpen);
            if (!isOpen) {
                setCurrentScannedCode('');
                setManualCodeInputValue(''); 
            }
        }}>
            <DialogContent className="sm:max-w-md border-primary shadow-lg rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-primary text-xl">
                        <ScanLine className="mr-2 h-6 w-6" />
                        Verificar Medicamento
                    </DialogTitle>
                    <DialogDescription className="pt-1">
                        Se ha detectado el siguiente código. Confirma para añadirlo a la receta.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <Label htmlFor="detectedCodeDisplay" className="text-sm font-medium text-muted-foreground">Código Detectado/Ingresado:</Label>
                    <div id="detectedCodeDisplay" className="mt-1 text-2xl font-bold text-primary bg-primary/10 p-4 rounded-md text-center tracking-wider">
                        {currentScannedCode}
                    </div>
                </div>
                <DialogFooter className="gap-3 sm:gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={() => {
                            setCurrentScannedCode('');
                            setManualCodeInputValue('');
                        }}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={() => {
                            verifyAndPrepareMedicine(currentScannedCode);
                            setShowVerificationDialog(false); 
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!currentScannedCode.trim()}
                    >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Verificar y Continuar
                    </Button>
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
          <CardTitle className="text-lg font-bold">{identifiedMedicineName}</CardTitle>
          <CardDescription>Código: {identifiedMedicineCode} - Stock Actual: {identifiedMedicineStock ?? 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quantityInput" className="text-lg">Cantidad a Dispensar</Label>
            <Input id="quantityInput" type="number" inputMode="numeric" placeholder="0"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value.replace(/\D/g, ''))}
              required
              className="text-4xl h-20 p-4 text-center"
              min="1"
              max={identifiedMedicineStock?.toString()}
            />
             {identifiedMedicineStock !== null && parseInt(currentQuantity) > identifiedMedicineStock && (
                <p className="text-sm text-destructive text-center">La cantidad excede el stock disponible.</p>
            )}
          </div>
          <div className="space-y-3">
            <Button 
              onClick={handleAddMedicineAndContinueScanning} 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-md py-3"
              disabled={!currentQuantity.trim() || parseInt(currentQuantity) <= 0 || (identifiedMedicineStock !== null && parseInt(currentQuantity) > identifiedMedicineStock)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar y Escanear Otro
            </Button>
            <Button
                onClick={handleGoToReviewFromQuantity}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                disabled={(medicinesInPrescription.length === 0 && (!currentQuantity.trim() || parseInt(currentQuantity) <= 0)) || (identifiedMedicineStock !== null && parseInt(currentQuantity) > identifiedMedicineStock && currentQuantity.trim() !== "")}
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              Finalizar y Revisar Receta
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
            <ClipboardList className="mr-2 h-6 w-6 text-primary" />
            Revisa que la receta esté correcta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm p-3 bg-muted/30 rounded-md border">
            <p>Nº de Receta: <strong className="text-foreground">{prescriptionNumber}</strong></p>
            <p>Fecha: <strong className="text-foreground">{recipeDate ? format(recipeDate, "dd/MM/yyyy", { locale: es }) : 'N/A'}</strong></p>
          </div>

          {medicinesInPrescription.length > 0 ? (
            <ul className="space-y-3 border p-3 rounded-md max-h-80 overflow-y-auto">
              {medicinesInPrescription.map((med) => (
                <li key={med.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 rounded-md gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">Código: {med.code}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 mt-2 sm:mt-0">
                    <Label htmlFor={`quantity-${med.id}`} className="sr-only">Cantidad para {med.name}</Label>
                    <Input id={`quantity-${med.id}`} type="number" inputMode="numeric"
                      value={med.quantity <= 0 ? '' : med.quantity.toString()}
                      onChange={(e) => handleUpdateMedicineQuantityInReview(med.id, e.target.value.replace(/\D/g, ''))}
                      className="w-20 h-9 text-sm p-1" min="1"
                      aria-label={`Cantidad para ${med.name}`}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleRemoveMedicineFromReview(med.id)}
                      aria-label={`Eliminar ${med.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay medicamentos en esta receta.</p>
          )}

          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={() => finalizeAndRedirect("confirmed")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
              disabled={medicinesInPrescription.length === 0 || medicinesInPrescription.some(m => m.quantity <= 0)}
            >
              <CheckSquare className="mr-2 h-5 w-5" />
              Confirmar
            </Button>
            <Button
              onClick={() => finalizeAndRedirect("cancelled")}
              variant="destructive"
              className="w-full text-md py-3"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar
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

