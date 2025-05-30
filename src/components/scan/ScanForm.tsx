
"use client";

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CalendarIcon, FileText, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

// Placeholder for QR Scanner library if you integrate one
// import QrScanner from 'qr-scanner'; 

export default function ScanForm() {
  const [date, setDate] = useState<Date | undefined>(undefined); // Initialized to undefined
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [medicineDetails, setMedicineDetails] = useState(''); // Stores QR data or manual input
  const [mode, setMode] = useState<'dispensing' | 'stocking'>('dispensing');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();
  const { getCurrentUser } = useAuth();

  // QR Scanner state (simulated for now)
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  // const qrScannerRef = useRef<QrScanner | null>(null);


  useEffect(() => {
    // Pre-fill date on component mount (client-side only)
    setDate(new Date());
  }, []);

  // Camera permission logic
   useEffect(() => {
    if (isScanning) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          // Initialize QR Scanner here if using a library
          // For example:
          // if (videoRef.current) {
          //   qrScannerRef.current = new QrScanner(videoRef.current, result => {
          //     console.log('decoded qr code:', result);
          //     setMedicineDetails(result.data);
          //     setIsScanning(false); // Stop scanning after a successful scan
          //     toast({ title: "QR Scanned", description: `Data: ${result.data}`});
          //   }, { highlightScanRegion: true, highlightCodeOutline: true });
          //   qrScannerRef.current.start();
          // }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to scan QR codes.',
          });
          setIsScanning(false); // Stop scanning if permission denied
        }
      };
      getCameraPermission();
    } else {
      // Stop camera when not scanning
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      // if (qrScannerRef.current) {
      //   qrScannerRef.current.stop();
      //   qrScannerRef.current.destroy();
      //   qrScannerRef.current = null;
      // }
      // Do not reset hasCameraPermission here to keep showing the alert if denied.
      // It will be re-evaluated if scanning is attempted again.
    }

    // Cleanup function
    // return () => {
    //   if (qrScannerRef.current) {
    //     qrScannerRef.current.destroy();
    //   }
    //   // Ensure camera is released if component unmounts while scanning
    //   if (videoRef.current && videoRef.current.srcObject) {
    //     const stream = videoRef.current.srcObject as MediaStream;
    //     stream.getTracks().forEach(track => track.stop());
    //   }
    // };
  }, [isScanning, toast]);


  const handleScanButtonClick = () => {
    setIsScanning(prev => !prev);
    if(!isScanning) { // If we are about to start scanning
        setMedicineDetails(''); // Clear previous details
        setHasCameraPermission(null); // Reset camera permission status to re-evaluate
    }
  };
  
  // Simulate QR scan result for demo
  const handleSimulateScan = () => {
    const simulatedQRData = `Simulated Medicine QR - ID: ${Math.random().toString(36).substring(7).toUpperCase()}, Batch: B${Math.floor(Math.random() * 1000)}`;
    setMedicineDetails(simulatedQRData);
    setIsScanning(false); // Turn off camera view after simulation
    toast({ title: "QR Scanned (Simulated)", description: `Data: ${simulatedQRData}`});
  };


  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!date || !prescriptionNumber || !quantity || !medicineDetails) {
      toast({
        title: "Formulario Incompleto",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    if (mode === 'stocking' && !expirationDate) {
      toast({
        title: "Formulario Incompleto",
        description: "La fecha de expiración es requerida para el abastecimiento.",
        variant: "destructive",
      });
      return;
    }

    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      toast({
        title: "Cantidad Inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    const currentUser = getCurrentUser();

    const formData: any = {
      date: format(date, 'yyyy-MM-dd'),
      prescriptionNumber,
      quantity: numericQuantity,
      medicineDetails, // This comes from QR scan or manual input
      mode,
      userName: currentUser || 'System',
    };

    if (mode === 'stocking' && expirationDate) {
      formData.expirationDate = format(expirationDate, 'yyyy-MM-dd');
    }

    console.log('Form Data Submitted:', formData);
    // Here you would typically send formData to your backend/Google Sheet
    toast({
      title: "Entrada Registrada",
      description: `Medicamento ${mode === 'dispensing' ? 'dispensado' : 'abastecido'}: ${medicineDetails}, Cant: ${numericQuantity}. Registrado por: ${formData.userName}.`,
    });

    // Optionally reset form fields
    // setDate(new Date()); 
    // setPrescriptionNumber('');
    // setQuantity('');
    // setMedicineDetails('');
    // setExpirationDate(undefined);
    // setMode('dispensing');
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">Registrar Transacción de Medicamento</CardTitle>
        <CardDescription className="text-center">Escanea QR o ingresa los detalles manualmente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Código QR / Identificación del Medicamento</Label>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleScanButtonClick} className="flex-1 justify-start text-left font-normal">
                    <Camera className="mr-2 h-5 w-5" />
                    {isScanning ? 'Cerrar Cámara' : 'Escanear Código QR'}
                </Button>
                 {isScanning && ( // Show simulate button only when camera is active for testing
                    <Button type="button" variant="secondary" onClick={handleSimulateScan}>
                        Simular Escaneo
                    </Button>
                )}
            </div>

            {isScanning && (
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
                 {hasCameraPermission === true && !medicineDetails && (
                     <p className="text-sm text-muted-foreground mt-2 text-center">Apuntando cámara a un código QR...</p>
                 )}
              </div>
            )}
             {!isScanning && medicineDetails && (
                 <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200">
                    <p className="text-sm font-medium text-green-700">QR Escaneado (o simulado):</p>
                    <p className="text-sm text-green-600">{medicineDetails}</p>
                 </div>
             )}

            <Textarea
              placeholder="Si no escaneas, ingresa aquí los detalles del medicamento (ej: Nombre, Dosis, Lote)"
              value={medicineDetails}
              onChange={(e) => setMedicineDetails(e.target.value)}
              required
              className="mt-2 min-h-[80px]"
              disabled={isScanning} // Disable if camera is active and expecting QR input
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Transacción</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={es} // Add locale to calendar
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Tipo de Transacción</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value: 'dispensing' | 'stocking') => {
                  setMode(value);
                  if (value === 'dispensing') setExpirationDate(undefined); // Clear expiration if switching to dispensing
                }}
                className="flex space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dispensing" id="dispensing" />
                  <Label htmlFor="dispensing">Dispensar (Salida)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stocking" id="stocking" />
                  <Label htmlFor="stocking">Abastecer (Entrada)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {mode === 'stocking' && (
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de Expiración del Lote</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP", { locale: es }) : <span>Elige fecha de expiración</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expirationDate}
                    onSelect={setExpirationDate}
                    initialFocus
                    disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                    locale={es} // Add locale to calendar
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rxNumber">{mode === 'dispensing' ? 'Nº de Receta' : 'ID de Lote/Stock'}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="rxNumber"
                  type="text"
                  placeholder={mode === 'dispensing' ? "ej: RX12345" : "ej: LOTE001"}
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
               <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Ingresa cantidad"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="1"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <CheckCircle className="mr-2 h-5 w-5" />
            Registrar Transacción
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

