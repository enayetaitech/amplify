import { Step2FormValues } from "@shared/interface/CreateProjectInterface";
import { Input } from "components/ui/input";
import { FieldErrors, UseFormRegister } from "react-hook-form";

export const FormInput = ({
  label,
  type = "text",
  register,
  name,
  required,
  error,
}: {
  label: string;
  type?: string;
  register: UseFormRegister<Step2FormValues>;
  name: keyof Step2FormValues;
  required?: boolean;
  error?: FieldErrors<Step2FormValues>[keyof Step2FormValues];
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Input
      type={type}
      {...register(name, { required })}
      className="mt-1 w-full"
    />
    {error && <p className="text-red-500 text-xs">This field is required</p>}
  </div>
);