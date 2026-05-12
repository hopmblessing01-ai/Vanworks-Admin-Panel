"use client";

import * as React from "react";
import MuiDialog, { type DialogProps as MuiDialogProps } from "@mui/material/Dialog";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? !!controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  asChild: _asChild,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const { setOpen } = React.useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      const original = (children.props as { onClick?: (e: React.MouseEvent) => void })
        .onClick;
      original?.(e);
      setOpen(true);
    },
  } as React.HTMLAttributes<HTMLElement>);
}

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
  maxWidth?: MuiDialogProps["maxWidth"];
  sx?: MuiDialogProps["sx"];
};

function DialogContent({
  children,
  maxWidth = "sm",
  sx,
}: DialogContentProps) {
  const { open, setOpen } = React.useContext(DialogContext);
  return (
    <MuiDialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      sx={sx}
    >
      <IconButton
        aria-label="Close"
        size="small"
        onClick={() => setOpen(false)}
        sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      {children}
    </MuiDialog>
  );
}

function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ px: 3, pt: 3, pb: 1 }} className={className}>
      {children}
    </Box>
  );
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <MuiDialogTitle
      sx={{ p: 0, fontSize: "1.125rem", fontWeight: 600 }}
      component="div"
    >
      {children}
    </MuiDialogTitle>
  );
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {children}
    </Typography>
  );
}

function DialogBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MuiDialogContent sx={{ pt: 1 }} className={className}>
      {children}
    </MuiDialogContent>
  );
}

function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MuiDialogActions sx={{ px: 3, pb: 3 }} className={className}>
      {children}
    </MuiDialogActions>
  );
}

function DialogClose({ children }: { children: React.ReactElement }) {
  const { setOpen } = React.useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      const original = (children.props as { onClick?: (e: React.MouseEvent) => void })
        .onClick;
      original?.(e);
      setOpen(false);
    },
  } as React.HTMLAttributes<HTMLElement>);
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
};
