
"use client";

import { useState, useEffect, type FormEvent, useRef }
from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Package, CheckCircle, AlertTriangle, ListPlus, Pill, ShoppingCart, CheckSquare, CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Placeholder for QR Scanner library
// import QrScanner from 'qr-scanner';

interface MedicineInPrescription {
  id: string; // simple unique id for the list
  details: string;
  quantity: number;
  transactionDate: string;
}

type ScanStep = "enterPrescriptionNumber" | "addMedicines" | "finalizePrescription";

export default function ScanForm() {
  const [step, setStep] = useState<ScanStep>("enterPrescriptionNumber");
  
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [currentMedicineDetails, setCurrentMedicineDetails] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(undefined);
  const [medicinesInPrescription, setMedicinesInPrescription] = useState<MedicineInPrescription[]>([]);
  const [clientNow, setClientNow] = useState<Date | null>(null);


  const { toast } = useToast();
  const { getCurrentUser } = useAuth();

  const [isScanningQR, setIsScanningQR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  // const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    setClientNow(new Date());
    setTransactionDate(new Date()); // Default to current date
  }, []);

  // Camera permission logic for QR scanning
  useEffect(() => {
    if (isScanningQR) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          // Initialize QR Scanner library here if using one
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
    setStep("addMedicines");
    toast({ title: "Receta Iniciada", description: `Procesando receta Nº: ${prescriptionNumber}` });
  };

  const handleAddMedicineToPrescription = () => {
    if (!currentMedicineDetails.trim() || !currentQuantity.trim()) {
      toast({
        title: "Datos Incompletos",
        description: "Ingresa los detalles del medicamento y la cantidad.",
        variant: "destructive",
      });
      return;
    }
    if (!transactionDate) {
      toast({
        title: "Fecha Requerida",
        description: "Por favor, selecciona una fecha de transacción.",
        variant: "destructive",
      });
      return;
    }
    const quantityNum = parseInt(currentQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Cantidad Inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    const newMedicineEntry: MedicineInPrescription = {
      id: Date.now().toString(), // simple unique id
      details: currentMedicineDetails,
      quantity: quantityNum,
      transactionDate: transactionDate.toISOString().split('T')[0],
    };
    setMedicinesInPrescription(prev => [...prev, newMedicineEntry]);

    const currentUser = getCurrentUser();
    console.log('Simulating inventory update (dispensing):', {
      date: transactionDate.toISOString().split('T')[0],
      prescriptionNumber: prescriptionNumber, 
      quantity: quantityNum,
      medicineDetails: currentMedicineDetails,
      mode: 'dispensing', 
      userName: currentUser || 'System',
    });
    toast({
      title: "Medicamento Añadido",
      description: `${currentMedicineDetails}, Cant: ${quantityNum} - añadido a la receta. Stock individual actualizado (simulado).`,
    });

    setCurrentMedicineDetails('');
    setCurrentQuantity('');
    setIsScanningQR(false); 
  };

  const handleFinalizePrescription = () => {
    if (medicinesInPrescription.length === 0) {
      toast({
        title: "Receta Vacía",
        description: "Añade al menos un medicamento antes de finalizar.",
        variant: "destructive",
      });
      return;
    }
    console.log("Prescription Finalized:", {
      prescriptionNumber,
      items: medicinesInPrescription,
      dispensedBy: getCurrentUser() || 'System',
      dispensedAt: new Date().toISOString(),
    });

    toast({
      title: "Receta Finalizada",
      description: `Receta Nº ${prescriptionNumber} con ${medicinesInPrescription.length} medicamento(s) ha sido procesada.`,
      variant: "default"
    });
    setStep("finalizePrescription"); 
  };
  
  const handleStartNewPrescription = () => {
    setPrescriptionNumber('');
    setCurrentMedicineDetails('');
    setCurrentQuantity('');
    setTransactionDate(clientNow || new Date()); // Reset date to current
    setMedicinesInPrescription([]);
    setStep("enterPrescriptionNumber");
  };

  const handleScanButtonClick = () => {
    setIsScanningQR(prev => !prev);
    if(!isScanningQR) {
        setCurrentMedicineDetails(''); 
        setHasCameraPermission(null); 
    }
  };

  const handleSimulateScan = () => {
    const simulatedQRData = `Medicamento Simulado QR - ID: ${Math.random().toString(36).substring(2, 7).toUpperCase()}, Lote: B${Math.floor(Math.random() * 1000)}`;
    setCurrentMedicineDetails(simulatedQRData);
    setIsScanningQR(false); 
    toast({ title: "QR Escaneado (Simulado)", description: `Datos: ${simulatedQRData}`});
  };


  if (step === "enterPrescriptionNumber") {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Ingresar Número de Receta
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa el número de la receta manual o impresa para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartPrescription} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prescriptionNumberInput">Número de Receta</Label>
              <Input
                id="prescriptionNumberInput"
                type="text"
                placeholder="Ej: 394192 o 2215946"
                value={prescriptionNumber}
                onChange={(e) => setPrescriptionNumber(e.target.value)}
                required
                className="text-lg p-3"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Iniciar Dispensación
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "addMedicines") {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center">
             <Pill className="mr-2 h-6 w-6 text-primary" />
            Añadir Medicamentos a Receta Nº {prescriptionNumber}
          </CardTitle>
          <CardDescription className="text-center">
            Escanea el QR de cada medicamento e ingresa la cantidad a dispensar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-muted/20 space-y-4">
            <h3 className="text-md font-semibold text-foreground">Registrar Medicamento Actual:</h3>
            
            <div className="space-y-2">
              <Label htmlFor="transactionDateDispense">Fecha de Transacción</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="transactionDateDispense"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={setTransactionDate}
                    initialFocus
                    locale={es}
                    disabled={(date) => clientNow ? date > clientNow : false} // Prevent selecting future dates
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Código QR / Identificación del Medicamento</Label>
              <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleScanButtonClick} className="flex-1 justify-start text-left font-normal">
                      <Camera className="mr-2 h-5 w-5" />
                      {isScanningQR ? 'Cerrar Cámara' : 'Escanear Código QR'}
                  </Button>
                  {isScanningQR && (
                      <Button type="button" variant="secondary" onClick={handleSimulateScan}>
                          Simular Escaneo
                      </Button>
                  )}
              </div>

              {isScanningQR && (
                <div className="mt-2 p-2 border rounded-md bg-muted/30">
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                      <AlertDescription>
                        Por favor, habilita los permisos de cámara en tu navegador para escanear.
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasCameraPermission === true && !currentMedicineDetails && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">Apuntando cámara a un código QR...</p>
                  )}
                </div>
              )}
              {!isScanningQR && currentMedicineDetails && (
                  <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200">
                      <p className="text-sm font-medium text-green-700">QR Escaneado (o simulado):</p>
                      <p className="text-sm text-green-600">{currentMedicineDetails}</p>
                  </div>
              )}

              <Textarea
                placeholder="O ingresa aquí los detalles del medicamento (Nombre, Dosis, Lote)"
                value={currentMedicineDetails}
                onChange={(e) => setCurrentMedicineDetails(e.target.value)}
                required
                className="mt-2 min-h-[60px]"
                disabled={isScanningQR}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantityInput">Cantidad a Dispensar</Label>
              <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="quantityInput"
                    type="number"
                    inputMode="numeric" 
                    placeholder="Ingresa cantidad"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    required
                    min="1"
                    className="pl-10"
                  />
              </div>
            </div>
            <Button type="button" onClick={handleAddMedicineToPrescription} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <ListPlus className="mr-2 h-5 w-5" />
              Añadir Medicamento a Receta
            </Button>
          </div>

          {medicinesInPrescription.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-md font-semibold text-foreground">Medicamentos en esta Receta (Nº {prescriptionNumber}):</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm bg-background p-3 rounded-md border max-h-48 overflow-y-auto">
                {medicinesInPrescription.map((med) => (
                  <li key={med.id}>
                    {med.details} - Cantidad: {med.quantity} (Fecha: {format(parseISO(med.transactionDate), "dd/MM/yy", {locale: es})})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Button type="button" onClick={handleFinalizePrescription} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3 mt-6">
            <CheckCircle className="mr-2 h-5 w-5" />
            Finalizar Receta
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (step === "finalizePrescription") {
     return (
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center">
            <CheckSquare className="mr-2 h-8 w-8 text-green-500" />
            Receta Finalizada
            </CardTitle>
          <CardDescription>
            La receta Nº <strong>{prescriptionNumber}</strong> con {medicinesInPrescription.length} tipo(s) de medicamento(s) ha sido procesada exitosamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {medicinesInPrescription.length > 0 && (
            <div className="mt-2 space-y-2">
              <h3 className="text-md font-semibold text-foreground text-center">Resumen de Medicamentos Dispensados:</h3>
              <ul className="list-none p-3 rounded-md border bg-muted/30 max-h-60 overflow-y-auto text-sm">
                {medicinesInPrescription.map((med) => (
                  <li key={med.id} className="py-1 border-b last:border-b-0">
                    <span className="font-medium">{med.details}</span> - Cantidad: {med.quantity} (Fecha: {format(parseISO(med.transactionDate), "dd/MM/yy", {locale: es})})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={handleStartNewPrescription} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
            Iniciar Nueva Receta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null; 
}

