"use client";

import * as React from "react";
import MuiSelect, {
  type SelectProps as MuiSelectProps,
} from "@mui/material/Select";
import MenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Box from "@mui/material/Box";

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function Select({
  value: controlled,
  defaultValue = "",
  onValueChange,
  disabled,
  children,
}: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = controlled ?? internal;

  // Walk children: extract <SelectTrigger> props (className, sx, placeholder)
  // and <SelectContent> children (the MenuItem list).
  let triggerClassName: string | undefined;
  let triggerSx: MuiSelectProps["sx"] | undefined;
  let placeholder: string | undefined;
  let menuItems: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectTrigger) {
      const p = child.props as SelectTriggerProps;
      triggerClassName = p.className;
      triggerSx = p.sx;
      React.Children.forEach(p.children, (c) => {
        if (React.isValidElement(c) && c.type === SelectValue) {
          placeholder = (c.props as SelectValueProps).placeholder;
        }
      });
    } else if (child.type === SelectContent) {
      menuItems = (child.props as SelectContentProps).children;
    }
  });

  const itemsArray = React.Children.toArray(menuItems);

  return (
    <MuiSelect
      value={value}
      onChange={(e) => {
        const next = String(e.target.value);
        if (controlled === undefined) setInternal(next);
        onValueChange?.(next);
      }}
      size="small"
      fullWidth
      displayEmpty
      disabled={disabled}
      className={triggerClassName}
      sx={{ backgroundColor: "background.paper", ...triggerSx }}
      input={<OutlinedInput />}
      renderValue={(selected) => {
        if (!selected) {
          return (
            <Box component="span" sx={{ color: "text.disabled" }}>
              {placeholder ?? "Select…"}
            </Box>
          );
        }
        const match = itemsArray.find(
          (c) =>
            React.isValidElement(c) &&
            (c.props as SelectItemProps).value === selected,
        );
        if (React.isValidElement(match)) {
          return (match.props as SelectItemProps).children;
        }
        return String(selected);
      }}
    >
      {itemsArray}
    </MuiSelect>
  );
}

type SelectTriggerProps = {
  className?: string;
  sx?: MuiSelectProps["sx"];
  children?: React.ReactNode;
};
function SelectTrigger(_: SelectTriggerProps) {
  return null;
}

type SelectValueProps = { placeholder?: string };
function SelectValue(_: SelectValueProps) {
  return null;
}

type SelectContentProps = { children: React.ReactNode };
function SelectContent(_: SelectContentProps) {
  return null;
}

type SelectItemProps = MenuItemProps & {
  value: string;
  children: React.ReactNode;
};
const SelectItem = React.forwardRef<HTMLLIElement, SelectItemProps>(
  ({ value, children, ...rest }, ref) => (
    <MenuItem ref={ref} value={value} {...rest}>
      {children}
    </MenuItem>
  ),
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
