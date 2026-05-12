"use client";

import * as React from "react";
import Divider, { type DividerProps } from "@mui/material/Divider";

export type SeparatorProps = DividerProps;

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ orientation = "horizontal", ...props }, ref) => (
    <Divider ref={ref} orientation={orientation} {...props} />
  ),
);
Separator.displayName = "Separator";

export { Separator };
