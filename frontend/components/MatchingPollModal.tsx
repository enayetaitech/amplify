// frontend/src/components/projectComponents/polls/PollModal/MatchingPollModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

interface MatchingPair {
  option: string;
  answer: string;
}

interface Question {
  question: string;
  type: "Matching";
  matching: MatchingPair[];
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: Question[];
}

interface User {
  _id: string;
  [key: string]: any;
}

interface Project {
  _id: string;
  [key: string]: any;
}

interface MatchingPollModalProps {
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
  open?: boolean;
}

const MatchingPollModal = ({
  onClose,
  onSave,
  project,
  user,
  open = true,
}: MatchingPollModalProps) => {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", type: "Matching", matching: [{ option: "", answer: "" }] },
  ]);

  const addMatchingPair = (qIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].matching.push({ option: "", answer: "" });
    setQuestions(updatedQuestions);
  };

  const updateQuestion = (index: number, value: string) => {
    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, question: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const updateMatching = (
    qIndex: number,
    mIndex: number,
    field: keyof MatchingPair,
    value: string
  ) => {
    const updatedQuestions = questions.map((q, i) =>
      i === qIndex
        ? {
            ...q,
            matching: q.matching.map((m, j) =>
              j === mIndex ? { ...m, [field]: value } : m
            ),
          }
        : q
    );
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    if (
      !title ||
      questions.some(
        (q) => !q.question || q.matching.some((m) => !m.option || !m.answer)
      )
    ) {
      toast.error(
        "Please fill in all questions, options, answers, and the title."
      );
      return;
    }

    const dataToSend: PollData = {
      title,
      createdById: user._id,
      projectId: project._id,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        matching: q.matching.map((m) => ({
          option: m.option,
          answer: m.answer,
        })),
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
            Add Matching Poll
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
                  {q.matching.map((match, mIndex) => (
                    <div key={mIndex} className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`option-${qIndex}-${mIndex}`}>
                          Option {mIndex + 1}
                        </Label>
                        <Input
                          id={`option-${qIndex}-${mIndex}`}
                          value={match.option}
                          onChange={(e) =>
                            updateMatching(
                              qIndex,
                              mIndex,
                              "option",
                              e.target.value
                            )
                          }
                          placeholder="Enter option"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`answer-${qIndex}-${mIndex}`}>
                          Answer {mIndex + 1}
                        </Label>
                        <Input
                          id={`answer-${qIndex}-${mIndex}`}
                          value={match.answer}
                          onChange={(e) =>
                            updateMatching(
                              qIndex,
                              mIndex,
                              "answer",
                              e.target.value
                            )
                          }
                          placeholder="Enter answer"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMatchingPair(qIndex)}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Matching Pair
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchingPollModal;
