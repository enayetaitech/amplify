// components/createAccount/PasswordField.tsx
"use client";

import React, { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import {
  Control,
  FieldValues,
  Path,
} from "react-hook-form";

interface PasswordFieldProps<TFieldValues extends FieldValues> {
  /** the RHF control object */
  control: Control<TFieldValues>;
  /** the field name – must be a key of TFieldValues */
  name: Path<TFieldValues>;
  /** visible label text */
  label: string;
  /** placeholder inside the <Input> */
  placeholder?: string;
  /** extra className on the FormItem (e.g. for flex‐layout) */
  className?: string;
  disabled?: boolean;
}

export default function PasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = "",
  className = "",
  disabled = false,
}: PasswordFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                {...field}
                disabled={disabled}
                 onCopy={(e) => e.preventDefault()}
               onPaste={(e) => e.preventDefault()}
               onCut={(e) => e.preventDefault()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full pr-2"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
