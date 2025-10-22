"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Schema = z
  .object({
    password: z
      .string()
      .min(9, "Minimum 9 characters")
      .regex(/[A-Z]/, "Must include uppercase letter")
      .regex(/[a-z]/, "Must include lowercase letter")
      .regex(/[0-9]/, "Must include a number")
      .regex(/[^A-Za-z0-9]/, "Must include a special character"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export default function SetNewPasswordClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof Schema>) {
    setError(null);
    try {
      await api.post("/api/v1/users/reset-password", {
        token,
        newPassword: values.password,
      });
      setOk(true);
      toast.success("Password updated");
      setTimeout(() => router.push("/login"), 1000);
    } catch (e) {
      const msg =
        (e as { message?: string })?.message || "Failed to set password";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">Set your password</h1>
        {!token && (
          <p className="text-sm text-red-600">Missing or invalid link.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && (
          <p className="text-sm text-green-600">
            Password updated. Redirecting…
          </p>
        )}
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Label>Password</Label>
            <Input type="password" {...form.register("password")} />
            {form.formState.errors.password?.message && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" {...form.register("confirm")} />
            {form.formState.errors.confirm?.message && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.confirm.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!token}>
            Set Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
