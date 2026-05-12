"use client";

import * as React from "react";
import MuiDialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { Button, type ButtonVariant } from "@/components/ui/button";

export type ConfirmTone = "danger" | "default";

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  // When provided, the dialog stays open until the promise resolves and
  // shows a loading state on the confirm button. The promise should throw
  // if the action fails (the dialog will stay open).
  onConfirm?: () => void | Promise<void>;
};

type Resolver = (value: boolean) => void;

type InternalState = {
  open: boolean;
  options: ConfirmOptions | null;
  resolver: Resolver | null;
  pending: boolean;
};

const ConfirmContext = React.createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<InternalState>({
    open: false,
    options: null,
    resolver: null,
    pending: false,
  });

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ open: true, options, resolver: resolve, pending: false });
      }),
    [],
  );

  const close = React.useCallback((result: boolean) => {
    setState((prev) => {
      prev.resolver?.(result);
      return { open: false, options: null, resolver: null, pending: false };
    });
  }, []);

  const handleCancel = React.useCallback(() => {
    if (state.pending) return;
    close(false);
  }, [close, state.pending]);

  const handleConfirm = React.useCallback(async () => {
    const options = state.options;
    if (!options) return;
    if (!options.onConfirm) {
      close(true);
      return;
    }
    setState((prev) => ({ ...prev, pending: true }));
    try {
      await options.onConfirm();
      close(true);
    } catch {
      // Leave the dialog open; the calling action is expected to surface
      // its own error message (e.g., via a toast).
      setState((prev) => ({ ...prev, pending: false }));
    }
  }, [close, state.options]);

  const tone: ConfirmTone = state.options?.tone ?? "default";
  const confirmVariant: ButtonVariant =
    tone === "danger" ? "destructive" : "default";
  const Icon = tone === "danger" ? WarningAmberIcon : HelpOutlineIcon;
  const iconColor = tone === "danger" ? "error.main" : "primary.main";
  const iconBg =
    tone === "danger" ? "rgba(211, 47, 47, 0.12)" : "rgba(2, 136, 209, 0.12)";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <MuiDialog
        open={state.open}
        onClose={handleCancel}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pt: 3, px: 3, pb: 0 }} component="div">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                color: iconColor,
                backgroundColor: iconBg,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {state.options?.title}
            </Typography>
          </Box>
        </DialogTitle>
        {state.options?.description && (
          <DialogContent sx={{ pt: 1.5, px: 3 }}>
            {typeof state.options.description === "string" ? (
              <Typography variant="body2" color="text.secondary">
                {state.options.description}
              </Typography>
            ) : (
              state.options.description
            )}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={state.pending}
          >
            {state.options?.cancelText ?? "Cancel"}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={state.pending}
            startIcon={
              state.pending ? (
                <CircularProgress size={16} sx={{ color: "currentColor" }} />
              ) : undefined
            }
          >
            {state.options?.confirmText ?? "Confirm"}
          </Button>
        </DialogActions>
      </MuiDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>.");
  }
  return ctx;
}
