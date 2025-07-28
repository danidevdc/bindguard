
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, RefreshCw, AlertTriangle, Loader2, FileText, ScanSearch, Check, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { extractRecipe, type ExtractRecipeOutput } from '@/ai/flows/extract-recipe-flow';

type ScanStep = 'camera' | 'preview' | 'loading' | 'results' | 'error';

export default function ScanRecipeClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<ScanStep>('camera');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractRecipeOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setErrorMessage("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
      setStep('error');
    }
  }, []);

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, startCamera]);

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
      setStep('preview');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleProcessRecipe = async () => {
    if (!imageSrc) return;
    setStep('loading');
    setErrorMessage(null);
    try {
      const result = await extractRecipe({ photoDataUri: imageSrc });
      setExtractedData(result);
      setStep('results');
      toast({
        title: "Receta Analizada",
        description: "Los datos han sido extraídos. Por favor, verifica la información.",
        variant: 'success'
      });
    } catch (error: any) {
      console.error("Error processing recipe:", error);
      setErrorMessage(error.message || "Ocurrió un error al procesar la receta con la IA.");
      setStep('error');
    }
  };

  const handleRetakePhoto = () => {
    setImageSrc(null);
    setExtractedData(null);
    setErrorMessage(null);
    setStep('camera');
  };
  
  const handleDataChange = (index: number, field: 'code' | 'product' | 'quantity', value: string | number) => {
    if (!extractedData) return;
    const newMedicines = [...extractedData.medicines];
    const newMed = { ...newMedicines[index] };

    if (field === 'quantity') {
      newMed[field] = Number(value);
    } else {
      newMed[field] = value as string;
    }
    
    newMedicines[index] = newMed;
    setExtractedData({ ...extractedData, medicines: newMedicines });
  };
  
  const renderStep = () => {
    switch (step) {
      case 'camera':
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Escanear Receta Médica</CardTitle>
              <CardDescription className="text-center">Apunta la cámara a la receta y asegúrate de que esté bien iluminada y enfocada.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                  <AlertDescription>Por favor, habilita los permisos de cámara para continuar.</AlertDescription>
                </Alert>
              )}
              <Button onClick={handleTakePhoto} disabled={!hasCameraPermission} className="w-full text-lg py-6">
                <Camera className="mr-2 h-6 w-6" /> Tomar Foto
              </Button>
            </CardContent>
          </Card>
        );

      case 'preview':
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Verificar Foto</CardTitle>
              <CardDescription className="text-center">¿La imagen es clara y legible? Si no, puedes tomarla de nuevo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {imageSrc && <Image src={imageSrc} alt="Vista previa de la receta" width={800} height={600} className="rounded-md" />}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleRetakePhoto} variant="outline" className="text-lg py-6">
                  <RefreshCw className="mr-2 h-6 w-6" /> Tomar de Nuevo
                </Button>
                <Button onClick={handleProcessRecipe} className="w-full text-lg py-6">
                  <ScanSearch className="mr-2 h-6 w-6" /> Procesar Receta
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <h2 className="text-2xl font-semibold">Analizando Receta...</h2>
            <p className="text-muted-foreground">La IA está leyendo y extrayendo la información. Esto puede tardar unos segundos.</p>
          </div>
        );

      case 'results':
        return (
          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Resultados de la Extracción</CardTitle>
              <CardDescription className="text-center">Verifica y corrige la información extraída por la IA antes de continuar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm p-4 border rounded-md">
                    <div><strong className="text-muted-foreground">Paciente:</strong> {extractedData?.patientName || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">Matrícula:</strong> {extractedData?.patientId || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">Nº Receta:</strong> {extractedData?.prescriptionNumber || 'N/A'}</div>
                    <div><strong className="text-muted-foreground">Fecha:</strong> {extractedData?.date || 'N/A'}</div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="w-[100px]">Cantidad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {extractedData?.medicines.map((med, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Input value={med.code || ''} onChange={(e) => handleDataChange(index, 'code', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    <Input value={med.product} onChange={(e) => handleDataChange(index, 'product', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={med.quantity} onChange={(e) => handleDataChange(index, 'quantity', e.target.value)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={handleRetakePhoto} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Escanear Otra</Button>
                    <Button onClick={() => toast({ title: "Función no implementada", description: "El siguiente paso (dispensar) aún no está conectado." })}>
                        <Check className="mr-2 h-4 w-4" /> Confirmar y Dispensar
                    </Button>
                </div>
            </CardContent>
          </Card>
        );
        
      case 'error':
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-destructive">Error al Procesar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <p className="text-center">{errorMessage || "Ocurrió un error inesperado."}</p>
              <Button onClick={handleRetakePhoto} variant="destructive" className="w-full text-lg py-6">
                <RefreshCw className="mr-2 h-6 w-6" /> Intentar de Nuevo
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <Button variant="outline" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {step !== 'camera' && (
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            <Ban className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        )}
      </div>
      {renderStep()}
    </div>
  );
}
