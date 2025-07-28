// components/projects/sessions/EditSessionModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ISession } from "@shared/interface/SessionInterface";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { durations, timeZones } from "constant";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IProject } from "@shared/interface/ProjectInterface";
import api from "lib/api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { businessDaysBetween } from "utils/countDaysBetween";

// 1️⃣ Define a Zod schema matching your ISession fields including timeZone
const editSessionSchema = z.object({
   title: z
    .string()
    .min(1, "Title is required")
    .trim()
    .regex(
      /^(?!.* {2,})[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/,
      "Title must not contain special characters, multiple spaces, or leading/trailing spaces"
    ),
  date: z.string(),
  startTime: z.string(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  timeZone: z.string().min(1, "Time zone is required"),
  breakoutRoom: z.boolean(),
});

export type EditSessionValues = z.infer<typeof editSessionSchema>;

interface EditSessionModalProps {
  open: boolean;
  session: ISession | null;
  onClose: () => void;
  onSave: (values: EditSessionValues) => void;
}

export default function EditSessionModal({
  open,
  session,
  onClose,
  onSave,
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

  const form = useForm<EditSessionValues>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: {
      title: session?.title ?? "",
      date: session
        ? new Date(session.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      startTime: session?.startTime ?? "",
      duration: session?.duration ?? 30,
      timeZone: session?.timeZone ?? "",
      breakoutRoom: session?.breakoutRoom ?? false,
    },
  });

  const { handleSubmit, control, reset } = form;

  React.useEffect(() => {
    if (session) {
      reset({
        title: session.title,
        date: new Date(session.date).toISOString().slice(0, 10),
        startTime: session.startTime,
        duration: session.duration,
        timeZone: session.timeZone,
        breakoutRoom: session.breakoutRoom,
      });
    }
  }, [session, reset]);

  // count business days between today and `target`

  const onSubmit = (data: EditSessionValues) => {
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg ">
        <DialogTitle>Edit Session</DialogTitle>
        <Form {...form}>
          <form
            id="edit-session-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Session title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date"
                    
                    {...field}
                    min={new Date().toISOString().split("T")[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d.minutes} value={String(d.minutes)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {`${tz.name} (UTC${tz.utc})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="breakoutRoom"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between px-1 py-2">
                  <div className="flex justify-start item-center gap-2">
                    <FormLabel className="mb-0">
                      Do you need breakout room functionality?
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info
                            size={16}
                            className="text-muted-foreground cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white text-black shadow-sm">
                          Breakout rooms allow you to split participants into
                          separate rooms during your session for smaller group
                          discussions or activities. The moderator can only be
                          present in one room at a time, but all breakout rooms
                          will be streamed to the backroom for observers to view
                          and will be recorded.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-session-form">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
