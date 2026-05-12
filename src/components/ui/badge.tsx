"use client";

import * as React from "react";
import Chip, { type ChipProps } from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning";

export interface BadgeProps
  extends Omit<ChipProps, "color" | "variant" | "size" | "label" | "children"> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

function map(variant: BadgeVariant): {
  variant: ChipProps["variant"];
  color: ChipProps["color"];
  extraSx: SxProps<Theme>;
} {
  switch (variant) {
    case "secondary":
      return { variant: "filled", color: "default", extraSx: {} };
    case "outline":
      return { variant: "outlined", color: "default", extraSx: {} };
    case "destructive":
      return { variant: "filled", color: "error", extraSx: {} };
    case "success":
      return {
        variant: "filled",
        color: "default",
        extraSx: {
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          color: "#047857",
          fontWeight: 600,
        },
      };
    case "warning":
      return {
        variant: "filled",
        color: "default",
        extraSx: {
          backgroundColor: "rgba(245, 158, 11, 0.16)",
          color: "#b45309",
          fontWeight: 600,
        },
      };
    case "default":
    default:
      return { variant: "filled", color: "primary", extraSx: {} };
  }
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "default", sx, children, ...props }, ref) => {
    const mapped = map(variant);
    return (
      <Chip
        ref={ref}
        size="small"
        sx={
          [
            { height: 22, fontSize: 11 },
            mapped.extraSx,
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ] as SxProps<Theme>
        }
        variant={mapped.variant}
        color={mapped.color}
        label={children}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
