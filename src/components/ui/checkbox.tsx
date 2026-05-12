"use client";

import * as React from "react";
import MuiCheckbox, {
  type CheckboxProps as MuiCheckboxProps,
} from "@mui/material/Checkbox";

export interface CheckboxProps
  extends Omit<MuiCheckboxProps, "onChange" | "checked"> {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, sx, ...props }, ref) => {
    const isIndeterminate = checked === "indeterminate";
    return (
      <MuiCheckbox
        ref={ref as React.Ref<HTMLButtonElement>}
        checked={checked === true}
        indeterminate={isIndeterminate}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        size="small"
        sx={[{ padding: 0.5 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
