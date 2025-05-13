import React, { useState } from "react";
import { Plus } from "lucide-react";

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

interface Choice {
  text: string;
}

interface QuestionItem {
  question: string;
  type: string;
  choices: Choice[];
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: QuestionItem[];
}

interface RankOrderPollModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
}

const RankOrderPollModal: React.FC<RankOrderPollModalProps> = ({
  open,
  onClose,
  onSave,
  project,
  user,
}) => {
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "", type: "Rank Order", choices: [{ text: "" }] },
  ]);

  const addChoice = (qIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].choices.push({ text: "" });
    setQuestions(updatedQuestions);
  };

  const updateQuestion = (index: number, value: string) => {
    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, question: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const updateChoice = (qIndex: number, cIndex: number, value: string) => {
    const updatedQuestions = questions.map((q, i) =>
      i === qIndex
        ? {
            ...q,
            choices: q.choices.map((c, j) =>
              j === cIndex ? { text: value } : c
            ),
          }
        : q
    );
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    if (
      !title ||
      questions.some((q) => !q.question || q.choices.some((c) => !c.text))
    ) {
      toast.error("Please fill in all questions, answers, and the title.");
      return;
    }

    const dataToSend: PollData = {
      title,
      createdById: user._id,
      projectId: project._id,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        choices: q.choices.map((c) => ({ text: c.text })),
      })),
    };

    onSave(dataToSend);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600 text-2xl font-semibold">
            Add Rank Order Poll
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

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`question-${qIndex}`}>
                  Question {qIndex + 1}
                </Label>
                <Input
                  id={`question-${qIndex}`}
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, e.target.value)}
                />
              </div>

              <div className="bg-slate-100 p-4 rounded-md space-y-3">
                {q.choices.map((choice, cIndex) => (
                  <div key={cIndex} className="space-y-1">
                    <Label htmlFor={`choice-${qIndex}-${cIndex}`}>
                      Choice {cIndex + 1}
                    </Label>
                    <Input
                      id={`choice-${qIndex}-${cIndex}`}
                      type="text"
                      value={choice.text}
                      onChange={(e) =>
                        updateChoice(qIndex, cIndex, e.target.value)
                      }
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addChoice(qIndex)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Choice
                </Button>
              </div>
            </div>
          ))}
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

export default RankOrderPollModal;
