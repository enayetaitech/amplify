import { Step2FormValues } from "@shared/interface/CreateProjectInterface";
import { Input } from "components/ui/input";
import { FieldErrors, RegisterOptions, UseFormRegister } from "react-hook-form";
import { Validator } from "schemas/validators";

export type RegexRule = {
  /** must match this RegExp */
  fn: Validator;
  /** error to show if it doesn’t */
  message: string;
};

export const FormInput = ({
  label,
  type = "text",
  register,
  name,
  required,
  error,
  pattern,
  patternMessage,
  regexRules,
  disabled
}: {
  label: string;
  type?: string;
  register: UseFormRegister<Step2FormValues>;
  name: keyof Step2FormValues;
  required?: boolean;
  error?: FieldErrors<Step2FormValues>[keyof Step2FormValues];
  pattern?: RegExp;
  patternMessage?: string;
    regexRules?: RegexRule[];
    disabled?: boolean;
}) => {
  
  const validation = {
    ...(required
      ? {
          required: "This field is required",
        }
      : {}),
    ...(type === "number"
      ? {
          valueAsNumber: true,
          min: { value: 0, message: "Value cannot be negative" },
        }
      : {}),
      ...(pattern
      ? {
          pattern: {
            value: pattern,
            message: patternMessage || "Invalid format",
          },
        }
      : {}),
       ...(regexRules
      ? {
          validate: (val) => {
            const str = String(val ?? "");
            for (const { fn, message } of regexRules) {
              if (!fn(str)) return message;
            }
            return true;
          },
        }
      : {}),
  } as RegisterOptions<Step2FormValues, typeof name>;
  return (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Input
      type={type}
      {...(type === "number" ? { min: 0 } : {})}
           {...register(name, validation)}
      className="mt-1 w-full"
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs">{error?.message}</p>}
  </div>
)};