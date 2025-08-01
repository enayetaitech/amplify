"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Circle,
  CheckSquare,
  LinkIcon,
  ArrowUpDown,
  TypeIcon,
  AlignJustify,
  Smile,
  Minus,
  Upload,
} from "lucide-react";
import {
  DraftQuestion,
  QuestionType,
  IPoll,
  PollQuestion,
} from "@shared/interface/PollInterface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "components/ui/card";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import MatchingQuestion from "./MatchingQuestion";
import RankOrderQuestion from "./RankOrderQuestion";
import RatingScaleQuestion from "./RatingScaleQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import {
  allQuestionsValid,
  validateQuestion,
  validateTitle,
  WithImage,
} from "./AddPollDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { AxiosError } from "axios";
import Image from "next/image";

// wherever you define WithImage
// export interface WithImage {
//   imageFile?: File;
//   tempImageName?: string;
//   imageUrl?: string;
// }

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

const defaultQuestion = (
  overrides: Partial<DraftQuestion & WithImage> = {}
): DraftQuestion & WithImage => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "SINGLE_CHOICE",
  options: ["", ""],
  answers: overrides.type === "FILL_IN_BLANK" ? [] : ["", ""],
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

interface EditPollDialogProps {
  poll: IPoll;
  onClose: () => void;
}

type DraftWithImage = DraftQuestion & WithImage;

export default function EditPollDialog({ poll, onClose }: EditPollDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(poll.title);
  const [questions, setQuestions] = useState<DraftWithImage[]>([]);

  // keep in sync when poll changes
  useEffect(() => {
    setTitle(poll.title);
    const initialQs: DraftWithImage[] = poll.questions.map((q: PollQuestion) =>
      defaultQuestion({
        id: q._id,
        prompt: q.prompt,
        type: q.type,
        required: q.required,
        imageUrl: q.image,
        tempImageName: undefined,
        ...(q.type === "SINGLE_CHOICE" && {
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          showDropdown: q.showDropdown,
        }),
        ...(q.type === "MULTIPLE_CHOICE" && {
          answers: q.answers,
          correctAnswers: q.correctAnswers,
        }),
        ...(q.type === "MATCHING" && {
          options: q.options,
          answers: q.answers,
        }),
        ...(q.type === "RANK_ORDER" && {
          rows: q.rows,
          columns: q.columns,
        }),
        ...(q.type === "SHORT_ANSWER" && {
          minChars: q.minChars ?? 1,
          maxChars: q.maxChars ?? 200,
        }),
        ...(q.type === "LONG_ANSWER" && {
          minChars: q.minChars ?? 1,
          maxChars: q.maxChars ?? 2000,
        }),
        ...(q.type === "FILL_IN_BLANK" && {
          answers: q.answers,
        }),
        ...(q.type === "RATING_SCALE" && {
          scoreFrom: q.scoreFrom,
          scoreTo: q.scoreTo,
          lowLabel: q.lowLabel,
          highLabel: q.highLabel,
        }),
      })
    );

    setQuestions(initialQs);
    setOpen(true);
  }, [poll]);

  // PATCH-mutation
  const updateMutation = useMutation<
    IPoll,
    AxiosError,
    { id: string; formData: FormData }
  >({
    mutationFn: ({ id, formData }) =>
      api
        .patch<{ data: IPoll }>(`/api/v1/polls/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((r) => r.data.data),

    onSuccess: () => {
      toast.success("Poll updated");
      queryClient.invalidateQueries({ queryKey: ["polls", poll.projectId] });
      setOpen(false);
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // handlers copied from AddPollDialog (add/remove/duplicate/update question, etc.)
  const updateQuestion = (id: string, patch: Partial<DraftWithImage>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const addQuestion = () => setQuestions((qs) => [...qs, defaultQuestion()]);
  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  function duplicateQuestion(id: string) {
    setQuestions((qs) => {
      const orig = qs.find((q) => q.id === id)!;
      const copy = structuredClone(orig);
      copy.id = crypto.randomUUID();
      return [...qs, copy];
    });
  }

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
    else if (type === "FILL_IN_BLANK") {
      updateQuestion(id, { type, prompt: "", answers: [] });
    } else updateQuestion(id, { type, options: [], answers: ["", ""] });
  };

  // Single/Multiple choice
  const addChoice = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateChoice = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, i) => (i === idx ? val : a)),
    });
  };
  const removeChoice = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.filter((_, i) => i !== idx),
    });
  };

  // Matching rows/columns
  const addOption = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { options: [...q.options, ""] });
  };
  const updateOption = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.map((o, i) => (i === idx ? val : o)),
    });
  };
  const removeOption = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      options: q.options.filter((_, i) => i !== idx),
    });
  };

  const addAnswer = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { answers: [...q.answers, ""] });
  };
  const updateAnswer = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.map((a, i) => (i === idx ? val : a)),
    });
  };
  const removeAnswer = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, {
      answers: q.answers.filter((_, i) => i !== idx),
    });
  };

  // Fill‐in‐the‐blank fallback
  const addBlank = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    const n = q.answers.length + 1;
    const tag = `[blank ${n}]`;
    updateQuestion(id, {
      prompt: q.prompt + tag,
      answers: [...q.answers, ""],
    });
  };

  // Short/Long answer min/max
  const changeMin = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    updateQuestion(id, { minChars: Math.max(1, q.minChars + d) });
  };
  const changeMax = (id: string, d: number) => {
    const q = questions.find((q) => q.id === id)!;
    const cap = q.type === "SHORT_ANSWER" ? 200 : 2000;
    updateQuestion(id, { maxChars: Math.min(cap, q.maxChars + d) });
  };

  // Rating scale
  const changeScoreFrom = (id: string, v: number) =>
    updateQuestion(id, { scoreFrom: v });
  const changeScoreTo = (id: string, v: number) =>
    updateQuestion(id, { scoreTo: v });
  const changeLowLabel = (id: string, v: string) =>
    updateQuestion(id, { lowLabel: v });
  const changeHighLabel = (id: string, v: string) =>
    updateQuestion(id, { highLabel: v });

  // Save

  const handleSave = () => {
    const titleError = validateTitle(title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    // 2️⃣ questions
    if (!allQuestionsValid(questions)) {
      // find first invalid
      const { idx, err } = questions
        .map((q, i) => ({ idx: i + 1, err: validateQuestion(q) }))
        .find((x) => x.err !== null)!;
      toast.error(`Question ${idx}: ${err}`);
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("projectId", poll.projectId!);
    formData.append("createdBy", poll.createdBy._id);
    formData.append("createdByRole", poll.createdByRole);

    const questionsPayload = questions.map((q) => ({
      // copy everything else
      ...q,
      // drop the File object
      imageFile: undefined,
      // but keep tempImageName if there is one
      ...(q.imageFile ? { tempImageName: q.tempImageName } : {}),
    }));

    formData.append("questions", JSON.stringify(questionsPayload));

    // now append the raw files under the same fieldname "images"
    questions.forEach((q) => {
      if (q.imageFile && q.tempImageName) {
        formData.append("images", q.imageFile, q.tempImageName);
      }
    });

    // finally call the mutation
    updateMutation.mutate({ id: poll._id, formData });
  };

  const isUpdating = updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) onClose();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center mt-5">
            <DialogTitle>Edit Poll</DialogTitle>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Poll title"
            className="mt-1"
            disabled={isUpdating}
          />
        </div>

        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {questions.map((q) => (
            <Card key={q.id} className="border">
              <CardContent className="space-y-4">
                {/* prompt & type */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Question</Label>
                    <Input
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestion(q.id, { prompt: e.target.value })
                      }
                      disabled={isUpdating}
                      className="mt-1"
                      placeholder={
                        q.type === "FILL_IN_BLANK"
                          ? "Enter text with [blank] tags"
                          : "Enter question text"
                      }
                    />
                  </div>
                  <div className="w-48">
                    <Label>Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val) =>
                        updateType(q.id, val as QuestionType)
                      }
                      disabled={isUpdating}
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

                {/* per-type UI */}
                {q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER" ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-2">
                      <Label>Min Characters</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => changeMin(q.id, -1)}
                        disabled={isUpdating}
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center">{q.minChars}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => changeMin(q.id, +1)}
                        disabled={isUpdating}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Max Characters</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isUpdating}
                        onClick={() => changeMax(q.id, -1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-12 text-center">{q.maxChars}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isUpdating}
                        onClick={() => changeMax(q.id, +1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ) : q.type === "SINGLE_CHOICE" ? (
                  <SingleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswer={q.correctAnswer!}
                    showDropdown={q.showDropdown!}
                    onAnswerChange={(i, v) => updateChoice(q.id, i, v)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(i) => removeChoice(q.id, i)}
                    onToggleShowDropdown={(v) =>
                      updateQuestion(q.id, { showDropdown: v })
                    }
                    onCorrectAnswerChange={(i) =>
                      updateQuestion(q.id, { correctAnswer: i })
                    }
                    disabled={isUpdating}
                  />
                ) : q.type === "MULTIPLE_CHOICE" ? (
                  <MultipleChoiceQuestion
                    id={q.id}
                    answers={q.answers}
                    correctAnswers={q.correctAnswers!}
                    onAnswerChange={(i, v) => updateChoice(q.id, i, v)}
                    onAddChoice={() => addChoice(q.id)}
                    onRemoveChoice={(i) => removeChoice(q.id, i)}
                    onToggleCorrectAnswer={(i, checked) => {
                      const next = checked
                        ? [...(q.correctAnswers || []), i]
                        : (q.correctAnswers || []).filter((x) => x !== i);
                      updateQuestion(q.id, { correctAnswers: next });
                    }}
                    disabled={isUpdating}
                  />
                ) : q.type === "MATCHING" ? (
                  <MatchingQuestion
                    // id={q.id}
                    options={q.options}
                    answers={q.answers}
                    onOptionChange={(i, v) => updateOption(q.id, i, v)}
                    onAddOption={() => addOption(q.id)}
                    onRemoveOption={(i) => removeOption(q.id, i)}
                    onAnswerChange={(i, v) => updateAnswer(q.id, i, v)}
                    onAddAnswer={() => addAnswer(q.id)}
                    onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                    disabled={isUpdating}
                  />
                ) : q.type === "RANK_ORDER" ? (
                  <RankOrderQuestion
                    // id={q.id}
                    rows={q.rows}
                    columns={q.columns}
                    onRowChange={(i, v) =>
                      updateQuestion(q.id, {
                        rows: q.rows.map((r, j) => (j === i ? v : r)),
                      })
                    }
                    onAddRow={() =>
                      updateQuestion(q.id, { rows: [...q.rows, ""] })
                    }
                    onRemoveRow={(i) =>
                      updateQuestion(q.id, {
                        rows: q.rows.filter((_, j) => j !== i),
                      })
                    }
                    onColumnChange={(i, v) =>
                      updateQuestion(q.id, {
                        columns: q.columns.map((c, j) => (j === i ? v : c)),
                      })
                    }
                    onAddColumn={() =>
                      updateQuestion(q.id, { columns: [...q.columns, ""] })
                    }
                    onRemoveColumn={(i) =>
                      updateQuestion(q.id, {
                        columns: q.columns.filter((_, j) => j !== i),
                      })
                    }
                    disabled={isUpdating}
                  />
                ) : q.type === "RATING_SCALE" ? (
                  <RatingScaleQuestion
                    // id={q.id}
                    scoreFrom={q.scoreFrom}
                    scoreTo={q.scoreTo}
                    lowLabel={q.lowLabel}
                    highLabel={q.highLabel}
                    onScoreFromChange={(v) => changeScoreFrom(q.id, v)}
                    onScoreToChange={(v) => changeScoreTo(q.id, v)}
                    onLowLabelChange={(v) => changeLowLabel(q.id, v)}
                    onHighLabelChange={(v) => changeHighLabel(q.id, v)}
                    disabled={isUpdating}
                  />
                ) : (
                  q.type === "FILL_IN_BLANK" && (
                    <FillInBlankQuestion
                      // id={q.id}
                      answers={q.answers}
                      onAddBlank={() => addBlank(q.id)}
                      onAnswerChange={(i, v) => updateAnswer(q.id, i, v)}
                      onRemoveAnswer={(i) => removeAnswer(q.id, i)}
                      disabled={isUpdating}
                    />
                  )
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.required}
                    disabled={isUpdating}
                    onCheckedChange={(v) =>
                      updateQuestion(q.id, { required: v })
                    }
                  />
                  <span>Required</span>
                </div>
                <div className="flex items-center gap-2">
                  {q.imageUrl && !q.imageFile && (
                    <Image
                      src={q.imageUrl}
                      alt="Question image"
                      height={64}
                      width={64}
                      className="max-h-16 rounded-md mr-2"
                    />
                  )}

                  {/* ← this label/file-input combo */}
                  <label className="flex items-center gap-1 cursor-pointer text-sm text-gray-600">
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        updateQuestion(q.id, {
                          imageFile: file,
                          tempImageName: file.name,
                        });
                      }}
                      disabled={isUpdating}
                    />
                    {q.imageFile
                      ? q.imageFile.name
                      : q.tempImageName
                      ? q.tempImageName
                      : q.imageUrl
                      ? "Replace image"
                      : "Attach image"}
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={isUpdating}>
                        <MoreHorizontal />
                      </Button>
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

        <div className="mt-6 text-center">
          <Button onClick={addQuestion} disabled={isUpdating}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
