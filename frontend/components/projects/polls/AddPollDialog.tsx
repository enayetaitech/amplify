import { Switch } from "@/components/ui/switch";
import {
  CreatePollPayload,
  DraftQuestion,
  IPoll,
  QuestionType,
} from "@shared/interface/PollInterface";
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
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import MatchingQuestion from "./MatchingQuestion";
import RankOrderQuestion from "./RankOrderQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import RatingScaleQuestion from "./RatingScaleQuestion";
import {
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noSpecialChars,
  validate,
} from "schemas/validators";

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

export type WithImage = {
  imageFile?: File;
  tempImageName?: string;
};

type DraftWithImage = DraftQuestion & WithImage;

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

interface CreatePollResponse {
  data: IPoll;
}

// Returns an error message or null if that question is valid
export const validateQuestion = (q: DraftWithImage): string | null => {
  const prompt = q.prompt.trimEnd();

  // 0) Prompt must not be blank
  if (!prompt) {
    return "Question text is required";
  }
  // 1) No leading space
  if (!noLeadingSpace(prompt)) {
    return "Question must not start with a space";
  }
  // 2) No multiple spaces
  if (!noMultipleSpaces(prompt)) {
    return "Question must not contain consecutive spaces";
  }

  switch (q.type) {
    case "SINGLE_CHOICE":
      if (q.answers.length < 2) return "Need at least two choices";
      if (q.answers.some((a) => !a.trim())) return "All choices must be filled";
      if (q.correctAnswer == null) return "Select a correct answer";
      return null;

    case "MULTIPLE_CHOICE":
      if (q.answers.length < 2) return "Need at least two choices";
      if (q.answers.some((a) => !a.trim())) return "All choices must be filled";
      if (!q.correctAnswers?.length)
        return "Select at least one correct answer";
      return null;

     case "MATCHING":
      if (q.options.length < 1 || q.answers.length < 1) {
        return "Need at least one matching pair";
      }
      if (q.options.length !== q.answers.length) {
        return "Options and answers count must match";
      }
      if (
        q.options.some(o => !o.trim()) ||
        q.answers.some(a => !a.trim())
      ) {
        return "All matching pairs must be filled";
      }
      return null;

    case "RANK_ORDER":
  // 1) at least two rows
  if (q.rows.length < 2) {
    return "Need at least two items to rank";
  }
  // 2) no empty row labels
  if (q.rows.some(r => !r.trim())) {
    return "All rank items must be filled";
  }
  // 3) at least two columns
  if (q.columns.length < 2) {
    return "Need at least two columns";
  }
  // 4) no empty column labels
  if (q.columns.some(c => !c.trim())) {
    return "All rank columns must be filled";
  }
  // 5) rows & columns same count
  if (q.rows.length !== q.columns.length) {
    return "Rows and columns count must match";
  }
  return null;


    case "FILL_IN_BLANK":
      const blanks = Array.from(q.prompt.matchAll(/\[blank \d+\]/g)).length;
      if (blanks === 0) {
        return "Insert at least one blank (`[blank N]`) tag";
      }
      if (q.answers.length !== blanks) {
        return "Number of answers must match number of blanks";
      }
      if (q.answers.some(a => !a.trim())) {
        return "All blank answers must be filled";
      }
      return null;

    case "SHORT_ANSWER":
    case "LONG_ANSWER":
      if (q.minChars! > q.maxChars!)
        return "Min characters cannot exceed max characters";
      return null;

    case "RATING_SCALE":
      if (q.scoreFrom == null || q.scoreTo == null)
        return "Specify both score From and To";
      if (q.scoreFrom! >= q.scoreTo!)
        return "`scoreFrom` must be less than `scoreTo`";
      return null;

    default:
      return null;
  }
};

// Runs validateQuestion on every question; returns true if all pass
 const titleValidators = [
    noLeadingSpace,
    noMultipleSpaces,
    noSpecialChars,
    lettersAndSpaces,
  ];

  export const validateTitle = (t: string): string | null => {
    if (!t.trim()) return "Title is required";
    if (!validate(t, titleValidators))
      return "Title must only contain letters and single spaces, with no leading/multiple spaces or special characters";
    return null;
  };

export function allQuestionsValid(qs: DraftQuestion[]) {
  return qs.every((q) => validateQuestion(q) === null);
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
  const [questions, setQuestions] = useState<DraftWithImage[]>(() => [
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
    mutationFn: () => {
      const formData = new FormData();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const questionsPayload = questions.map(({ imageFile, ...rest }) => rest);

      formData.append("questions", JSON.stringify(questionsPayload));
      formData.append("projectId", projectId);
      formData.append("title", title.trim());
      formData.append("createdBy", user._id);
      formData.append("createdByRole", user.role);

      // attach actual files under "images"
      questions.forEach((q) => {
        if (q.imageFile && q.tempImageName) {
          formData.append("images", q.imageFile, q.tempImageName);
        }
      });

      return api
        .post<CreatePollResponse>("/api/v1/polls", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.data);
    },

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

    const titleError = validateTitle(title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    if (!allQuestionsValid(questions)) {
      // Find the first invalid question and report its error
      const firstError = questions
        .map((q) => ({ id: q.id, err: validateQuestion(q) }))
        .find((x) => x.err !== null);
      toast.error(
        firstError
          ? `Question ${
              questions.findIndex((q) => q.id === firstError.id) + 1
            }: ${firstError.err}`
          : "Please fix the errors in your questions"
      );
      return;
    }

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

  const updateQuestion = (id: string, patch: Partial<DraftWithImage>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  const duplicateQuestion = (id: string) => {
    const orig = questions.find((q) => q.id === id)!;
    setQuestions((qs) => [
      ...qs,
      defaultQuestion({ ...orig, id: crypto.randomUUID() }),
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
      else if (type === "FILL_IN_BLANK") {
        updateQuestion(id, { type, prompt: "", answers: [] });
      }
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
    const tag = `[blank ${n}]`;

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
    <Dialog open={open} 
    onOpenChange={(nextOpen) => {
      // if we’re closing the dialog (e.g. user clicked the ×)…
      if (!nextOpen) {
        resetForm();
      }
      setOpen(nextOpen);
    }}
  >
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
            required
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
                          ? "Enter text with [blank N] tags"
                          : "Enter question text"
                      }
                      onChange={(e) =>
                        updateQuestion(q.id, { prompt: e.target.value })
                      }
                      onBlur={() => {
                        const cleaned = q.prompt.trimEnd();
                        if (cleaned !== q.prompt) {
                          updateQuestion(q.id, { prompt: cleaned });
                        }
                      }}
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
                    // id={q.id}
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
                    // id={q.id}
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
                    // id={q.id}
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
                      // id={q.id}
                      answers={q.answers}
                      onAddBlank={() => addBlank(q.id)}
                      onAnswerChange={(idx, val) =>
                        updateAnswer(q.id, idx, val)
                      }
                      onRemoveAnswer={(idx) => removeAnswer(q.id, idx)}
                      // onAddAnswer={() => addAnswer(q.id)}
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
                    />
                    {q.imageFile ? q.imageFile.name : "Attach image"}
                  </label>
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
