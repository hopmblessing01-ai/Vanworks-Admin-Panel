"use client";

import * as React from "react";
import MuiTabs from "@mui/material/Tabs";
import MuiTab, { type TabProps as MuiTabProps } from "@mui/material/Tab";
import Box from "@mui/material/Box";

type TabsContextValue = {
  value: string;
  onChange: (next: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be used within <Tabs>");
  return ctx;
}

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = controlled ?? internal;
  const onChange = React.useCallback(
    (next: string) => {
      if (controlled === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <Box className={className}>{children}</Box>
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { value, onChange } = useTabsContext();
  return (
    <Box className={className} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <MuiTabs
        value={value || false}
        onChange={(_, next) => onChange(next as string)}
        textColor="primary"
        indicatorColor="primary"
      >
        {children}
      </MuiTabs>
    </Box>
  );
}

// TabsTrigger must forward all props (especially onChange/selected that
// MUI Tabs injects via React.cloneElement) to the inner MuiTab so that
// click handling and active-state styling work.
type TabsTriggerProps = Omit<MuiTabProps, "value" | "label" | "children"> & {
  value: string;
  children: React.ReactNode;
};

const TabsTrigger = React.forwardRef<HTMLDivElement, TabsTriggerProps>(
  ({ value, children, ...rest }, ref) => (
    <MuiTab
      ref={ref}
      value={value}
      label={children}
      {...(rest as MuiTabProps)}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: current } = useTabsContext();
  const isActive = current === value;
  // Keep all tab contents mounted; hide inactive ones with CSS. This
  // preserves local component state (form inputs, in-flight auto-save
  // buffers, etc.) when the user switches between tabs.
  return (
    <Box
      className={className}
      role="tabpanel"
      hidden={!isActive}
      sx={{ pt: 3, display: isActive ? "block" : "none" }}
    >
      {children}
    </Box>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
