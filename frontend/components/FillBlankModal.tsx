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

interface QuestionItem {
  question: string;
  blanks: string[];
}

interface FillBlankQuestion {
  question: string;
  type: string;
  blanks: string[];
}

interface PollData {
  title: string;
  createdById: string;
  projectId: string;
  questions: FillBlankQuestion[];
}

interface FillBlankModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PollData) => void;
  project: Project;
  user: User;
}

const FillBlankModal: React.FC<FillBlankModalProps> = ({
  open,
  onClose,
  onSave,
  project,
  user,
}) => {
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "", blanks: [""] }, // Initialize with one question and one blank
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", blanks: [""] }]); // Add a new question
  };

  const updateQuestion = (index: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = value; // Update the specific question
    setQuestions(updatedQuestions);
  };

  const addBlank = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].blanks.push(""); // Add a new blank to the specific question
    setQuestions(updatedQuestions);
  };

  const updateBlank = (qIndex: number, bIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].blanks[bIndex] = value; // Update the specific blank
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    if (
      !title ||
      questions.some((q) => !q.question || q.blanks.some((blank) => !blank))
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    const dataToSend: PollData = {
      title,
      createdById: user._id,
      projectId: project._id,
      questions: questions.map((q) => ({
        question: q.question,
        type: "Fill in the Blank",
        blanks: q.blanks,
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
            Add Fill in the Blank Poll
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
            <div key={qIndex} className="space-y-3 border rounded-md p-4">
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

              <div className="space-y-2">
                <Label className="text-blue-600 font-medium">Blanks</Label>
                {q.blanks.map((blank, bIndex) => (
                  <div key={bIndex} className="space-y-1">
                    <Label htmlFor={`blank-${qIndex}-${bIndex}`}>
                      Blank {bIndex + 1}
                    </Label>
                    <Input
                      id={`blank-${qIndex}-${bIndex}`}
                      type="text"
                      value={blank}
                      onChange={(e) =>
                        updateBlank(qIndex, bIndex, e.target.value)
                      }
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => addBlank(qIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blank
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
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

export default FillBlankModal;
