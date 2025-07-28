
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PillBottle, Save, ShieldAlert, UploadCloud, CalendarIcon as CalendarIconLucide, Info, Camera, RefreshCw, Loader2, ScanSearch, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { type Medicine, type DispensingRecord, getMedicineByIdFromFirestore, createCompleteMedicineInFirestore } from '@/lib/medicineService';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { parseISO, isValid, format as formatDate } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';
import { extractLabel, type ExtractLabelOutput } from '@/ai/flows/extract-label-flow';


interface MedicineJsonFormat {
  id?: string;
  name?: string;
  presentation?: string;
  initialStock?: number | string;
  expirationDate?: string; // Expects YYYY-MM-DD
}

type AiScanStep = 'idle' | 'camera' | 'preview' | 'loading' | 'results' | 'error';


export default function AddMedicinePage() {
  const { isCurrentUserAdmin, isLoading: authLoading, getCurrentUserUsername } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const [formattedClientNow, setFormattedClientNow] = useState<string>('');

  const [medicineId, setMedicineId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [presentation, setPresentation] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [jsonExpirationDate, setJsonExpirationDate] = useState<string | undefined>(undefined);
  const [manualExpirationDate, setManualExpirationDate] = useState<Date | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for AI Scan
  const [aiScanStep, setAiScanStep] = useState<AiScanStep>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractLabelOutput | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const now = new Date();
    setClientNow(now);
    setFormattedClientNow(formatDate(now, "PPP", { locale: es }));

    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta página.',
        variant: 'destructive',
      });
      router.replace('/dashboard');
    }
  }, [isCurrentUserAdmin, authLoading, router, toast]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setAiErrorMessage("No se pudo acceder a la cámara. Revisa los permisos.");
      setAiScanStep('error');
    }
  }, []);

  useEffect(() => {
    if (aiScanStep === 'camera') {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [aiScanStep, startCamera]);


  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageSrc(dataUrl);
      setAiScanStep('preview');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleProcessLabel = async () => {
    if (!imageSrc) return;
    setAiScanStep('loading');
    setAiErrorMessage(null);
    try {
      const result = await extractLabel({ photoDataUri: imageSrc });
      setExtractedData(result);
      setAiScanStep('results');
      toast({
        title: "Etiqueta Analizada",
        description: "Verifica la información extraída por la IA.",
        variant: 'success'
      });
    } catch (error: any) {
      console.error("Error processing label:", error);
      setAiErrorMessage(error.message || "Ocurrió un error al procesar la etiqueta.");
      setAiScanStep('error');
    }
  };

  const handleUseExtractedData = () => {
    if (extractedData) {
      setMedicineId(extractedData.id || '');
      setMedicineName(extractedData.name || '');
      setPresentation(extractedData.presentation || '');
    }
    resetAiScan();
  };
  
  const resetAiScan = () => {
    setAiScanStep('idle');
    setImageSrc(null);
    setExtractedData(null);
    setAiErrorMessage(null);
  };

  const handleJsonFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      toast({
        title: 'Archivo Inválido',
        description: 'Por favor, selecciona un archivo JSON.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Error al leer el archivo.');
        }
        const jsonData = JSON.parse(text) as MedicineJsonFormat;

        let stockValue = '';
        if (jsonData.initialStock !== undefined) {
            if (typeof jsonData.initialStock === 'number') {
                stockValue = jsonData.initialStock.toString();
            } else if (typeof jsonData.initialStock === 'string') {
                stockValue = jsonData.initialStock;
            }
        }

        setMedicineId(jsonData.id?.toUpperCase() || '');
        setMedicineName(jsonData.name || '');
        setPresentation(jsonData.presentation || '');
        setInitialStock(stockValue);
        setManualExpirationDate(undefined); 
        
        if (jsonData.expirationDate) {
          const parsedDate = parseISO(jsonData.expirationDate);
          if (isValid(parsedDate)) {
            setJsonExpirationDate(jsonData.expirationDate);
            if (clientNow && parsedDate < new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate())) {
                toast({
                    title: 'Fecha de Expiración JSON en el Pasado',
                    description: 'La fecha de expiración del JSON es pasada. Por favor, elija una fecha futura o ajuste el JSON.',
                    variant: 'destructive'
                });
                setJsonExpirationDate(undefined); 
            }
          } else {
            toast({
              title: 'Fecha de Expiración Inválida en JSON',
              description: 'El formato de expirationDate debe ser YYYY-MM-DD. Se ignorará este campo.',
              variant: 'destructive',
            });
            setJsonExpirationDate(undefined);
          }
        } else {
          setJsonExpirationDate(undefined);
        }

        toast({
          title: 'JSON Cargado',
          description: 'Formulario rellenado con los datos del archivo JSON.',
          variant: 'success'
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast({
          title: 'Error al Procesar JSON',
          description: 'El archivo JSON no es válido o no tiene el formato esperado.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast({
        title: 'Error de Lectura',
        description: 'No se pudo leer el archivo seleccionado.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const stockNum = initialStock.trim() === '' ? 0 : parseInt(initialStock);
    const currentId = medicineId.trim().toUpperCase();
    const currentName = medicineName.trim();
    const currentPresentation = presentation.trim();

    if (!currentId || !currentName || !currentPresentation) {
      toast({
        title: 'Campos Incompletos',
        description: 'Código, Nombre y Presentación son requeridos.',
        variant: 'destructive',
      });
      return;
    }

    if (initialStock.trim() !== '' && (isNaN(stockNum) || stockNum < 0)) {
       toast({
        title: 'Stock Inválido',
        description: 'El stock inicial debe ser un número positivo o cero.',
        variant: 'destructive',
      });
      return;
    }
    
    let finalExpirationJsDate: Date | undefined = undefined;
    const todayAtMidnight = clientNow ? new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate()) : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    if (manualExpirationDate) {
        if (manualExpirationDate <= todayAtMidnight) {
            toast({
                title: 'Fecha de Expiración Manual Inválida',
                description: 'La fecha de expiración manual debe ser futura.',
                variant: 'destructive',
            });
            return;
        }
        finalExpirationJsDate = manualExpirationDate;
    } else if (jsonExpirationDate) {
        const parsedJsonDate = parseISO(jsonExpirationDate);
         if (parsedJsonDate <= todayAtMidnight) {
             toast({
                title: 'Fecha de Expiración JSON Inválida',
                description: 'La fecha de expiración del JSON debe ser futura.',
                variant: 'destructive',
            });
            return;
        }
        finalExpirationJsDate = parsedJsonDate;
    }


    if (stockNum > 0 && !finalExpirationJsDate) {
        toast({
            title: 'Fecha de Expiración Requerida',
            description: 'Si ingresas stock inicial, debes proporcionar una fecha de expiración válida y futura (manual o JSON).',
            variant: 'destructive',
        });
        return;
    }

    try {
        const existingMedicine = await getMedicineByIdFromFirestore(currentId);
        if (existingMedicine) {
          toast({
            title: 'Código Duplicado',
            description: `Ya existe un medicamento con el Código: ${currentId}.`,
            variant: 'destructive',
          });
          return;
        }
        
        const newDispensingHistory: DispensingRecord[] = [];
        if (stockNum > 0 && finalExpirationJsDate) {
          newDispensingHistory.push({
            id: `stock_init_${currentId}_${Date.now()}`,
            date: Timestamp.fromDate(new Date()), 
            rxNumber: 'STOCK-INICIAL',
            quantity: stockNum,
            type: 'stocked',
            userName: getCurrentUserUsername() || 'admin.admin',
            expirationDate: Timestamp.fromDate(finalExpirationJsDate),
          });
        }

        const newMedicine: Medicine = {
          id: currentId,
          name: currentName,
          presentation: currentPresentation,
          description: '', 
          currentStock: stockNum,
          lastUpdated: serverTimestamp() as Timestamp,
          dispensingHistory: newDispensingHistory,
          isBlocked: false,
        };

        await createCompleteMedicineInFirestore(newMedicine);

        toast({
          title: 'Medicamento Registrado',
          description: `${newMedicine.name} (Código: ${newMedicine.id}) ha sido añadido con stock inicial ${newMedicine.currentStock}.`,
          variant: 'success'
        });

        setMedicineId('');
        setMedicineName('');
        setPresentation('');
        setInitialStock('');
        setJsonExpirationDate(undefined);
        setManualExpirationDate(undefined);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    } catch (error) {
        console.error("Error guardando medicamento en Firestore:", error);
        toast({
            title: 'Error al Guardar',
            description: `No se pudo guardar el medicamento. ${error instanceof Error ? error.message : 'Error desconocido.'}`,
            variant: 'destructive',
        });
    }
  };


  if (authLoading || !isCurrentUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <AuthWrapper>
      <Dialog open={aiScanStep !== 'idle'} onOpenChange={(isOpen) => !isOpen && resetAiScan()}>
        <div className="mb-6">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/admin')}
            aria-label="Volver al Panel de Admin"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="text-center">
              <PillBottle className="h-12 w-12 mx-auto text-primary mb-3" />
              <CardTitle className="text-2xl md:text-3xl font-semibold text-foreground">
                Añadir Medicamento
              </CardTitle>
              <CardDescription>
                Ingresa los detalles del medicamento o usa una de las herramientas automáticas. El Código debe ser único.
              </CardDescription>
              {formattedClientNow && (
                   <Alert variant="default" className="mt-4 text-sm bg-accent/10 border-accent/30">
                      <Info className="h-5 w-5 text-accent" />
                      <AlertTitle className="text-accent font-semibold">Fecha Actual del Sistema</AlertTitle>
                      <AlertDescription className="text-accent/90">
                          Hoy es: {formattedClientNow}. Los registros usarán esta fecha.
                      </AlertDescription>
                  </Alert>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                 <Label className="text-base font-medium">Escanear Etiqueta con IA</Label>
                 <Button type="button" variant="outline" onClick={() => setAiScanStep('camera')} className="w-full">
                    <Camera className="mr-2 h-5 w-5" /> Escanear Etiqueta
                 </Button>
              </div>
              <Separator className="my-6" />
              <div className="space-y-4 mb-6">
                <Label htmlFor="jsonUpload" className="text-base font-medium">Cargar desde JSON</Label>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow"
                  >
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Seleccionar Archivo JSON
                  </Button>
                  <Input
                    id="jsonUpload"
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                </div>
                 <p className="text-xs text-muted-foreground">
                  El JSON puede tener: `id`, `name`, `presentation`, `initialStock` (número/string), y `expirationDate` (string YYYY-MM-DD). El Código debe ser único.
                </p>
              </div>
              <Separator className="my-6" />
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="medicineId">Código del Medicamento (Único)</Label>
                  <Input
                    id="medicineId"
                    type="text"
                    placeholder="Ej: A0205 (será convertido a mayúsculas)"
                    value={medicineId}
                    onChange={(e) => setMedicineId(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicineName">Nombre del Medicamento</Label>
                  <Input
                    id="medicineName"
                    type="text"
                    placeholder="Ej: Omeprazol 40mg/ml"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presentation">Presentación</Label>
                  <Input
                    id="presentation"
                    type="text"
                    placeholder="Ej: Inyectable, Comprimidos, Jarabe"
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Stock Inicial (Opcional)</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    inputMode="numeric"
                    placeholder="Ej: 1000 (o dejar vacío para 0)"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    min="0"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualExpirationDate">Fecha de Expiración del Stock Inicial (Opcional)</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          id="manualExpirationDate"
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal",
                              !manualExpirationDate && "text-muted-foreground"
                          )}
                          >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          {manualExpirationDate ? formatDate(manualExpirationDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                          mode="single"
                          selected={manualExpirationDate}
                          onSelect={setManualExpirationDate}
                          initialFocus
                          locale={es}
                          disabled={(date) => {
                              const todayAtMidnightCal = clientNow ? new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate()) : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                              return date <= todayAtMidnightCal;
                          }}
                          />
                      </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Requerida si ingresas stock inicial. La fecha del JSON (si existe y es válida) se usa si este campo está vacío. Debe ser futura.
                  </p>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="mr-2 h-5 w-5" />
                  Guardar Medicamento
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <DialogContent>
            {aiScanStep === 'camera' && (
                <>
                <DialogHeader>
                    <DialogTitle>Escanear Etiqueta</DialogTitle>
                    <DialogDescription>Apunta la cámara a la etiqueta del medicamento.</DialogDescription>
                </DialogHeader>
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                <DialogFooter>
                    <Button type="button" onClick={handleTakePhoto}><Camera className="mr-2 h-4 w-4" /> Tomar Foto</Button>
                </DialogFooter>
                </>
            )}
            {aiScanStep === 'preview' && (
                <>
                <DialogHeader>
                    <DialogTitle>Verificar Foto</DialogTitle>
                    <DialogDescription>¿La imagen es clara y legible?</DialogDescription>
                </DialogHeader>
                {imageSrc && <Image src={imageSrc} alt="Vista previa de etiqueta" width={400} height={300} className="rounded-md" />}
                <DialogFooter className="sm:justify-between gap-2">
                    <Button type="button" variant="outline" onClick={() => setAiScanStep('camera')}><RefreshCw className="mr-2 h-4 w-4" /> Tomar de Nuevo</Button>
                    <Button type="button" onClick={handleProcessLabel}><ScanSearch className="mr-2 h-4 w-4" /> Procesar</Button>
                </DialogFooter>
                </>
            )}
            {aiScanStep === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <h3 className="text-lg font-semibold">Analizando Etiqueta...</h3>
                    <p className="text-muted-foreground text-sm">La IA está extrayendo la información.</p>
                </div>
            )}
            {aiScanStep === 'results' && extractedData && (
                <>
                <DialogHeader>
                    <DialogTitle>Datos Extraídos</DialogTitle>
                    <DialogDescription>Confirma si la información es correcta.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 my-4">
                    <div><Label>Código:</Label><Input value={extractedData.id || ''} readOnly /></div>
                    <div><Label>Nombre:</Label><Input value={extractedData.name || ''} readOnly /></div>
                    <div><Label>Presentación:</Label><Input value={extractedData.presentation || ''} readOnly /></div>
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button type="button" variant="ghost" onClick={resetAiScan}>Cancelar</Button>
                    <Button type="button" onClick={handleUseExtractedData}><Check className="mr-2 h-4 w-4" /> Usar estos Datos</Button>
                </DialogFooter>
                </>
            )}
            {aiScanStep === 'error' && (
                <>
                <DialogHeader>
                    <DialogTitle className="text-destructive">Error</DialogTitle>
                    <DialogDescription>{aiErrorMessage || "Ocurrió un error inesperado."}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetAiScan}>Cerrar</Button>
                </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
    </AuthWrapper>
  );
}
    

    
