"use client";

import type { Medicine, DispensingRecord } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, CalendarDays, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface InventoryCardProps {
  medicine: Medicine;
}

export default function InventoryCard({ medicine }: InventoryCardProps) {
  const stockLevelAlertThreshold = 10; // Example threshold

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary">{medicine.name}</CardTitle>
            <CardDescription>{medicine.description || 'No description available.'}</CardDescription>
          </div>
          <Badge 
            variant={medicine.currentStock <= stockLevelAlertThreshold ? "destructive" : "secondary"}
            className="ml-2 whitespace-nowrap"
          >
            ID: {medicine.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-foreground">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-medium">Current Stock:</span>
          </div>
          <span className={`text-2xl font-bold ${medicine.currentStock <= stockLevelAlertThreshold ? 'text-destructive' : 'text-primary'}`}>
            {medicine.currentStock}
          </span>
        </div>
         {medicine.currentStock <= stockLevelAlertThreshold && (
          <div className="flex items-center text-sm text-destructive p-2 rounded-md border border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
            Low stock warning!
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-foreground mb-2">Transaction History:</h4>
          {medicine.dispensingHistory.length > 0 ? (
            <ScrollArea className="h-[150px] w-full rounded-md border p-1">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Rx/Stock ID</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicine.dispensingHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(parseISO(record.date), 'MM/dd/yy')}</TableCell>
                      <TableCell>{record.rxNumber}</TableCell>
                      <TableCell className="text-right">{record.quantity}</TableCell>
                      <TableCell className="text-right">
                        {record.type === 'dispensed' ? (
                          <ArrowDownCircle className="h-4 w-4 text-red-500 inline" title="Dispensed" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-green-500 inline" title="Stocked" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No transaction history.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-3">
        <CalendarDays className="h-4 w-4 mr-1.5" />
        Last Updated: {format(parseISO(medicine.lastUpdated), 'PPP')}
      </CardFooter>
    </Card>
  );
}
