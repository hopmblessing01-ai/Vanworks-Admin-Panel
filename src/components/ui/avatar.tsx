"use client";

import * as React from "react";
import MuiAvatar, {
  type AvatarProps as MuiAvatarProps,
} from "@mui/material/Avatar";

export type AvatarProps = Omit<MuiAvatarProps, "src"> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, sx, ...props }, ref) => {
    return (
      <MuiAvatar
        ref={ref}
        src={src ?? undefined}
        alt={alt}
        sx={{ width: 40, height: 40, fontSize: 14, ...sx }}
        {...props}
      >
        {!src ? fallback ?? "?" : null}
      </MuiAvatar>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
