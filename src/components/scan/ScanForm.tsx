
"use client";

import { useState, useEffect, type FormEvent, useRef }
from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, FileText, Package, CheckCircle, AlertTriangle, ListPlus, Pill, ShoppingCart, CheckSquare, CalendarIcon, Trash2, ScanLine, Hash, ClipboardList, ArrowRight, PlusCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface MedicineForPrescription {
  id: string; // Unique ID for list item
  name: string; // Name derived/simulated from code
  code: string; // Scanned or manually entered code
  quantity: number;
}

type ScanStep = 
  "enterPrescriptionNumber" | 
  "identifyMedicine" | 
  "confirmIdentifiedMedicine" | 
  "enterQuantity" | 
  "reviewPrescription";

export default function ScanForm() {
  const [step, setStep] = useState<ScanStep>("enterPrescriptionNumber");
  const router = useRouter();
  
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [recipeDate, setRecipeDate] = useState<Date | undefined>(undefined);
  
  const [currentScannedCode, setCurrentScannedCode] = useState('');
  const [identifiedMedicineName, setIdentifiedMedicineName] = useState(''); // Simulated
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
    if (!recipeDate) {
      setRecipeDate(today); 
    }
  }, []);
  
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

  // Step 0: Enter Prescription Number
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
    if (!recipeDate) { // Ensure recipeDate is set
        setRecipeDate(clientNow || new Date());
    }
    toast({ title: "Receta Iniciada", description: `Procesando receta Nº: ${prescriptionNumber}` });
  };

  // Step 1: Identify Medicine
  const handleIdentifyMedicine = () => {
    if (!currentScannedCode.trim()) {
      toast({title: "Código Requerido", description: "Escanea o ingresa el código del medicamento.", variant: "destructive"});
      return;
    }
    if (!recipeDate) {
      toast({title: "Fecha de Receta Requerida", description: "Selecciona la fecha de la receta.", variant: "destructive"});
      return;
    }
    // Simulate identification
    setIdentifiedMedicineName(`Medicamento ${currentScannedCode.toUpperCase()}`);
    setIdentifiedMedicineCode(currentScannedCode);
    setStep("confirmIdentifiedMedicine");
    setIsScanningQR(false); // Close camera if it was open
  };
  
  const handleScanButtonClick = () => {
    setIsScanningQR(prev => !prev);
    if(!isScanningQR) { // When opening camera
        setCurrentScannedCode(''); 
        setHasCameraPermission(null); 
    }
  };

  const handleSimulateScanForIdentification = () => {
    const simulatedQRData = `MED-QR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setCurrentScannedCode(simulatedQRData);
    setIsScanningQR(false); 
    toast({ title: "QR Simulado para Identificación", description: `Código: ${simulatedQRData}`});
  };

  // Step 2: Confirm Identified Medicine
  const handleConfirmMedicine = () => {
    setStep("enterQuantity");
  };

  // Step 3: Enter Quantity
  const handleAddMedicineToPrescriptionList = () => {
    if (!currentQuantity.trim()) {
      toast({ title: "Cantidad Requerida", description: "Ingresa la cantidad a dispensar.", variant: "destructive" });
      return;
    }
    const quantityNum = parseInt(currentQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número positivo.", variant: "destructive" });
      return;
    }

    const newMedicineEntry: MedicineForPrescription = {
      id: Date.now().toString(), 
      name: identifiedMedicineName,
      code: identifiedMedicineCode,
      quantity: quantityNum,
    };
    setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);
    
    // Log individual dispensing (simulation)
    console.log('Simulating inventory update (dispensing):', {
        date: recipeDate ? format(recipeDate, "yyyy-MM-dd") : 'N/A',
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

    // Reset for next medicine
    setCurrentScannedCode('');
    setIdentifiedMedicineName('');
    setIdentifiedMedicineCode('');
    setCurrentQuantity('');
    setStep("identifyMedicine"); // Go back to identify next medicine
  };

  const handleGoToReviewFromQuantity = () => {
    if (medicinesInPrescription.length === 0 && currentQuantity.trim()) {
        // If user entered quantity for the current med but didn't click "Add to Recipe" yet, add it first.
        const quantityNum = parseInt(currentQuantity);
        if (!isNaN(quantityNum) && quantityNum > 0) {
            const newMedicineEntry: MedicineForPrescription = {
                id: Date.now().toString(), name: identifiedMedicineName, code: identifiedMedicineCode, quantity: quantityNum,
            };
            setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);
             console.log('Simulating inventory update (dispensing) for last item before review:', {
                date: recipeDate ? format(recipeDate, "yyyy-MM-dd") : 'N/A', prescriptionNumber, quantity: quantityNum,
                medicineName: identifiedMedicineName, medicineCode: identifiedMedicineCode, userName: getCurrentUserUsername() || 'System',
            });
        } else {
            toast({ title: "Revisión", description: "Añade al menos un medicamento o completa la cantidad actual para finalizar.", variant: "destructive" });
            return;
        }
    } else if (medicinesInPrescription.length === 0) {
        toast({ title: "Receta Vacía", description: "Añade al menos un medicamento para finalizar.", variant: "destructive" });
        return;
    }
    setStep("reviewPrescription");
  };


  // Step 4: Review Prescription
  const handleUpdateMedicineQuantityInReview = (medicineId: string, newQuantityStr: string) => {
    if (newQuantityStr === "") { // Allow temporarily empty for typing
      setMedicinesInPrescription(prevMeds => 
        prevMeds.map(med => med.id === medicineId ? { ...med, quantity: 0 } : med) // Temp set to 0 or handle as invalid
      );
      return;
    }
    const newQuantity = parseInt(newQuantityStr);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      toast({ title: "Cantidad Inválida", description: "La cantidad debe ser un número positivo.", variant: "destructive" });
      // Optionally revert to old value or keep it empty for user to fix. For now, let's allow invalid state until blur/submit.
      setMedicinesInPrescription(prevMeds => 
        prevMeds.map(med => med.id === medicineId ? { ...med, quantity: isNaN(newQuantity) ? 0 : newQuantity } : med)
      );
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
            recipeDate: recipeDate ? format(recipeDate, "yyyy-MM-dd") : 'N/A',
            items: medicinesInPrescription,
            dispensedBy: getCurrentUserUsername() || 'System',
            finalizedAt: new Date().toISOString(),
        });
        toast({ title: "Receta Confirmada", description: `Receta Nº ${prescriptionNumber} procesada.`, variant: "default" });
    } else {
        toast({ title: "Receta Cancelada", description: `Receta Nº ${prescriptionNumber} ha sido cancelada.`, variant: "default" });
    }
    // Reset all state for a truly new prescription
    setPrescriptionNumber('');
    setRecipeDate(clientNow || new Date());
    setCurrentScannedCode('');
    setIdentifiedMedicineName('');
    setIdentifiedMedicineCode('');
    setCurrentQuantity('');
    setMedicinesInPrescription([]);
    // setStep("enterPrescriptionNumber"); // Not needed if redirecting
    router.push('/dashboard');
  };
  

  // Render logic based on step
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
                id="prescriptionNumberInput" type="text" placeholder="Nº"
                value={prescriptionNumber} onChange={(e) => setPrescriptionNumber(e.target.value)}
                required className="text-lg p-3"
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
            Identificar Medicamento (Receta Nº {prescriptionNumber})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="recipeDate">Fecha de la Receta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="recipeDate" variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !recipeDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recipeDate ? format(recipeDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={recipeDate} onSelect={setRecipeDate} initialFocus locale={es} disabled={(date) => clientNow ? date > clientNow : false} />
                </PopoverContent>
              </Popover>
          </div>

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
          <Button type="button" onClick={handleIdentifyMedicine} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <ArrowRight className="mr-2 h-5 w-5" />
            Siguiente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirmIdentifiedMedicine") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Confirmar Medicamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-2xl font-bold">{identifiedMedicineName}</p>
          <p className="text-md text-muted-foreground">Código: {identifiedMedicineCode}</p>
          <Button onClick={handleConfirmMedicine} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="mr-2 h-5 w-5" />
            Correcto
          </Button>
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
              value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)}
              required className="text-4xl h-20 p-4 text-center"
            />
          </div>
          <div className="space-y-3">
            <Button onClick={handleAddMedicineToPrescriptionList} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-md py-3">
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar a Receta (y escanear otro)
            </Button>
            <Button onClick={handleGoToReviewFromQuantity} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
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
          <div className="flex justify-between text-sm p-2 bg-muted/50 rounded-md">
            <span>Número de Receta: <strong>{prescriptionNumber}</strong></span>
            <span>Fecha: <strong>{recipeDate ? format(recipeDate, "dd/MM/yyyy", { locale: es }) : 'N/A'}</strong></span>
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
                      value={med.quantity <= 0 ? '' : med.quantity} // Show empty if invalid for user to correct
                      onChange={(e) => handleUpdateMedicineQuantityInReview(med.id, e.target.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Button onClick={() => finalizeAndRedirect("cancelled")} variant="destructive" className="text-md py-3">
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar Receta
            </Button>
            <Button onClick={() => finalizeAndRedirect("confirmed")} className="bg-green-600 hover:bg-green-700 text-white text-md py-3" disabled={medicinesInPrescription.length === 0 || medicinesInPrescription.some(m => m.quantity <= 0)}>
              <CheckSquare className="mr-2 h-5 w-5" />
              Confirmar Receta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null; 
}

    