"use client";

import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Alert
        severity="success"
        icon={<CheckCircleIcon />}
        sx={{ alignItems: "flex-start", borderRadius: 2 }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Check your email</AlertTitle>
        If an account exists for{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          {email}
        </Box>
        , a password reset link has been sent.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Box>
      <Button
        type="submit"
        fullWidth
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={16} sx={{ color: "currentColor" }} />
          ) : undefined
        }
      >
        Send reset link
      </Button>
    </Box>
  );
}
