// components/form/TextInputField.tsx
"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import {
  Control,
  FieldValues,
  Path,
} from "react-hook-form";

interface TextInputFieldProps<TFieldValues extends FieldValues> {
  /** The RHF control object, typed to your form’s TFieldValues */
  control: Control<TFieldValues>;
  /** The field name – must be a key of TFieldValues */
  name: Path<TFieldValues>;
  /** Visible label text */
  label: string;
  /** Placeholder inside the <Input> */
  placeholder?: string;
  /** Native input type; defaults to "text" */
  type?: React.HTMLInputTypeAttribute;
  /** Extra className on the FormItem (e.g. for flex layout) */
  className?: string;
}

export default function TextInputField<
  TFieldValues extends FieldValues
>({
  control,
  name,
  label,
  placeholder = "",
  type = "text",
  className = "",
}: TextInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
