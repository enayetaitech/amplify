// components/projects/sessions/EditSessionModal.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
// using controlled inputs instead of react-hook-form
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useState } from "react";
import { ISession } from "@shared/interface/SessionInterface";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { durations } from "constant";
import { useParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { IProject } from "@shared/interface/ProjectInterface";
import api from "lib/api";
import { toast } from "sonner";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { businessDaysBetween } from "utils/countDaysBetween";

// Local form value type (kept exported for callers)
export type EditSessionValues = {
  title: string;
  date: string;
  startTime: string;
  duration: number;
  moderators: string[];
};

interface EditSessionModalProps {
  open: boolean;
  session: ISession | null;
  onClose: () => void;
  onSave: (values: EditSessionValues) => void;
  isSaving: boolean;
}

export default function EditSessionModal({
  open,
  session,
  onClose,
  onSave,
  isSaving,
}: EditSessionModalProps) {
  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;

  const { data: project } = useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  // Load available moderators for the project (mirror Add flow)
  const { data: moderatorsData } = useQuery<
    { data: IModerator[]; meta: { totalItems: number } },
    Error
  >({
    queryKey: ["moderators", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/moderators/project/${projectId}`, {
          params: { page: 1, limit: 100 },
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // Only include Admins and Moderators (exclude Observers)
  const availableModerators = (moderatorsData?.data || []).filter(
    (m) =>
      Array.isArray(m.roles) &&
      (m.roles.includes("Admin") || m.roles.includes("Moderator"))
  );

  // Normalize moderators into a string[] of moderator IDs in case
  // the incoming session has populated moderator objects
  function normalizeModeratorIds(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    const extractId = (item: unknown): string | null => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const v = rec["_id"];
        if (typeof v === "string") return v;
      }
      return null;
    };
    const ids = input
      .map((it) => extractId(it))
      .filter((v): v is string => typeof v === "string");
    // de-duplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(id);
      }
    }
    return unique;
  }

  // Replace RHF with local controlled state to make debugging straightforward
  const [values, setValues] = useState<EditSessionValues>({
    title: session?.title ?? "",
    date: session
      ? new Date(session.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    startTime: session?.startTime ?? "",
    duration: session?.duration ?? 30,
    moderators: normalizeModeratorIds(session?.moderators as unknown),
  });

  React.useEffect(() => {
    if (session) {
      setValues({
        title: session.title,
        date: new Date(session.date).toISOString().slice(0, 10),
        startTime: session.startTime,
        duration: session.duration,
        moderators: normalizeModeratorIds(session.moderators as unknown),
      });
    }
  }, [session]);

  // validate duration against allowed options to prevent transient invalid states (e.g., "")
  const isValidDuration = (n: unknown): n is number =>
    typeof n === "number" &&
    Number.isFinite(n) &&
    durations.some((d) => d.minutes === n);

  // compute display value to avoid flashes when state hasn't synced yet
  const displayDuration = isValidDuration(values.duration)
    ? values.duration
    : isValidDuration((session as unknown as { duration?: unknown })?.duration)
    ? (session as unknown as { duration: number }).duration
    : 30;
  // count business days between today and `target`

  const onSubmit = (data: EditSessionValues) => {
    console.log("data", data);
    console.log("on submit clicked");
    // only enforce for Concierge
    if (project?.service === "Concierge") {
      const selDate = new Date(data.date);
      const diff = businessDaysBetween(selDate);

      if (diff <= 3) {
        toast.error(
          "You have selected Concierge Service for your project. Sessions scheduled within 3 business days cannot be cancelled or rescheduled. Please contact info@amplifyresearch.com to discuss any last minute scheduling needs."
        );
        return;
      }
    }
    onSave(data);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-title"
        aria-describedby="edit-session-desc"
        className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        <h2
          id="edit-session-title"
          className="text-lg leading-none font-semibold"
        >
          Edit Session
        </h2>
        <p id="edit-session-desc" className="text-sm text-muted-foreground">
          Update session details. Project time zone is locked; breakout room is
          not editable here.
        </p>
        <form
          id="edit-session-form"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("form submit click");
            onSubmit(values);
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <label className="font-medium">Title</label>
            <Input
              placeholder="Session title"
              value={values.title}
              disabled={isSaving}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Date</label>
            <Input
              type="date"
              disabled={isSaving}
              value={values.date}
              onChange={(e) => setValues({ ...values, date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Start Time</label>
            <Input
              type="time"
              value={values.startTime}
              disabled={isSaving}
              onChange={(e) =>
                setValues({ ...values, startTime: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Duration</label>
            {/* prefer controlled state but fall back to incoming session to avoid flashes */}
            <Select
              value={String(displayDuration)}
              onValueChange={(val) => {
                const parsed = Number(val);
                // Ignore invalid/empty values that can momentarily occur
                if (!Number.isFinite(parsed)) return;
                if (!durations.some((d) => d.minutes === parsed)) return;
                setValues((prev) => ({ ...prev, duration: parsed }));
              }}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d.minutes} value={String(d.minutes)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Moderators</label>
            <MultiSelectDropdown
              moderators={availableModerators}
              selected={values.moderators}
              onChange={(ids) => setValues({ ...values, moderators: ids })}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
