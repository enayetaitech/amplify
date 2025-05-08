import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";

interface ConfirmationModalProps {
  open: boolean;
  onCancel: () => void;
  onYes: () => void;
  heading: string;
  text: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onCancel,
  onYes,
  heading,
  text,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[420px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-semibold mb-1 text-blue-900">
            {heading}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-xs mb-6">
            {text}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-end items-center gap-4">
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-xl text-center py-1 px-7 shadow-md"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onYes}
            className="rounded-xl text-center py-1 px-10 shadow-md bg-blue-600 hover:bg-blue-700"
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
