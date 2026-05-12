"use client";

import * as React from "react";
import Menu from "@mui/material/Menu";
import MuiMenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";

type Ctx = {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
};

const DropdownMenuContext = React.createContext<Ctx | null>(null);
function useDropdown() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenu.* must be used inside <DropdownMenu>");
  return ctx;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return (
    <DropdownMenuContext.Provider value={{ anchorEl, setAnchorEl }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

type TriggerProps = {
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
};

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className, children }, ref) => {
    const { setAnchorEl } = useDropdown();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className={className}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

type ContentProps = {
  align?: "start" | "center" | "end";
  className?: string;
  children: React.ReactNode;
};
function DropdownMenuContent({ align = "end", className, children }: ContentProps) {
  const { anchorEl, setAnchorEl } = useDropdown();
  const open = Boolean(anchorEl);
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: align === "end" ? "right" : align === "center" ? "center" : "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: align === "end" ? "right" : align === "center" ? "center" : "left",
      }}
      slotProps={{
        list: { className },
        paper: { sx: { minWidth: 180, borderRadius: 2 } },
      }}
    >
      {children}
    </Menu>
  );
}

type ItemProps = MenuItemProps & {
  onSelect?: () => void;
};
const DropdownMenuItem = React.forwardRef<HTMLLIElement, ItemProps>(
  ({ onClick, onSelect, children, ...rest }, ref) => {
    const { setAnchorEl } = useDropdown();
    return (
      <MuiMenuItem
        ref={ref}
        onClick={(e) => {
          onClick?.(e);
          onSelect?.();
          setAnchorEl(null);
        }}
        {...rest}
      >
        {children}
      </MuiMenuItem>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ListSubheader
      className={className}
      sx={{ lineHeight: 1.4, py: 1, color: "text.primary", fontWeight: 600 }}
    >
      <ListItemText disableTypography>{children}</ListItemText>
    </ListSubheader>
  );
}

function DropdownMenuSeparator() {
  return <Divider sx={{ my: 0.5 }} />;
}

const DropdownMenuGroup = React.Fragment;
const DropdownMenuPortal = React.Fragment;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
};
