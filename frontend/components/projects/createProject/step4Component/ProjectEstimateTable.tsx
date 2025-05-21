import React from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'components/ui/table';
import { durationMapping } from 'constant';
import { Step4Props } from '@shared/interface/CreateProjectInterface';

export function ProjectEstimateTable({ sessions, service }: { sessions: Step4Props['formData']['sessions'], service: string }) {
  const rows = sessions.map(s => {
    const qty = s.number;
    const dur = Number(durationMapping[s.duration] || s.duration);
    const hours = (qty * dur) / 60;
    const credits = qty * dur * 2.75;
    return { service, qty, dur, hours: hours.toFixed(2), credits: credits.toFixed(2) };
  });
  const totalHours = rows.reduce((sum, r) => sum + parseFloat(r.hours), 0).toFixed(2);
  const totalCredits = rows.reduce((sum, r) => sum + parseFloat(r.credits), 0).toFixed(2);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Project Estimate</h2>
      <Card className="shadow-md">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-custom-teal">
                <TableHead className="pl-6">Service</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Session Duration (mins)</TableHead>
                <TableHead className="text-right">Estimated Hours</TableHead>
                <TableHead className="text-right">Total Credits Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">{r.service}</TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                  <TableCell className="text-right">{r.dur}</TableCell>
                  <TableCell className="text-right">{r.hours}</TableCell>
                  <TableCell className="text-right">{r.credits}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={3} className="pl-6">TOTAL</TableCell>
                <TableCell className="text-right">{totalHours}</TableCell>
                <TableCell className="text-right">{totalCredits}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="pt-5 text-sm">
        *Final billing will be based on actual streaming hours for sessions booked.
      </p>
    </div>
  );
}
