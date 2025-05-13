import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";

interface Result {
  row: number;
  message: string;
}

interface UploadResultsModalProps {
  open: boolean;
  onClose: () => void;
  successResults: Result[];
  rejectedData: Result[];
}

const UploadResultsModal: React.FC<UploadResultsModalProps> = ({
  open,
  onClose,
  successResults,
  rejectedData,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Results</DialogTitle>
        </DialogHeader>

        {/* Success Results Table */}
        <div className="space-y-4">
          <h3 className="font-semibold">Success Results</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {successResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.row}</TableCell>
                  <TableCell>{result.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Rejected Data Table */}
          <h3 className="font-semibold mt-6">Rejected Data</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rejectedData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.row}</TableCell>
                  <TableCell>{data.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadResultsModal;
