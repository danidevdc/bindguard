
"use client";

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea'; // Replaced with Input
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, PackagePlus, CalendarIcon, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// import QrScanner from 'qr-scanner'; // Placeholder

export default function StockEntryForm() {
  const [medicineDetails, setMedicineDetails] = useState('');
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(undefined);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [clientNow, setClientNow] = useState<Date | null>(null);

  const { toast } = useToast();
  const { getCurrentUserUsername } = useAuth(); // Changed from getCurrentUser

  const [isScanningQR, setIsScanningQR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  // const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const today = new Date();
    setClientNow(today);
    setTransactionDate(today); // Default transaction date to current
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
          // Initialize QR Scanner library here if using one
          // qrScannerRef.current = new QrScanner(videoRef.current, result => handleQrScanSuccess(result.data), {
          //   highlightScanRegion: true,
          //   highlightCodeOutline: true,
          // });
          // qrScannerRef.current.start();
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
      // if (qrScannerRef.current) {
      //   qrScannerRef.current.stop();
      //   qrScannerRef.current.destroy();
      //   qrScannerRef.current = null;
      // }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    // return () => {
    //   if (qrScannerRef.current) {
    //     qrScannerRef.current.destroy();
    //     qrScannerRef.current = null;
    //   }
    // };
  }, [isScanningQR, toast]);
  
  // const handleQrScanSuccess = (data: string) => {
  //   setMedicineDetails(data);
  //   setIsScanningQR(false);
  //   toast({ title: "QR Escaneado", description: `Datos: ${data}`});
  // };

  const handleSubmitStockEntry = (event: FormEvent) => {
    event.preventDefault();
    if (!medicineDetails.trim() || !quantity.trim() || !transactionDate || !expirationDate) {
      toast({
        title: "Datos Incompletos",
        description: "Todos los campos son requeridos para añadir stock.",
        variant: "destructive",
      });
      return;
    }
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Cantidad Inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }
     if (clientNow && expirationDate <= clientNow) {
      toast({
        title: "Fecha de Expiración Inválida",
        description: "La fecha de expiración debe ser futura.",
        variant: "destructive"
      });
      return;
    }


    const currentUsername = getCurrentUserUsername(); // Use new method
    // Simulate data logging
    console.log('Simulating stock entry:', {
      date: transactionDate.toISOString().split('T')[0],
      rxNumber: `STK-${Date.now().toString().slice(-6)}`, // Auto-generate a stock ID
      quantity: quantityNum,
      medicineDetails: medicineDetails,
      expirationDate: expirationDate.toISOString().split('T')[0],
      type: 'stocked',
      userName: currentUsername || 'System', // Use username from auth
    });

    toast({
      title: "Stock Añadido Exitosamente",
      description: `${medicineDetails}, Cant: ${quantityNum}, Exp: ${format(expirationDate, "dd/MM/yy", {locale: es})}. Stock actualizado (simulado).`,
      variant: "default"
    });

    // Reset form
    setMedicineDetails('');
    setQuantity('');
    setTransactionDate(clientNow || new Date());
    setExpirationDate(undefined);
    setIsScanningQR(false);
  };

  const handleScanButtonClick = () => {
    setIsScanningQR(prev => !prev);
    if (!isScanningQR) {
      setMedicineDetails(''); // Clear details if opening camera
      setHasCameraPermission(null); // Reset permission status to re-check
    }
  };
  
  const handleSimulateScan = () => {
    const simulatedQRData = `Nuevo Lote Medicamento - ID: ${Math.random().toString(36).substring(2, 7).toUpperCase()}, Lote: L${Math.floor(Math.random() * 10000)}`;
    setMedicineDetails(simulatedQRData);
    setIsScanningQR(false); // Close camera after simulation
    toast({ title: "QR Escaneado (Simulado)", description: `Datos: ${simulatedQRData}`});
  };


  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center">
          <PackagePlus className="mr-2 h-7 w-7 text-primary" />
          Añadir Stock al Inventario
        </CardTitle>
        <CardDescription className="text-center">
          Escanea el QR del medicamento o ingresa los detalles, cantidad y fecha de expiración del lote.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitStockEntry} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transactionDateStock">Fecha de Transacción</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="transactionDateStock"
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
                  disabled={(date) => clientNow ? date > clientNow : false}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicineDetailsStock">Código QR / Identificación del Medicamento</Label>
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
                      Habilita los permisos de cámara para escanear.
                    </AlertDescription>
                  </Alert>
                )}
                 {hasCameraPermission === true && !medicineDetails && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">Apuntando cámara a un código QR...</p>
                )}
              </div>
            )}
             {!isScanningQR && medicineDetails && (
                <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200">
                    <p className="text-sm font-medium text-green-700">QR Escaneado (o simulado):</p>
                    <p className="text-sm text-green-600">{medicineDetails}</p>
                </div>
            )}
            <Input
              type="text"
              id="medicineDetailsStock"
              placeholder="O ingresa aquí el código/detalles del medicamento"
              value={medicineDetails}
              onChange={(e) => setMedicineDetails(e.target.value)}
              required
              className="mt-2"
              disabled={isScanningQR}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantityStock">Cantidad Recibida</Label>
             <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="quantityStock"
                    type="number"
                    inputMode="numeric"
                    placeholder="Ingresa cantidad"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="1"
                    className="pl-10"
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDateStock">Fecha de Expiración del Lote</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expirationDateStock"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  locale={es}
                  disabled={(date) => clientNow ? date <= clientNow : false} // Prevent selecting past or current dates
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
            <CheckCircle className="mr-2 h-5 w-5" />
            Registrar Entrada de Stock
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

