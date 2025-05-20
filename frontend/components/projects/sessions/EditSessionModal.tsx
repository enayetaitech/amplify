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
import { useForm} from "react-hook-form";
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

// 1️⃣ Define a Zod schema matching your ISession fields including timeZone
const editSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string(),
  startTime: z.string(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  timeZone: z.string().min(1, "Time zone is required"),
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
  const form = useForm<EditSessionValues>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: session
      ? {
          title: session.title,
          date: new Date(session.date).toISOString().slice(0, 10),
          startTime: session.startTime,
          duration: session.duration,
          timeZone: session.timeZone,
        }
      : {
          title: "",
          date: new Date().toISOString().slice(0, 10),
          startTime: "",
          duration: 30,
          timeZone: "",
        },
  });

  const { handleSubmit, control,  reset } = form;

  React.useEffect(() => {
if (session) {
 reset({
 title: session.title,
 date: new Date(session.date).toISOString().slice(0, 10),
startTime: session.startTime,
duration: session.duration,
timeZone: session.timeZone,
});
}
}, [session, reset]);

  const onSubmit = (data: EditSessionValues) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
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
                    <Input type="date" {...field} />
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
            <SelectValue
              placeholder="Select duration"
             
            />
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
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
