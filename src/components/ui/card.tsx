"use client";

import * as React from "react";
import MuiCard from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  component?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  sx?: SxProps<Theme>;
  variant?: "outlined" | "elevation";
  elevation?: number;
};

// Card defaults to MUI's natural elevated paper look — relies on the
// theme to set elevation/borderRadius.
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, sx, variant, elevation, ...props }, ref) => {
    return (
      <MuiCard
        ref={ref}
        variant={variant}
        elevation={elevation}
        className={className}
        sx={sx}
        {...(props as React.ComponentProps<typeof MuiCard>)}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={
      [
        { display: "flex", flexDirection: "column", gap: 0.75, p: 3 },
        sx,
      ] as SxProps<Theme>
    }
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <Typography
    ref={ref}
    component="h3"
    variant="h6"
    className={className}
    {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
  >
    {children}
  </Typography>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <Typography
    ref={ref}
    component="p"
    variant="body2"
    color="text.secondary"
    className={className}
    {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
  >
    {children}
  </Typography>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={[{ p: 3, pt: 0 }, sx] as SxProps<Theme>}
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={
      [
        { display: "flex", alignItems: "center", p: 3, pt: 0 },
        sx,
      ] as SxProps<Theme>
    }
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
