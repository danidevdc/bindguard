
"use client";

import { useState, useEffect, type FormEvent, useRef, forwardRef, useImperativeHandle }
from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Camera, FileText, CheckCircle, AlertTriangle, Pill, ShoppingCart, CheckSquare, CalendarIcon, Trash2, ScanLine, Hash, ClipboardList, ArrowRight, PlusCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getStoredMedicines, type Medicine } from '@/lib/placeholder-data';
import QrScanner from 'qr-scanner';

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
  const [identifiedMedicineName, setIdentifiedMedicineName] = useState(''); 
  const [identifiedMedicineCode, setIdentifiedMedicineCode] = useState(''); 

  const [currentQuantity, setCurrentQuantity] = useState('');
  const [medicinesInPrescription, setMedicinesInPrescription] = useState<MedicineForPrescription[]>([]);

  const [clientNow, setClientNow] = useState<Date | null>(null);

  const { toast } = useToast();
  const { getCurrentUserUsername } = useAuth();

  const [isScanningQR, setIsScanningQR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);


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
  
  const handleQrScanSuccess = (result: QrScanner.ScanResult) => {
    const scannedData = result.data;
    console.log('QR Scanned Data:', scannedData);
    playBeep();
    setIsScanningQR(false); // This will trigger the useEffect cleanup

    let codeFromQR = '';
    let medicineNameFromQR = '';

    try {
        const parsedData = JSON.parse(scannedData);
        if (parsedData && typeof parsedData.id === 'string') {
            codeFromQR = parsedData.id;
            if (typeof parsedData.nombre === 'string') {
                medicineNameFromQR = parsedData.nombre;
            }
        } else {
            codeFromQR = scannedData;
        }
    } catch (e) {
        codeFromQR = scannedData;
        console.warn('QR data is not a JSON or does not have an id field. Treating as raw ID.', e);
    }

    if (codeFromQR) {
        setCurrentScannedCode(codeFromQR);
        toast({
            title: "QR Detectado",
            description: medicineNameFromQR 
                         ? `Medicamento: ${medicineNameFromQR} (Código: ${codeFromQR}). Verifica y continúa.`
                         : `Código: ${codeFromQR}. Verifica y continúa.`
        });
    } else {
        toast({
            title: "QR Inválido",
            description: "No se pudo extraer un código del QR escaneado.",
            variant: "destructive",
        });
    }
  };

  const handleQrScanError = (error: Error | string) => {
    console.error('QR Scan Error:', error);
     if (typeof error === 'object' && error !== null && 'message' in error) {
        if ((error as Error).message === 'No QR code found') {
            // console.log('No QR code found in this frame.');
            return; // Don't toast for "no QR code found"
        }
    } else if (typeof error === 'string' && error === 'No QR code found') {
        // console.log('No QR code found in this frame.');
        return; 
    }
    
    toast({
        title: "Error de Escaneo QR",
        description: typeof error === 'string' ? error : (error as Error).message,
        variant: "destructive",
    });
  };

  useEffect(() => {
    if (isScanningQR) {
      const startScanner = async () => {
        if (!videoRef.current) {
          console.log("Video ref not available yet");
          return;
        }

        if (qrScannerRef.current) {
            console.log("Stopping existing scanner instance.");
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }

        try {
          let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(e => console.error("Video play failed:", e));

          console.log("Initializing QrScanner with environment camera.");
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            handleQrScanSuccess,
            {
              onDecodeError: handleQrScanError,
              preferredCamera: "environment",
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          await qrScannerRef.current.start();
          console.log("QrScanner started with environment camera.");
        } catch (error: any) {
          console.error('Error accessing environment camera or starting scanner:', error);
          try { 
            console.log("Attempting fallback to user-facing camera.");
            let fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                await videoRef.current.play().catch(e => console.error("Fallback video play failed:", e));
                
                console.log("Initializing QrScanner with fallback camera.");
                qrScannerRef.current = new QrScanner(
                    videoRef.current,
                    handleQrScanSuccess,
                    {
                        onDecodeError: handleQrScanError,
                        preferredCamera: "user",
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                    }
                );
                await qrScannerRef.current.start();
                console.log("QrScanner started with fallback camera.");
            }
          } catch (fallbackError: any) {
             console.error('Fallback camera access error:', fallbackError);
             setHasCameraPermission(false);
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
    } else {
      if (qrScannerRef.current) {
        console.log("Stopping and destroying QrScanner instance.");
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log("Video stream stopped and cleared.");
      }
    }

    return () => { 
      if (qrScannerRef.current) {
        console.log("Cleaning up QrScanner instance on unmount/effect change.");
        qrScannerRef.current.destroy(); // Use destroy for full cleanup
        qrScannerRef.current = null;
      }
       if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isScanningQR]);


  useImperativeHandle(ref, () => ({
    navigateBackStep: () => {
      if (isScanningQR) {
        setIsScanningQR(false);
        return true;
      }
      if (step === "reviewPrescription") {
        setStep("identifyMedicine");
        return true;
      }
      if (step === "enterQuantity") {
        setIdentifiedMedicineName(''); 
        setIdentifiedMedicineCode('');
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

  const verifyAndPrepareMedicine = (codeToVerifyRaw: string) => {
    const codeToVerify = codeToVerifyRaw.trim().toUpperCase();

    if (!codeToVerify) {
        toast({ title: "Error", description: "No hay código de medicamento para verificar.", variant: "destructive" });
        return;
    }
    if (!recipeDate) {
        toast({ title: "Fecha de Receta Requerida", description: "Por favor, selecciona una fecha para la receta.", variant: "destructive"});
        return;
    }

    const allUserMedicines = getStoredMedicines();
    const foundMedicine = allUserMedicines.find(med => med.id.toUpperCase() === codeToVerify);

    if (!foundMedicine) {
        toast({ title: "Medicamento No Encontrado", description: `El medicamento con código "${codeToVerifyRaw}" no existe en la base de datos.`, variant: "destructive" });
        setCurrentScannedCode(''); 
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        return;
    }

    const isDuplicateInPrescription = medicinesInPrescription.some(
        med => med.code.toUpperCase() === foundMedicine.id.toUpperCase()
    );

    if (isDuplicateInPrescription) {
        toast({ title: "Medicamento Duplicado", description: `${foundMedicine.name} ya ha sido añadido a esta receta. No se puede agregar de nuevo.`, variant: "destructive" });
        setCurrentScannedCode('');
        setIdentifiedMedicineName(''); 
        setIdentifiedMedicineCode('');
        return; 
    }

    setIdentifiedMedicineName(foundMedicine.name);
    setIdentifiedMedicineCode(foundMedicine.id);
    setStep("enterQuantity");
    setIsScanningQR(false); 
};


  const handleScanButtonClick = () => {
    setIsScanningQR(prev => !prev);
    if(!isScanningQR) { 
        setCurrentScannedCode('');
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        setHasCameraPermission(null);
    }
  };

  const handleSimulateScanForIdentification = () => {
    const allUserMedicines = getStoredMedicines();
    if (allUserMedicines.length === 0) {
        toast({ title: "Error de Simulación", description: "No hay medicamentos en la base de datos para simular.", variant: "destructive"});
        setIsScanningQR(false);
        return;
    }
    const randomMedicine = allUserMedicines[Math.floor(Math.random() * allUserMedicines.length)];
    
    const qrDataContent = randomMedicine.id; 

    if (qrDataContent) {
        const foundMedicine = allUserMedicines.find(med => med.id.toUpperCase() === qrDataContent.toUpperCase());
        if (foundMedicine) {
            playBeep();
            setCurrentScannedCode(foundMedicine.id); 
            setIsScanningQR(false); 
            setIdentifiedMedicineName(''); 
            setIdentifiedMedicineCode(''); 
            toast({ title: "QR Detectado (Simulado)", description: `${foundMedicine.name}. Verifica y continúa.`});
        } else {
            toast({ title: "Error de Simulación", description: "Medicamento simulado no encontrado.", variant: "destructive"});
            setIsScanningQR(false);
        }
    } else {
        toast({ title: "Error de Simulación", description: "No se pudo generar datos para el QR simulado.", variant: "destructive"});
        setIsScanningQR(false);
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
    
    if (medicinesInPrescription.some(med => med.code.toUpperCase() === identifiedMedicineCode.toUpperCase())) {
        toast({ title: "Error", description: `${identifiedMedicineName} ya está en la receta.`, variant: "destructive" });
        return false;
    }

    const newMedicineEntry: MedicineForPrescription = {
      id: Date.now().toString(), 
      name: identifiedMedicineName,
      code: identifiedMedicineCode, 
      quantity: quantityNum,
    };
    setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);

    console.log('Simulating inventory update (dispensing):', {
        date: recipeDate ? format(recipeDate, "yyyy-MM-dd", { locale: es }) : 'N/A',
        prescriptionNumber: prescriptionNumber,
        quantity: quantityNum,
        medicineName: identifiedMedicineName,
        medicineCode: identifiedMedicineCode, 
        mode: 'dispensing',
        userName: getCurrentUserUsername() || 'System',
    });
    toast({
      title: "Medicamento Añadido a Receta",
      description: `${identifiedMedicineName} (Cód: ${identifiedMedicineCode}), Cant: ${quantityNum}.`,
    });
    return true;
  };

  const handleAddMedicineAndContinueScanning = () => {
    if (addCurrentMedicineToList()) {
      setCurrentScannedCode('');
      setIdentifiedMedicineName('');
      setIdentifiedMedicineCode('');
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
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        setCurrentQuantity('');
        setStep("reviewPrescription");
    } else { 
        toast({ title: "Receta Vacía", description: "Añade al menos un medicamento para finalizar.", variant: "destructive" });
    }
  };

  const handleGoToReviewFromIdentify = () => {
    if (medicinesInPrescription.length > 0) {
      setCurrentScannedCode('');
      setIdentifiedMedicineName('');
      setIdentifiedMedicineCode('');
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

  const finalizeAndRedirect = (action: "confirmed" | "cancelled") => {
    if (action === "confirmed") {
        if (medicinesInPrescription.some(med => med.quantity <= 0)) {
            toast({ title: "Cantidades Inválidas", description: "Asegúrate que todos los medicamentos tengan una cantidad válida (mayor a 0).", variant: "destructive" });
            return;
        }
        console.log("Prescription Confirmed:", {
            prescriptionNumber,
            recipeDate: recipeDate ? format(recipeDate, "yyyy-MM-dd", { locale: es }) : 'N/A',
            items: medicinesInPrescription,
            dispensedBy: getCurrentUserUsername() || 'System',
            finalizedAt: new Date().toISOString(),
        });
        toast({ title: "Receta Confirmada", description: `Receta Nº ${prescriptionNumber} procesada (simulado).`, variant: "default" });
    } else {
        toast({ title: "Receta Cancelada", description: `Receta Nº ${prescriptionNumber} ha sido cancelada.`, variant: "default" });
    }

    setPrescriptionNumber('');
    setRecipeDate(clientNow || new Date());
    setCurrentScannedCode('');
    setIdentifiedMedicineName('');
    setIdentifiedMedicineCode('');
    setCurrentQuantity('');
    setMedicinesInPrescription([]);
    setIsScanningQR(false);
    setHasCameraPermission(null);
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
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center">
            <ScanLine className="mr-2 h-6 w-6 text-primary" />
            Receta Nº {prescriptionNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button type="button" variant="outline" onClick={handleScanButtonClick} className="w-full h-24 text-lg">
                <Camera className="mr-3 h-8 w-8" />
                {isScanningQR ? 'Cerrar Cámara' : 'Escanear Código QR'}
            </Button>

            {isScanningQR && (
              <div className="mt-2 p-2 border rounded-md bg-muted/30">
                <video ref={videoRef} className="w-full aspect-square rounded-md bg-black" autoPlay playsInline muted />
                {hasCameraPermission === false && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                     <AlertDescription>Habilita los permisos de cámara para escanear.</AlertDescription>
                  </Alert>
                )}
                 {hasCameraPermission === true && !currentScannedCode && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">Apuntando cámara a un código QR...</p>
                )}
              </div>
            )}
          </div>
          
          <Button type="button" variant="secondary" onClick={handleSimulateScanForIdentification} className="w-full mt-2">
                Simular Escaneo (Medicamento Existente)
          </Button>


          <div className="relative flex items-center">
            <span className="flex-shrink px-3 text-muted-foreground">O</span>
            <div className="flex-grow border-t"></div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualCodeInput">Ingresa el código del medicamento</Label>
            <Input id="manualCodeInput" type="text" placeholder="Código del medicamento (Ej: MED001)"
              value={currentScannedCode} onChange={(e) => setCurrentScannedCode(e.target.value)}
              disabled={isScanningQR}
            />
          </div>

          {currentScannedCode && (
            <Card className="bg-muted/30 border-border shadow-sm mt-4">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">Verificar Código</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm space-y-1 text-foreground">
                <p><strong className="font-semibold">Código a Verificar:</strong> {currentScannedCode}</p>
              </CardContent>
              <CardFooter className="p-4 pt-2">
                 <Button
                    type="button"
                    onClick={() => verifyAndPrepareMedicine(currentScannedCode)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                    disabled={!currentScannedCode.trim() || !recipeDate}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Verificar y Continuar
                  </Button>
              </CardFooter>
            </Card>
          )}

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
    );
  }

  if (step === "enterQuantity") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-bold">{identifiedMedicineName}</CardTitle>
          <CardDescription>Código: {identifiedMedicineCode}</CardDescription>
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
            />
          </div>
          <div className="space-y-3">
            <Button onClick={handleAddMedicineAndContinueScanning} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-md py-3">
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar y Escanear Otro
            </Button>
            <Button
                onClick={handleGoToReviewFromQuantity}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                disabled={medicinesInPrescription.length === 0 && (!currentQuantity.trim() || parseInt(currentQuantity) <= 0)}
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

