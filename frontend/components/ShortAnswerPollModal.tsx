import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { toast } from "sonner";

interface Project {
  _id: string;
}

interface User {
  _id: string;
}

interface Question {
  question: string;
  type: string;
  minLength: number;
  maxLength: number;
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: Question[];
}

interface ShortAnswerPollModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
}

const ShortAnswerPollModal: React.FC<ShortAnswerPollModalProps> = ({
  open,
  onClose,
  onSave,
  project,
  user,
}) => {
  const [title, setTitle] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [minLength, setMinLength] = useState<number>(1);
  const [maxLength, setMaxLength] = useState<number>(200);

  const handleSave = () => {
    if (!title || !question) {
      toast.error("Please fill in all fields.");
      return;
    }

    const dataToSend: PollData = {
      title,
      createdById: user._id,
      projectId: project._id,
      questions: [
        {
          question,
          type: "Short Answer",
          minLength,
          maxLength,
        },
      ],
    };

    onSave(dataToSend);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-blue-600 text-2xl font-semibold">
            Add Short Answer Poll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 w-1/2">
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2 w-1/2">
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShortAnswerPollModal;
