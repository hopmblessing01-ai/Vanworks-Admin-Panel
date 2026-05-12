"use client";

import Box from "@mui/material/Box";

// Drop your logo file at one of these paths in /public:
//   - public/logo.png      (default — used everywhere)
//   - public/logo-dark.png (optional — used on dark sidebar background)
// .svg also works; just change `LOGO_SRC` / `LOGO_DARK_SRC` below.
const LOGO_SRC = "/logo.png";
const LOGO_DARK_SRC = "/logo-dark.png";

type LogoProps = {
  className?: string;
  // "light" = used on white/light surfaces (page header, auth pages, etc.)
  // "dark"  = used on the dark sidebar; will load logo-dark.png if you
  //           provide a separate file for that, otherwise the same logo.
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  useDarkVariant?: boolean;
};

const HEIGHTS: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 28,
  md: 40,
  lg: 48,
};

export function Logo({
  className,
  variant = "light",
  size = "md",
  useDarkVariant = false,
}: LogoProps) {
  const height = HEIGHTS[size];
  const src = variant === "dark" && useDarkVariant ? LOGO_DARK_SRC : LOGO_SRC;

  return (
    <Box
      className={className}
      sx={{ display: "inline-flex", alignItems: "center" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Vanworks"
        style={{
          height,
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}
