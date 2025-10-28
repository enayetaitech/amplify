"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditAdminUserSchema } from "@/schemas/admin";
import { z } from "zod";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: string;
};

type Props = {
  user: User;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
};

export function EditUserDialog({ user, onOpenChange, onSaved }: Props) {
  const form = useForm<z.infer<typeof EditAdminUserSchema>>({
    resolver: zodResolver(EditAdminUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
    },
  });

  const saveMut = useMutation({
    mutationFn: async (values: z.infer<typeof EditAdminUserSchema>) => {
      await api.patch(`/api/v1/admin/users/${user._id}`, values);
    },
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
    },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => saveMut.mutate(v))}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First name</Label>
              <Input {...form.register("firstName")} />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label>Last name</Label>
              <Input {...form.register("lastName")} />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input {...form.register("phoneNumber")} />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div>
              <Label>Company</Label>
              <Input {...form.register("companyName")} />
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMut.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
