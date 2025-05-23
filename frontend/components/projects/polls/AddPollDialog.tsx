import { Switch } from "@/components/ui/switch";
import { CreatePollPayload, DraftQuestion, IPoll, QuestionType } from "@shared/interface/PollInterface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import CustomButton from "components/shared/CustomButton";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter } from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import api from "lib/api";
import {
  AlignJustify,
  ArrowUpDown,
  CheckSquare,
  Circle,
  Edit2,
  LinkIcon,
  Minus,
  MoreHorizontal,
  Plus,
  Smile,
  TypeIcon,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import RankOrderQuestion from "./RankOrderQuestion";
import RatingScaleQuestion from "./RatingScaleQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import MatchingQuestion from "./MatchingQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";

const questionTypeOptions: {
  value: QuestionType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "SINGLE_CHOICE",
    label: "Single Choice",
    icon: <Circle className="mr-2 h-4 w-4" />,
  },
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    icon: <CheckSquare className="mr-2 h-4 w-4" />,
  },
  {
    value: "MATCHING",
    label: "Matching",
    icon: <LinkIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "RANK_ORDER",
    label: "Rank Order",
    icon: <ArrowUpDown className="mr-2 h-4 w-4" />,
  },
  {
    value: "SHORT_ANSWER",
    label: "Short Answer",
    icon: <TypeIcon className="mr-2 h-4 w-4" />,
  },
  {
    value: "LONG_ANSWER",
    label: "Long Answer",
    icon: <AlignJustify className="mr-2 h-4 w-4" />,
  },
  {
    value: "FILL_IN_BLANK",
    label: "Fill in the Blank",
    icon: <Edit2 className="mr-2 h-4 w-4" />,
  },
  {
    value: "RATING_SCALE",
    label: "Rating Scale",
    icon: <Smile className="mr-2 h-4 w-4" />,
  },
];

const defaultQuestion = (overrides: Partial<DraftQuestion> = {}): DraftQuestion => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "SINGLE_CHOICE",
  options: ["", ""],
  answers: ["", ""],
  rows: [],
  columns: [],
  required: false,
  correctAnswer: 0,
  showDropdown: true,
  correctAnswers: [],
  minChars: 1,
  maxChars: 200,
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
  ...overrides,
});

interface CreatePollResponse {
  data: IPoll;
}

const AddPollDialog = ({
  projectId,
  user,
}: {
  projectId: string;
  user: { _id: string; role: string };
}) => {
  const queryClient = useQueryClient();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [
  defaultQuestion(),
]);

  const resetForm = () => {
    setTitle("");
    setQuestions([defaultQuestion()]);
  };

  const createPollMutation = useMutation<
    IPoll,
    AxiosError<CreatePollResponse> | Error,
    CreatePollPayload
  >({
    mutationFn: (payload: CreatePollPayload) =>
      api
        .post<CreatePollResponse>("/api/v1/polls", payload)
        .then((r) => r.data.data),

    // 2) callbacks
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", projectId] });
      toast.success("Poll created!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.log("error message", error.message);
      toast.error(
        error instanceof Error ? error.message : "Failed to create poll"
      );
    },
  });

  // 2️⃣ hook up Save
  const onSave = () => {
    if (!projectId || !user) return;

    const payloadQs = questions.map((q) => {
      if (q.type === "RANK_ORDER") {
        const { options, answers, ...rest } = q;
        return {
          ...rest,
          type: "RANK_ORDER",
          rows: options,
          columns: answers,
        };
      }
      return q;
    });

    createPollMutation.mutate({
      projectId,
      // sessionId: ,
      title: title.trim(),
      questions: payloadQs as unknown as DraftQuestion[],
      createdBy: user._id,
      createdByRole: user.role,
    });
  };

  const addQuestion = () => {
  setQuestions((qs) => [...qs, defaultQuestion()]);
};

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  const duplicateQuestion = (id: string) => {
     const orig = questions.find((q) => q.id === id)!;
  setQuestions((qs) => [
    ...qs,
    defaultQuestion({ ...orig, id: crypto.randomUUID() })
  ]);
  };

  const updateType = (id: string, type: QuestionType) => {
    if (type === "SINGLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: 0,
        showDropdown: true,
        correctAnswers: [],
      });
    } else if (type === "MULTIPLE_CHOICE") {
      updateQuestion(id, {
        type,
        options: ["", ""],
        answers: ["", ""],
        correctAnswer: undefined,
        showDropdown: undefined,
        correctAnswers: [],
      });
    } else if (type === "RATING_SCALE") {
      updateQuestion(id, {
        type,
        scoreFrom: 0,
        scoreTo: 10,
        lowLabel: "",
        highLabel: "",
        options: [],
        answers: [],
        rows: [],
        columns: [],
      });
    } else if (type === "MATCHING")
      updateQuestion(id, { type, options: ["", ""], answers: ["", ""] });
    else if (type === "SHORT_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 200,
      });
    else if (type === "LONG_ANSWER")
      updateQuestion(id, {
        type,
        options: [],
        answers: [],
        minChars: 1,
        maxChars: 2000,
      });
    else updateQuestion(id, { type, options: [], answers: ["", ""] });
  };

  // Single/multi choice handlers
  const addChoice = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateChoice = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, j) => (j === i ? val : a)),
    });
  };
  const removeChoice = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: q.answers.filter((_, j) => j !== i) });
  };

  // Matching row handlers
  const addOption = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: [...q.options, ""] });
  };
  const updateOption = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.map((o, j) => (j === i ? val : o)),
    });
  };
  const removeOption = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: q.options.filter((_, j) => j !== i) });
  };

  // Matching column / blanks handlers
  const addAnswer = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateAnswer = (id: string, i: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, j) => (j === i ? val : a)),
    });
  };
  const removeAnswer = (id: string, i: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: q.answers.filter((_, j) => j !== i) });
  };

  // Fill-in-Blank: insert <blank N> at cursor
  function addBlank(id: string) {
    const q = questions.find((x) => x.id === id)!;
    const n = (q.answers || []).length + 1;
    const tag = `<blank ${n}>`;

    const input = inputRefs.current[id];
    if (input) {
      // 1️⃣ Grab the raw value
      const value = input.value;

      // 2️⃣ Null-coalesce onto the ends
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;

      // 3️⃣ Split/insert
      const before = value.slice(0, start);
      const after = value.slice(end);
      const newPrompt = before + tag + after;

      updateQuestion(id, {
        prompt: newPrompt,
        answers: [...(q.answers || []), ""],
      });

      // 4️⃣ restore focus/caret
      setTimeout(() => {
        input.focus();
        const pos = before.length + tag.length;
        input.setSelectionRange(pos, pos);
      });
    } else {
      // fallback
      updateQuestion(id, {
        prompt: q.prompt + tag,
        answers: [...(q.answers || []), ""],
      });
    }
  }

  // Short/Long toggles
  const changeMin = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { minChars: Math.max(1, (q.minChars || 1) + d) });
  };
  const changeMax = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    const cap = q.type === "SHORT_ANSWER" ? 200 : 2000;
    updateQuestion(id, { maxChars: Math.min(cap, (q.maxChars || cap) + d) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CustomButton
          className="bg-custom-orange-1 hover:bg-custom-orange-2 rounded-lg"
          icon={<Plus />}
          text="Add Poll"
          variant="default"
        />
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center mt-5">
            <DialogTitle>Add Poll</DialogTitle>
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
              onClick={onSave}
              text={createPollMutation.isPending ? "Saving…" : "Save Poll"}
              disabled={createPollMutation.isPending}
              variant="default"
            />
          </div>
        </DialogHeader>

        {/* ← NEW: Poll Title input */}
        <div className="mt-4 space-y-4">
          <Input
            id="poll-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter poll title"
            className="mt-1 py-2"
          />
        </div>

        {/* Questions list */}
        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q) => (
            <Card key={q.id} className="border">
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Question</Label>
                    <Input
                      value={q.prompt}
                      placeholder={
                        q.type === "FILL_IN_BLANK"
                          ? "Enter text with <blank> tags"
                          : "Enter question text"
                      }
                      onChange={(e) =>
                        updateQuestion(q.id, { prompt: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="w-48">
                    <Label>Question Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val) =>
                        updateType(q.id, val as QuestionType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <div className="flex items-center">
                              {o.icon}
                              {o.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Per-type UI */}
                {q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER" ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-2">
                      <Label>Min Characters*</Label>
                      <CustomButton
                        icon={<Minus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMin(q.id, -1)}
                      />
                      <span className="w-8 text-center">{q.minChars}</span>
                      <CustomButton
                        icon={<Plus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMin(q.id, +1)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Max Characters*</Label>
                      <CustomButton
                        icon={<Minus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMax(q.id, -1)}
                      />
                      <span className="w-12 text-center">{q.maxChars}</span>
                      <CustomButton
                        icon={<Plus />}
                        variant="ghost"
                        size="icon"
                        onClick={() => changeMax(q.id, +1)}
                      />
                    </div>
                  </div>
                ) : q.type === "SINGLE_CHOICE" ? (
                  <SingleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswer={q.correctAnswer}
                    showDropdown={q.showDropdown!}
                    onAnswerChange={(idx, val) => updateChoice(q.id, idx, val)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(idx) => removeChoice(q.id, idx)}
                    onToggleShowDropdown={(show) =>
                      updateQuestion(q.id, { showDropdown: show })
                    }
                    onCorrectAnswerChange={(idx) =>
                      updateQuestion(q.id, { correctAnswer: idx })
                    }
                  />
                ) : q.type === "MULTIPLE_CHOICE" ? (
                  <MultipleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswers={q.correctAnswers!}
                    onAnswerChange={(idx, val) => updateChoice(q.id, idx, val)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(idx) => removeChoice(q.id, idx)}
                    onToggleCorrectAnswer={(idx, checked) => {
                      const next = checked
                        ? [...(q.correctAnswers || []), idx]
                        : (q.correctAnswers || []).filter((x) => x !== idx);
                      updateQuestion(q.id, { correctAnswers: next });
                    }}
                  />
                ) : q.type === "MATCHING" ? (
                  <MatchingQuestion
                    id={q.id}
                    options={q.options}
                    answers={q.answers}
                    onOptionChange={(i, val) => updateOption(q.id, i, val)}
                    onAddOption={() => addOption(q.id)}
                    onRemoveOption={(i) => removeOption(q.id, i)}
                    onAnswerChange={(i, val) => updateAnswer(q.id, i, val)}
                    onAddAnswer={() => addAnswer(q.id)}
                    onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                  />
                ) : q.type === "RANK_ORDER" ? (
                  <RankOrderQuestion
                    id={q.id}
                    rows={q.options}
                    columns={q.answers}
                    onRowChange={(i, val) => updateOption(q.id, i, val)}
                    onAddRow={() => addOption(q.id)}
                    onRemoveRow={(i) => removeOption(q.id, i)}
                    onColumnChange={(i, val) => updateAnswer(q.id, i, val)}
                    onAddColumn={() => addAnswer(q.id)}
                    onRemoveColumn={(i) => removeAnswer(q.id, i)}
                  />
                ) : q.type === "RATING_SCALE" ? (
                  <RatingScaleQuestion
                    id={q.id}
                    scoreFrom={q.scoreFrom}
                    scoreTo={q.scoreTo}
                    lowLabel={q.lowLabel}
                    highLabel={q.highLabel}
                    onScoreFromChange={(val) =>
                      updateQuestion(q.id, { scoreFrom: val })
                    }
                    onScoreToChange={(val) =>
                      updateQuestion(q.id, { scoreTo: val })
                    }
                    onLowLabelChange={(val) =>
                      updateQuestion(q.id, { lowLabel: val })
                    }
                    onHighLabelChange={(val) =>
                      updateQuestion(q.id, { highLabel: val })
                    }
                  />
                ) : (
                  q.type === "FILL_IN_BLANK" && (
                    <FillInBlankQuestion
                      id={q.id}
                      answers={q.answers}
                      onAddBlank={() => addBlank(q.id)}
                      onAnswerChange={(idx, val) =>
                        updateAnswer(q.id, idx, val)
                      }
                      onRemoveAnswer={(idx) => removeAnswer(q.id, idx)}
                      onAddAnswer={() => addAnswer(q.id)}
                    />
                  )
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.required}
                    onCheckedChange={(v) =>
                      updateQuestion(q.id, { required: v })
                    }
                  />
                  <span>Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CustomButton icon={<Upload />} variant="ghost" size="icon" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <CustomButton
                        icon={<MoreHorizontal />}
                        variant="ghost"
                        size="icon"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => removeQuestion(q.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => duplicateQuestion(q.id)}
                      >
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add Question */}
        <div className="mt-6 text-center">
          <Button onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPollDialog;
