
import { Button } from "../ui/button";
import { Input  } from "../ui/input";
import { Textarea  } from "../ui/textarea";
import { CheckIcon, XIcon, PencilIcon } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "sonner";

type Validator = { fn: (val: string) => boolean; message: string };

interface InlineEditableProps {
  label: string;
  value: string;
  editing: boolean;
  isPending: boolean;
  validators?: Validator[];
  onStart: () => void;
  onCancel: () => void;
  onSave: (newValue: string) => void;
  /** If "input", renders a one-line Input; if "textarea", a multi-line Textarea */
  editControlType: "input" | "textarea";
}

const InlineEditable: React.FC<InlineEditableProps> = ({
  label,
  value,
  editing,
  isPending,
  validators = [],
  onStart,
  onCancel,
  onSave,
  editControlType,
}) => {
  const [draft, setDraft] = React.useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const attemptSave = () => {
    for (const { fn, message } of validators) {
      if (!fn(draft)) {
        toast.error(message);
        return;
      }
    }
    onSave(draft);
  };

  const Control = editControlType === "textarea" ? Textarea : Input;

  return (
    <div className="flex justify-between items-start">
      <div className="flex-1 text-sm text-gray-600">
        <span className="font-semibold">{label}:</span>{" "}
        {editing ? (
          <Control
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            disabled={isPending}
            {...(editControlType === "textarea" ? { rows: 3 } : {})}
            className="mt-1 w-full"
          />
        ) : (
          <span className="font-normal">{value || "—"}</span>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 ml-4">
          <Button size="icon" onClick={attemptSave} disabled={isPending}>
            <CheckIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 cursor-pointer text-sm ml-4"
          onClick={onStart}
        >
          <PencilIcon className="h-4 w-4" /> Edit
        </div>
      )}
    </div>
  );
};

export default InlineEditable;