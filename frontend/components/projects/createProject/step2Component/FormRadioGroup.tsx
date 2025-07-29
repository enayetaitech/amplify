import { Step2FormValues } from "@shared/interface/CreateProjectInterface";
import { FieldErrors, UseFormRegister } from "react-hook-form";

export const FormRadioGroup = ({
  label,
  name,
  options,
  register,
  error,
  disabled
}: {
  label: string;
  name: keyof Step2FormValues;
  options: string[];
  register: UseFormRegister<Step2FormValues>;
  error?: FieldErrors<Step2FormValues>[keyof Step2FormValues];
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center gap-6 mt-1">
      {options.map((val) => (
        <label key={val} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value={val}
            {...register(name, { required: true })}
            className="accent-custom-orange-1"
            disabled={disabled}
          />
          <span className="text-sm capitalize">{val}</span>
        </label>
      ))}
    </div>
    {error && <p className="text-red-500 text-xs">Please select an option</p>}
  </div>
);