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
  ratingRange: {
    min: number;
    max: number;
  };
  lowScoreLable: string;
  highScoreLable: string;
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: Question[];
}

interface RatingScaleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
}

const RatingScaleModal: React.FC<RatingScaleModalProps> = ({
  open,
  onClose,
  onSave,
  project,
  user,
}) => {
  const [title, setTitle] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(10);
  const [lowScoreLabel, setLowScoreLabel] = useState<string>("");
  const [highScoreLabel, setHighScoreLabel] = useState<string>("");

  const handleSave = () => {
    if (!title || !question || lowScoreLabel === "" || highScoreLabel === "") {
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
          type: "Rating Scale",
          ratingRange: { min: minScore, max: maxScore },
          lowScoreLable: lowScoreLabel,
          highScoreLable: highScoreLabel,
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
            Add Rating Scale Poll
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
              <Label htmlFor="minScore">Score from</Label>
              <Input
                id="minScore"
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2 w-1/2">
              <Label htmlFor="maxScore">to</Label>
              <Input
                id="maxScore"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lowScoreLabel">Low Score Label</Label>
            <Input
              id="lowScoreLabel"
              type="text"
              value={lowScoreLabel}
              onChange={(e) => setLowScoreLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highScoreLabel">High Score Label</Label>
            <Input
              id="highScoreLabel"
              type="text"
              value={highScoreLabel}
              onChange={(e) => setHighScoreLabel(e.target.value)}
            />
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

export default RatingScaleModal;
