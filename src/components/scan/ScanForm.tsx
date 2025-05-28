"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CalendarIcon, FileText, Package, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

export default function ScanForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');
  const [mode, setMode] = useState<'dispensing' | 'stocking'>('dispensing');
  const { toast } = useToast();
  const { getCurrentUser } = useAuth(); // Get getCurrentUser function

  useEffect(() => {
    setDate(new Date());
  }, []);

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
    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      toast({
        title: "Cantidad Inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    const currentUser = getCurrentUser(); // Get the current logged-in user

    const formData = {
      date: format(date, 'yyyy-MM-dd'),
      prescriptionNumber,
      quantity: numericQuantity,
      medicineDetails,
      mode,
      userName: currentUser || 'System', // Add userName to the form data
    };

    console.log('Form Data Submitted:', formData);
    toast({
      title: "Entrada Registrada",
      description: `Medicamento ${mode === 'dispensing' ? 'dispensado' : 'abastecido'}: ${medicineDetails}, Cant: ${numericQuantity}. Registrado por: ${formData.userName}.`,
    });

    // Reset form fields after submission
    // setDate(new Date()); // Keep date or reset as preferred
    // setPrescriptionNumber('');
    // setQuantity('');
    // setMedicineDetails('');
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
            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
              <Camera className="mr-2 h-5 w-5" />
              Escanear Código QR (Simulado)
            </Button>
            <Textarea
              placeholder="Detalles del medicamento (ej: Nombre, Dosis, Lote)"
              value={medicineDetails}
              onChange={(e) => setMedicineDetails(e.target.value)}
              required
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
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
                    {date ? format(date, "PPP") : <span>Elige una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Tipo de Transacción</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value: 'dispensing' | 'stocking') => setMode(value)}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rxNumber">Nº de Receta / ID de Stock</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="rxNumber"
                  type="text"
                  placeholder="ej: RX12345 o STK001"
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
            Registrar Entrada
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
