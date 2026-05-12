"use client";

import * as React from "react";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  sx?: SxProps<Theme>;
};

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, sx, children, ...props }, ref) => {
    return (
      <Typography
        ref={ref as React.Ref<HTMLLabelElement>}
        component="label"
        variant="body2"
        className={className}
        sx={
          [
            {
              color: "text.primary",
              fontWeight: 500,
              display: "block",
            },
            sx,
          ] as SxProps<Theme>
        }
        {...(props as React.HTMLAttributes<HTMLLabelElement>)}
      >
        {children}
      </Typography>
    );
  },
);
Label.displayName = "Label";

export { Label };
