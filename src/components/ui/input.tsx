"use client";

import * as React from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "color"
>;

export type InputProps = NativeInputProps & {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  sx?: SxProps<Theme>;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { type = "text", className, startAdornment, endAdornment, sx, ...rest },
    ref,
  ) => {
    return (
      <TextField
        inputRef={ref}
        type={type}
        size="small"
        fullWidth
        variant="outlined"
        className={className}
        sx={[
          {
            // Always use a white background regardless of the surrounding
            // card/section background tint.
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff",
            },
            "& .MuiOutlinedInput-root.Mui-disabled": {
              backgroundColor: "rgba(0,0,0,0.04)",
            },
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        slotProps={{
          input: {
            startAdornment: startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined,
            endAdornment: endAdornment ? (
              <InputAdornment position="end">{endAdornment}</InputAdornment>
            ) : undefined,
          },
        }}
        {...(rest as TextFieldProps)}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
