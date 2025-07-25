// frontend/src/components/projectComponents/polls/PollModal/SingleChoicePollModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Card, CardContent } from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

interface Choice {
  text: string;
  votes?: number;
}

interface Question {
  question: string;
  type: "Single Choice";
  choices: Choice[];
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: Question[];
}

interface User {
  _id: string;
  // [key: string]: any;
}

interface Project {
  _id: string;
  // [key: string]: any;
}

interface SingleChoicePollModalProps {
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
  open?: boolean;
}

const SingleChoicePollModal = ({
  onClose,
  onSave,
  project,
  user,
  open = true,
}: SingleChoicePollModalProps) => {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", type: "Single Choice", choices: [{ text: "" }] },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", type: "Single Choice", choices: [{ text: "" }] },
    ]);
  };

  const updateQuestion = (index: number, value: string) => {
    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, question: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const addChoice = (qIndex: number) => {
    const updatedQuestions = questions.map((q, i) =>
      i === qIndex ? { ...q, choices: [...q.choices, { text: "" }] } : q
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

  const removeChoice = (qIndex: number, cIndex: number) => {
    const updatedQuestions = questions.map((q, i) =>
      i === qIndex
        ? {
            ...q,
            choices: q.choices.filter((_, j) => j !== cIndex),
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
      toast.error("Please fill in all questions, choices, and the title.");
      return;
    }

    const dataToSend: PollData = {
      title,
      createdById: user._id,
      projectId: project._id,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        choices: q.choices.map((c) => ({ text: c.text, votes: 0 })),
      })),
    };

    onSave(dataToSend);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-blue-600">
            Add Single Choice Poll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="pollTitle">Poll Title</Label>
            <Input
              id="pollTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter poll title"
            />
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`question-${qIndex}`}>
                  Question {qIndex + 1}
                </Label>
                <Input
                  id={`question-${qIndex}`}
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, e.target.value)}
                  placeholder="Enter your question"
                />
              </div>

              <Card>
                <CardContent className="pt-6">
                  {q.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-2 mb-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`choice-${qIndex}-${cIndex}`}>
                          Choice {cIndex + 1}
                        </Label>
                        <Input
                          id={`choice-${qIndex}-${cIndex}`}
                          value={choice.text}
                          onChange={(e) =>
                            updateChoice(qIndex, cIndex, e.target.value)
                          }
                          placeholder="Enter choice"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeChoice(qIndex, cIndex)}
                        className="mt-6 flex-shrink-0"
                        disabled={q.choices.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addChoice(qIndex)}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Choice
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleChoicePollModal;
