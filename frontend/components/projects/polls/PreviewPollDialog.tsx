// components/projects/polls/PreviewPollDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  FillInBlankQuestion,
  IPoll,
  LongAnswerQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  RankOrderQuestion,
  RatingScaleQuestion,
  ShortAnswerQuestion,
  SingleChoiceQuestion,
} from "@shared/interface/PollInterface";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Textarea } from "components/ui/textarea";
import { Input } from "components/ui/input";
import Image from "next/image";

interface PreviewPollDialogProps {
  poll: IPoll;
  onClose: () => void;
}

const PreviewPollDialog: React.FC<PreviewPollDialogProps> = ({
  poll,
  onClose,
}) => {
  const [textValues, setTextValues] = React.useState<Record<string, string>>(
    {}
  );

  const handleChange = (id: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {poll.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-8 px-2">
          {poll.questions.map((q, idx) => {
            const typeLabel =
              q.type === "SINGLE_CHOICE"
                ? "(Single choice)"
                : q.type === "MULTIPLE_CHOICE"
                ? "(Multiple choice)"
                : q.type === "SHORT_ANSWER"
                ? "(Short answer)"
                : q.type === "LONG_ANSWER"
                ? "(Long answer)"
                : q.type === "FILL_IN_BLANK"
                ? "(Fill in the blank)"
                : q.type === "RATING_SCALE"
                ? "(Rating scale)"
                : q.type === "MATCHING"
                ? "(Matching)"
                : q.type === "RANK_ORDER"
                ? "(Rank order)"
                : "";

            return (
              <div key={q._id} className="mb-5">
                <h4 className="font-semibold">
                  {idx + 1}. {q.prompt}{" "}
                  <span className="text-sm text-gray-500">{typeLabel}</span>
                </h4>

 {/* ← New: show uploaded image if present */}
      {q.image && (
        <Image
        width={200}
        height={200}
        unoptimized
          src={q.image}
          alt={`Question ${idx + 1} Illustration`}
          className="my-4 max-h-60 w-auto object-contain rounded border"
        />
      )}
                {/* SINGLE_CHOICE */}
                {q.type === "SINGLE_CHOICE" &&
                  (() => {
                    const scq = q as SingleChoiceQuestion;

                    // If showDropdown is true, render a select
                    if (scq.showDropdown) {
                       const val = textValues[q._id] ?? "";
                      return (
                       <div className="mt-2">
          <select
            id={`select-${q._id}`}
            value={val}
            onChange={(e) => handleChange(q._id, e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select
            </option>
            {scq.answers.map((ans, i) => (
              <option key={i} value={String(i)}>
                {ans}
              </option>
            ))}
          </select>
        </div>
                      );
                    }

                    // Otherwise, fall back to inline radios
                    return (
                      <RadioGroup defaultValue="">
                        <div className="mt-2 space-y-1">
                          {scq.answers.map((label: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                id={`q${idx}-opt-${i}`}
                                value={String(i)}
                              />
                              <Label htmlFor={`q${idx}-opt-${i}`}>
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    );
                  })()}

                {/* MULTIPLE_CHOICE */}
                {q.type === "MULTIPLE_CHOICE" &&
                  (() => {
                    const mcq = q as MultipleChoiceQuestion;
                    return (
                      <div className="mt-2 space-y-1">
                        {mcq.answers.map((label, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox id={`q${idx}-opt-${i}`} />
                            <Label htmlFor={`q${idx}-opt-${i}`}>{label}</Label>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                {/* SHORT_ANSWER */}
                {q.type === "SHORT_ANSWER" &&
                  (() => {
                    const sa = q as ShortAnswerQuestion;
                    const val = textValues[q._id] || "";
                    const min = sa.minChars ?? 0;
                    const max = sa.maxChars ?? 200;

                    return (
                      <div className="mt-2">
                        <Input
                          id={`short-${q._id}`}
                          value={val}
                          maxLength={max}
                          onChange={(e) => handleChange(q._id, e.target.value)}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 text-right">
                          {val.length}/{max}
                          {min > 0 && <> (min {min})</>}
                        </p>
                      </div>
                    );
                  })()}

                {/* LONG_ANSWER */}
                {q.type === "LONG_ANSWER" &&
                  (() => {
                    const la = q as LongAnswerQuestion;
                    const val = textValues[q._id] || "";
                    const min = la.minChars ?? 0;
                    const max = la.maxChars ?? 2000;

                    return (
                      <div className="mt-2">
                        <Textarea
                          id={`long-${q._id}`}
                          value={val}
                          maxLength={max}
                          placeholder="Please input"
                          onChange={(e) => handleChange(q._id, e.target.value)}
                          className="w-full h-24"
                        />
                        <p className="text-xs text-gray-500 text-right">
                          {val.length}/{max}
                          {min > 0 && <> (min {min})</>}
                        </p>
                      </div>
                    );
                  })()}

                {/* FILL_IN_BLANK */}
                {q.type === "FILL_IN_BLANK" &&
                  (() => {
                    const fib = q as FillInBlankQuestion;
                    return (
                      <div className="mt-2 space-y-4">
                        {fib.answers.map((_, i) => {
                          const key = `${q._id}-${i}`;
                          return (
                            <div key={i}>
                              <Label htmlFor={`fib-${key}`}>
                                Answer {i + 1}
                              </Label>
                              <Input
                                id={`fib-${key}`}
                                value={textValues[key] || ""}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className="w-full"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                {/* RATING_SCALE */}
                {q.type === "RATING_SCALE" &&
                  (() => {
                    const rs = q as RatingScaleQuestion;
                    const name = `rating-${q._id}`;
                    const scale: number[] = [];
                    for (let v = rs.scoreFrom; v <= rs.scoreTo; v++)
                      scale.push(v);

                    return (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {rs.lowLabel || rs.scoreFrom} …{" "}
                          {rs.highLabel || rs.scoreTo}
                        </p>
                        <div className="flex space-x-2 overflow-x-auto">
                          {scale.map((val) => (
                            <label
                              key={val}
                              className="relative inline-flex items-center justify-center rounded border px-3 py-1 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={name}
                                value={val}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <span className="relative z-10 text-sm">
                                {val}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                {/* MATCHING */}
                {q.type === "MATCHING" &&
                  (() => {
                    const mq = q as MatchingQuestion;
                    return (
                      <div className="mt-2 space-y-4">
                        {mq.options.map((option, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="font-medium">{option}</span>
                            <Select defaultValue="">
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                {mq.answers.map((ans, j) => (
                                  <SelectItem key={j} value={ans}>
                                    {ans}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                {/* RANK_ORDER */}
                {q.type === "RANK_ORDER" &&
                  (() => {
                    const rq = q as RankOrderQuestion;
                    return (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full table-fixed border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="p-2 text-left"></th>
                              {rq.columns.map((col) => (
                                <th
                                  key={col}
                                  className="p-2 text-center font-medium"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rq.rows.map((row, ri) => (
                              <tr key={ri} className="border-t">
                                <td className="p-2">{row}</td>
                                {rq.columns.map((col, ci) => (
                                  <td key={ci} className="p-2 text-center">
                                    <input
                                      type="radio"
                                      name={`rank-${q._id}-${ri}`}
                                      value={col}
                                      className="h-4 w-4"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewPollDialog;
