// components/projects/review/PurchaseCreditsTable.tsx
import React from 'react';
import { creditPackages, quantityOptions } from 'constant';
import { Card, CardContent } from 'components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem } from 'components/ui/select';

export function PurchaseCreditsTable({
  purchaseQuantities,
  onChange,
  totalPrice
}: {
  purchaseQuantities: Record<number, number>;
  onChange: (pkg: number, qty: number) => void;
  totalPrice: number;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Purchase Credits</h2>
      <Card className="shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-custom-teal">
                <TableHead className="pl-6">Quantity</TableHead>
                <TableHead className="text-right">Credit Package</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Total Price (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditPackages.map(pkg => {
                const qty = purchaseQuantities[pkg.package] || 0;
                return (
                  <TableRow key={pkg.package}>
                    <TableCell className="pl-6">
                      <Select
                        value={qty.toString()}
                        onValueChange={v => onChange(pkg.package, +v)}
                      >
                        <SelectTrigger className="w-20">{qty || 'Select'}</SelectTrigger>
                        <SelectContent>
                          {quantityOptions.map(opt => (
                            <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">{pkg.package}</TableCell>
                    <TableCell className="text-right">{pkg.cost}</TableCell>
                    <TableCell className="text-right">{(qty * pkg.cost).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell colSpan={3} className="pl-6 text-left">Total Price (USD)</TableCell>
                <TableCell className="text-right">{totalPrice.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
