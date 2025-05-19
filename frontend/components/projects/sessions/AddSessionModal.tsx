// components/projects/sessions/AddSessionModal.tsx

"use client";
import CustomButton from "components/shared/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import React, { useState } from "react";
import AddSessionStep1 from "./AddSessionStep1";
import AddSessionStep2 from "./AddSessionStep2";

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  projectId: string;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({
  open,
  onClose,
  onSave,
  projectId
}) => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);
  const handleSave = () => {
    onSave(); // call mutation from parent
    onClose();
    setStep(1); // reset step
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add Session
          </DialogTitle>
        </DialogHeader>

        {/* Step UI */}
        {step === 1 && (
          <div className="space-y-4">
            <AddSessionStep1
            projectId={projectId}
            />
            <div className="flex justify-end">
              <CustomButton
                onClick={handleNext}
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Next
              </CustomButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <AddSessionStep2/>
            <div className="flex justify-between">
              <CustomButton
                onClick={handleBack}
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
              >
                Back
              </CustomButton>
              <CustomButton
                onClick={handleSave}
                className="bg-custom-orange-2 hover:bg-custom-orange-1"
              >
                Save Sessions
              </CustomButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionModal;
