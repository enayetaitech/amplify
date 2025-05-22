"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import { IPoll } from "@shared/interface/PollInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import CustomButton from "components/shared/CustomButton";
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
  Trash2,
  TypeIcon,
  Upload,
} from "lucide-react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter } from "components/ui/card";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useGlobalContext } from "context/GlobalContext";
import { toast } from "sonner";
import { AxiosError } from "axios";

type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "RANK_ORDER"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "FILL_IN_BLANK"
  | "RATING_SCALE";

interface DraftQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  answers: string[];
  rows: string[];
  columns: string[];
  required: boolean;
  correctAnswer: number;
  showDropdown: boolean;
  correctAnswers: number[];
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
  minChars: number;
  maxChars: number;
}

type CreatePollPayload = {
  projectId: string;
  sessionId?: string;
  title: string;
  questions: APIPollQuestion[];
  createdBy: string;
  createdByRole: string;
};

type APIPollQuestion =
  | (DraftQuestion & {
      /* everything except RANK_ORDER */
    })
  | {
      /* base fields */
      id: string;
      prompt: string;
      required: boolean;
      type: "RANK_ORDER";
      rows: string[];
      columns: string[];
    };

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

const defaultQuestion = (): DraftQuestion => ({
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

  // rating defaults:
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
});

interface CreatePollResponse {
  data: IPoll
}

const Polls = () => {
  const { projectId } = useParams() as { projectId?: string };
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [
    {
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

  // rating defaults:
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
    },
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
    onError: (err) => {
      console.log("error message", err.message);
      toast.error(error instanceof Error ? error.message : "Failed to create poll");
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

  const {
    data: polls,
    isLoading,
    error,
  } = useQuery<IPoll[], Error>({
    queryKey: ["polls", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/polls/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  console.log("Polls", polls);

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      {
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

  // rating defaults:
  scoreFrom: 0,
  scoreTo: 10,
  lowLabel: "",
  highLabel: "",
      },
    ]);
  };

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  const duplicateQuestion = (id: string) => {
    setQuestions((qs) => {
      const orig = qs.find((q) => q.id === id)!;
      return [...qs, { ...orig, id: crypto.randomUUID() }];
    });
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
  const q = questions.find((x) => x.id === id)!
  const n = (q.answers || []).length + 1
  const tag = `<blank ${n}>`

  const input = inputRefs.current[id]
  if (input) {
    // 1️⃣ Grab the raw value
    const value = input.value

    // 2️⃣ Null-coalesce onto the ends
    const start = input.selectionStart ?? value.length
    const end   = input.selectionEnd   ?? value.length

    // 3️⃣ Split/insert
    const before = value.slice(0, start)
    const after  = value.slice(end)
    const newPrompt = before + tag + after

    updateQuestion(id, {
      prompt: newPrompt,
      answers: [...(q.answers || []), ""],
    })

    // 4️⃣ restore focus/caret
    setTimeout(() => {
      input.focus()
      const pos = before.length + tag.length
      input.setSelectionRange(pos, pos)
    })
  } else {
    // fallback
    updateQuestion(id, {
      prompt: q.prompt + tag,
      answers: [...(q.answers || []), ""],
    })
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

  if (isLoading) return <p>Loading polls…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Polls</HeadingBlue25px>
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
                    {/* Question + Type */}
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
                      <div className="space-y-4">
                        {q.answers.map((ans, i) => (
                          <div
                            key={i}
                            className="relative group flex items-center space-x-2"
                          >
                            {/* radio for correctAnswer */}
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === i}
                              onChange={() =>
                                updateQuestion(q.id, { correctAnswer: i })
                              }
                              className="cursor-pointer"
                            />

                            <Input
                              value={ans}
                              onChange={(e) =>
                                updateChoice(q.id, i, e.target.value)
                              }
                              placeholder={`Enter choice ${i + 1}`}
                              className="pr-10 flex-1"
                            />

                            <CustomButton
                              icon={<Trash2 />}
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChoice(q.id, i)}
                              className="absolute right-2 top-1/2 -translate-y-1/2
                     opacity-0 group-focus-within:opacity-100
                     transition-opacity"
                            />
                          </div>
                        ))}

                        {/* Show dropdown toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={q.showDropdown!}
                            onCheckedChange={(v) =>
                              updateQuestion(q.id, { showDropdown: v })
                            }
                          />
                          <span>Show dropdown</span>
                        </div>

                        <CustomButton
                          text="+ Add Choice"
                          variant="outline"
                          size="sm"
                          onClick={() => addChoice(q.id)}
                        />
                      </div>
                    ) : q.type === "MULTIPLE_CHOICE" ? (
                      <div className="space-y-4">
                        {q.answers.map((ans, i) => (
                          <div
                            key={i}
                            className="relative group flex items-center space-x-2"
                          >
                            {/* checkbox for correctAnswers */}
                            <input
                              type="checkbox"
                              checked={q.correctAnswers!.includes(i)}
                              onChange={() => {
                                const next = q.correctAnswers!.includes(i)
                                  ? q.correctAnswers!.filter((x) => x !== i)
                                  : [...(q.correctAnswers || []), i];
                                updateQuestion(q.id, { correctAnswers: next });
                              }}
                              className="cursor-pointer"
                            />

                            <Input
                              value={ans}
                              onChange={(e) =>
                                updateChoice(q.id, i, e.target.value)
                              }
                              placeholder={`Enter choice ${i + 1}`}
                              className="pr-10 flex-1"
                            />

                            <CustomButton
                              icon={<Trash2 />}
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChoice(q.id, i)}
                              className="absolute right-2 top-1/2 -translate-y-1/2
                     opacity-0 group-focus-within:opacity-100
                     transition-opacity"
                            />
                          </div>
                        ))}

                        <CustomButton
                          text="+ Add Choice"
                          variant="outline"
                          size="sm"
                          onClick={() => addChoice(q.id)}
                        />
                      </div>
                    ) : q.type === "MATCHING" ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label>Options</Label>
                          {q.options.map((opt, i) => (
                            <div key={i} className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <Input
                                className="pl-8 pr-10 mt-1"
                                value={opt}
                                onChange={(e) =>
                                  updateOption(q.id, i, e.target.value)
                                }
                                placeholder={`Option ${i + 1}`}
                              />
                              <CustomButton
                                icon={<Trash2 />}
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(q.id, i)}
                                className="absolute right-2 top-1/2 -translate-y-1/2
                                           opacity-0 group-focus-within:opacity-100
                                           transition-opacity"
                              />
                            </div>
                          ))}
                          <CustomButton
                            text="+ Add Choice"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(q.id)}
                          />
                        </div>
                        <div className="space-y-4">
                          <Label>Answers</Label>
                          {q.answers.map((ans, i) => (
                            <div key={i} className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {i + 1}.
                              </span>
                              <Input
                                className="pl-8 pr-10 mt-1"
                                value={ans}
                                onChange={(e) =>
                                  updateAnswer(q.id, i, e.target.value)
                                }
                                placeholder={`Answer ${i + 1}`}
                              />
                              <CustomButton
                                icon={<Trash2 />}
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAnswer(q.id, i)}
                                className="absolute right-2 top-1/2 -translate-y-1/2
                                           opacity-0 group-focus-within:opacity-100
                                           transition-opacity"
                              />
                            </div>
                          ))}
                          <CustomButton
                            text="+ Add Answer"
                            variant="outline"
                            size="sm"
                            onClick={() => addAnswer(q.id)}
                          />
                        </div>
                      </div>
                    ) : q.type === "RANK_ORDER" ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label>Rows</Label>
                          {q.options.map((row, i) => (
                            <div key={i} className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {i + 1}.
                              </span>
                              <Input
                                className="pl-8 pr-10 mt-1"
                                value={row}
                                onChange={(e) =>
                                  updateOption(q.id, i, e.target.value)
                                }
                                placeholder={`Row ${i + 1}`}
                              />
                              <CustomButton
                                icon={<Trash2 />}
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(q.id, i)}
                                className="absolute right-2 top-1/2 -translate-y-1/2
                                           opacity-0 group-focus-within:opacity-100
                                           transition-opacity"
                              />
                            </div>
                          ))}
                          <CustomButton
                            text="+ Add row"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(q.id)}
                          />
                        </div>
                        <div className="space-y-4">
                          <Label>Columns</Label>
                          {q.answers.map((col, i) => (
                            <div key={i} className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {i + 1}.
                              </span>
                              <Input
                                className="pl-8 pr-10 mt-1"
                                value={col}
                                onChange={(e) =>
                                  updateAnswer(q.id, i, e.target.value)
                                }
                                placeholder={`Column ${i + 1}`}
                              />
                              <CustomButton
                                icon={<Trash2 />}
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAnswer(q.id, i)}
                                className="absolute right-2 top-1/2 -translate-y-1/2
                                           opacity-0 group-focus-within:opacity-100
                                           transition-opacity"
                              />
                            </div>
                          ))}
                          <CustomButton
                            text="+ Add column"
                            variant="outline"
                            size="sm"
                            onClick={() => addAnswer(q.id)}
                          />
                        </div>
                      </div>
                    ): q.type === "RATING_SCALE" ? (
                      <div className="space-y-4">
                        {/* 1) Score from / to */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center gap-2">
                            <Label>Score from</Label>
                            <CustomButton
                              icon={<Minus />}
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  scoreFrom: Math.max(
                                    0,
                                    (q.scoreFrom ?? 0) - 1
                                  ),
                                })
                              }
                            />
                            <span className="w-6 text-center">
                              {q.scoreFrom}
                            </span>
                            <CustomButton
                              icon={<Plus />}
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  scoreFrom: (q.scoreFrom ?? 0) + 1,
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label>to</Label>
                            <CustomButton
                              icon={<Minus />}
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  scoreTo: Math.max(
                                    (q.scoreFrom ?? 0),
                                    (q.scoreTo ?? 0) - 1
                                  ),
                                })
                              }
                            />
                            <span className="w-6 text-center">{q.scoreTo}</span>
                            <CustomButton
                              icon={<Plus />}
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  scoreTo: (q.scoreTo ?? 0) + 1,
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* 2) Low / High labels */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label>Low score label</Label>
                            <Input
                              value={q.lowLabel}
                              onChange={(e) =>
                                updateQuestion(q.id, {
                                  lowLabel: e.target.value,
                                })
                              }
                              placeholder="e.g. Not likely"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>High score label</Label>
                            <Input
                              value={q.highLabel}
                              onChange={(e) =>
                                updateQuestion(q.id, {
                                  highLabel: e.target.value,
                                })
                              }
                              placeholder="e.g. Extremely likely"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ) :  (
                      q.type === "FILL_IN_BLANK" && (
                        <div className="space-y-4">
                          {/* 1) + Add Blank button */}
                          <div>
                            <CustomButton
                              text="+ Add Blank"
                              variant="outline"
                              size="sm"
                              onClick={() => addBlank(q.id)}
                            />
                          </div>

                          {/* 2) Answers for each <blank> */}
                          <div className="space-y-2">
                            <Label>Answers</Label>
                            {q.answers.map((ans, idx) => (
                              <div
                                key={idx}
                                className="relative group flex items-center space-x-2"
                              >
                                {/* numbering */}
                                <span className="text-gray-500">
                                  {idx + 1}.
                                </span>

                                {/* text input */}
                                <Input
                                  value={ans}
                                  onChange={(e) =>
                                    updateAnswer(q.id, idx, e.target.value)
                                  }
                                  placeholder={`Answer ${idx + 1}`}
                                  className="pr-10 flex-1"
                                />

                                {/* delete blank-answer button */}
                                <CustomButton
                                  icon={<Trash2 />}
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAnswer(q.id, idx)}
                                  className="
              absolute right-2 top-1/2 -translate-y-1/2
              opacity-0 group-focus-within:opacity-100
              transition-opacity
            "
                                />
                              </div>
                            ))}

                            {/* 3) Add another answer */}
                            <CustomButton
                              text="+ Add Answer"
                              variant="outline"
                              size="sm"
                              onClick={() => addAnswer(q.id)}
                            />
                          </div>
                        </div>
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
                      <CustomButton
                        icon={<Upload />}
                        variant="ghost"
                        size="icon"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <CustomButton
                            icon={<MoreHorizontal />}
                            variant="ghost"
                            size="icon"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => removeQuestion(q.id)}
                          >
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
      </div>
    </ComponentContainer>
  );
};

export default Polls;
