
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

  useEffect(() => {
    const today = new Date();
    setClientNow(today);
    if (!recipeDate && step === "identifyMedicine") { // Set initial recipe date only when entering identifyMedicine
      setRecipeDate(today);
    }
  }, [step, recipeDate]); // recipeDate dependency ensures it's not reset if already set

  useEffect(() => {
    if (isScanningQR) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acceso a Cámara Denegado',
            description: 'Por favor, habilita los permisos de cámara en tu navegador para escanear.',
          });
          setIsScanningQR(false);
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isScanningQR, toast]);

  useImperativeHandle(ref, () => ({
    navigateBackStep: () => {
      if (isScanningQR) {
        setIsScanningQR(false); 
        return true;
      }
      if (step === "reviewPrescription") {
        setStep("identifyMedicine");
        // Clear current scan/quantity fields but keep prescription list
        setCurrentScannedCode('');
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        setCurrentQuantity('');
        return true;
      }
      if (step === "enterQuantity") {
        setStep("identifyMedicine");
        // Keep currentScannedCode, identifiedMedicineName, identifiedMedicineCode
        // User might want to change date or re-verify, but not re-scan
        setCurrentQuantity('');
        return true;
      }
      if (step === "identifyMedicine") {
        setStep("enterPrescriptionNumber");
        // Clear all identification related state
        setCurrentScannedCode('');
        setIdentifiedMedicineName('');
        setIdentifiedMedicineCode('');
        // setRecipeDate(undefined); // Let useEffect handle setting default recipeDate
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
    // recipeDate is now set when entering identifyMedicine step via useEffect
    setStep("identifyMedicine");
  };

  const handleProceedToQuantity = () => {
    if (!currentScannedCode.trim() || !recipeDate) {
      toast({title: "Datos Incompletos", description: "Se requiere código de medicamento y fecha de receta.", variant: "destructive"});
      return;
    }
    setIdentifiedMedicineName(`Medicamento ${currentScannedCode.toUpperCase()}`); 
    setIdentifiedMedicineCode(currentScannedCode); 
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
    } else { 
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  };
  
  const handleSimulateScanForIdentification = () => {
    const simulatedQRData = `MED-QR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setCurrentScannedCode(simulatedQRData);
    toast({ title: "QR Simulado", description: `Código: ${simulatedQRData}`});
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
    if (currentQuantity.trim() && identifiedMedicineCode && identifiedMedicineName) {
        itemAddedSuccessfully = addCurrentMedicineToList();
        if (!itemAddedSuccessfully) return; 
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

  const handleUpdateMedicineQuantityInReview = (medicineId: string, newQuantityStr: string) => {
    if (newQuantityStr === "" || parseInt(newQuantityStr) <= 0) {
      setMedicinesInPrescription(prevMeds =>
        prevMeds.map(med => med.id === medicineId ? { ...med, quantity: 0 } : med) 
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
      prevMeds.map(med => med.id === medicineId ? { ...med, quantity: newQuantity } : med)
    );
  };

  const handleRemoveMedicineFromReview = (medicineId: string) => {
    setMedicinesInPrescription(prevMeds => prevMeds.filter(med => med.id !== medicineId));
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
        toast({ title: "Receta Confirmada", description: `Receta Nº ${prescriptionNumber} procesada.`, variant: "default" });
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
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                {hasCameraPermission === false && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                  </Alert>
                )}
                <Button type="button" variant="secondary" onClick={handleSimulateScanForIdentification} className="w-full mt-2">
                    Simular Escaneo
                </Button>
              </div>
            )}
          </div>

          <div className="relative flex items-center">
            <span className="flex-shrink px-3 text-muted-foreground">O</span>
            <div className="flex-grow border-t"></div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualCodeInput">Ingresa el código del medicamento</Label>
            <Input id="manualCodeInput" type="text" placeholder="Código del medicamento"
              value={currentScannedCode} onChange={(e) => setCurrentScannedCode(e.target.value)}
              disabled={isScanningQR}
            />
          </div>

          {currentScannedCode && (
            <Card className="bg-green-50 border-green-200 shadow-md mt-4">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-bold text-green-700">Medicamento Identificado (Simulado)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm space-y-1 text-green-600">
                <p><strong className="font-semibold">Nombre:</strong> Medicamento {currentScannedCode.toUpperCase()}</p>
                <p><strong className="font-semibold">Código:</strong> {currentScannedCode}</p>
              </CardContent>
              <CardFooter className="p-4 pt-2">
                 <Button
                    type="button"
                    onClick={handleProceedToQuantity}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                    disabled={!currentScannedCode.trim() || !recipeDate}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Correcto
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
                        recipeDate && "text-accent border-accent/70 hover:border-accent hover:bg-accent/5 focus:ring-accent"
                    )}>
                    <CalendarIcon className={cn("mr-2 h-4 w-4", recipeDate && "text-accent")} />
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
              Finalizar y Revisar Receta ({medicinesInPrescription.length} items)
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
              Agregar a Receta
            </Button>
            <Button 
                onClick={handleGoToReviewFromQuantity} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3"
                disabled={medicinesInPrescription.length === 0 && !currentQuantity.trim()}
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
            <p>Número de Receta: <strong className="text-foreground">{prescriptionNumber}</strong></p>
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
              Confirmar Receta
            </Button>
            <Button
              onClick={() => finalizeAndRedirect("cancelled")}
              variant="destructive"
              className="w-full text-md py-3"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar Receta
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
