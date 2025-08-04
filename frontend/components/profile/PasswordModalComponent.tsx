"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import {
  ChangePasswordInputs,
  changePasswordSchema,
} from "../../schemas/changePasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import useChangePassword from "../../hooks/useChangePassword";
import { Form } from "../ui/form";
import PasswordField from "../createAccount/PasswordField";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

const PasswordModalComponent: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  id,
}) => {
  const form = useForm<ChangePasswordInputs>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: {},
  } = form;
  const { mutate: changePassword, isPending } = useChangePassword();

  const onSubmit = (values: ChangePasswordInputs) => {
    changePassword(
      {
        userId: id,
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[420px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#031F3A] font-semibold">
            Change Password
          </DialogTitle>
          <DialogDescription className="text-[11px] text-[#AFAFAF]">
            Your new password must be different from previously used passwords.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <PasswordField
              control={control}
              name="currentPassword"
              label="Current Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <PasswordField
              control={control}
              name="newPassword"
              label="New Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <PasswordField
              control={control}
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button
                type="button"
                variant="cancel"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
                className="rounded-xl shadow-[0px_3px_6px_#031F3A59]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                className="rounded-xl shadow-[0px_3px_6px_#031F3A59] text-base"
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModalComponent;
