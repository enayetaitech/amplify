"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";

export interface AddModeratorValues {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  roles: string[];
}

interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: AddModeratorValues) => Promise<void>;
}

export default function AddModeratorModal({
  open,
  onClose,
  onSave,
}: AddModeratorModalProps) {
  const form = useForm<AddModeratorValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      roles: [],
    },
  });

    const watchedRoles = form.watch("roles");

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [prevRoles, setPrevRoles] = useState<string[]>([]);

  const handleRoleChange = (role: string, checked: boolean) => {
    const current = form.getValues("roles");
    if (role === "Admin" && checked) {
      setPrevRoles(current);
      setPendingRole("Admin");
      setIsConfirmOpen(true);
    } else {
      form.setValue(
        "roles",
        checked ? [...current, role] : current.filter((r) => r !== role)
      );
    }
  };

  const onConfirm = (yes: boolean) => {
    if (yes && pendingRole) {
      form.setValue("roles", [...prevRoles, pendingRole]);
    } else {
      form.setValue("roles", prevRoles);
    }
    setPendingRole(null);
    setIsConfirmOpen(false);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await onSave(values);
    form.reset();
    onClose();
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => val || onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Moderator</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Roles */}
              <div className="space-y-2">
                <Label>Role</Label>
                {["Admin", "Moderator", "Observer"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      checked={watchedRoles.includes(role)}
                      onCheckedChange={(checked) =>
                        handleRoleChange(role, !!checked)
                      }
                    />
                    <span>{role}</span>
                  </div>
                ))}
                <FormMessage name="roles" />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

     <ConfirmationModalComponent
        open={isConfirmOpen}
        heading="Confirm Admin Role"
        text="Are you sure you want to add this person as an Admin for this project? Adding an Admin authorizes this individual to incur charges on your behalf."
        onCancel={() => onConfirm(false)}
        onYes={() => onConfirm(true)}
      />
    </>
  );
}
