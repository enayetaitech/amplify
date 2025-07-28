// /utils/field-helpers.ts

import { validate, Validator } from "schemas/validators"
import { toast } from "sonner"


export function makeOnChange<Key extends string>(
  key: Key,
  rules: Validator[],
  errorMsg: string,
  setter: (upd: Record<Key,string>) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!validate(v, rules)) {
      toast.error(errorMsg)
      return
    }
    setter({ [key]: v } as Record<Key,string>)
  }
}
