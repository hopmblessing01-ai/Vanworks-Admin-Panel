"use client";

import * as React from "react";
import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import IconButton, {
  type IconButtonProps,
} from "@mui/material/IconButton";

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
  extends Omit<MuiButtonProps, "variant" | "color" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function mapVariant(
  variant: ButtonVariant,
): { variant: MuiButtonProps["variant"]; color: MuiButtonProps["color"] } {
  switch (variant) {
    case "outline":
      return { variant: "outlined", color: "primary" };
    case "secondary":
      return { variant: "contained", color: "secondary" };
    case "ghost":
      return { variant: "text", color: "primary" };
    case "destructive":
      return { variant: "contained", color: "error" };
    case "link":
      return { variant: "text", color: "primary" };
    case "default":
    default:
      return { variant: "contained", color: "primary" };
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", children, sx, ...props }, ref) => {
    if (size === "icon") {
      const colorMap: Record<ButtonVariant, IconButtonProps["color"]> = {
        default: "primary",
        outline: "primary",
        secondary: "secondary",
        ghost: "default",
        destructive: "error",
        link: "primary",
      };
      return (
        <IconButton
          ref={ref}
          color={colorMap[variant]}
          sx={sx}
          {...(props as unknown as IconButtonProps)}
        >
          {children}
        </IconButton>
      );
    }

    const mapped = mapVariant(variant);
    const muiSize =
      size === "sm" ? "small" : size === "lg" ? "large" : "medium";

    return (
      <MuiButton
        ref={ref}
        size={muiSize}
        variant={mapped.variant}
        color={mapped.color}
        sx={sx}
        {...props}
      >
        {children}
      </MuiButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
