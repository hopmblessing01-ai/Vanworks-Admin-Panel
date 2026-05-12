"use client";

import * as React from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

type NativeTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size" | "color" | "rows"
> & { rows?: number };

export type TextareaProps = NativeTextareaProps;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...rest }, ref) => {
    return (
      <TextField
        inputRef={ref}
        multiline
        rows={rows}
        size="small"
        fullWidth
        variant="outlined"
        className={className}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
          },
          "& .MuiOutlinedInput-root.Mui-disabled": {
            backgroundColor: "rgba(0,0,0,0.04)",
          },
        }}
        {...(rest as TextFieldProps)}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
