"use client";

import { useState, useEffect } from 'react';
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

export default function ScanForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');
  const [mode, setMode] = useState<'dispensing' | 'stocking'>('dispensing'); // dispensing (deduct), stocking (add)
  const { toast } = useToast();

  // Ensure date is client-side initialized to prevent hydration mismatch
  useEffect(() => {
    setDate(new Date());
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Basic validation
    if (!date || !prescriptionNumber || !quantity || !medicineDetails) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    const numericQuantity = parseInt(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      date: format(date, 'yyyy-MM-dd'),
      prescriptionNumber,
      quantity: numericQuantity,
      medicineDetails,
      mode,
    };

    // Simulate data logging
    console.log('Form Data Submitted:', formData);
    toast({
      title: "Entry Logged",
      description: `Medicine ${mode === 'dispensing' ? 'dispensed' : 'stocked'}: ${medicineDetails}, Qty: ${numericQuantity}`,
    });

    // Reset form (optional)
    // setDate(new Date());
    // setPrescriptionNumber('');
    // setQuantity('');
    // setMedicineDetails('');
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">Log Medicine Transaction</CardTitle>
        <CardDescription className="text-center">Scan QR or enter details manually.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* QR Scanner Placeholder */}
          <div className="space-y-2">
            <Label>QR Code / Medicine Identification</Label>
            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
              <Camera className="mr-2 h-5 w-5" />
              Scan QR Code (Placeholder)
            </Button>
            <Textarea
              placeholder="Medicine details from QR or manual input (e.g., Name, Strength, Batch No.)"
              value={medicineDetails}
              onChange={(e) => setMedicineDetails(e.target.value)}
              required
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
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
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
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
              <Label htmlFor="mode">Transaction Type</Label>
              <RadioGroup
                defaultValue="dispensing"
                onValueChange={(value: 'dispensing' | 'stocking') => setMode(value)}
                className="flex space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dispensing" id="dispensing" />
                  <Label htmlFor="dispensing">Dispensing (Deduct)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stocking" id="stocking" />
                  <Label htmlFor="stocking">Stocking (Add)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rxNumber">Prescription Number / Stock ID</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="rxNumber"
                  type="text"
                  placeholder="e.g., RX12345 or STK001"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
               <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
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
            Log Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
