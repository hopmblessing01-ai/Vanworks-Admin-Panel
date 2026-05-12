"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      if (typeof window !== "undefined") {
        if (remember) {
          window.localStorage.setItem("vanworks.rememberedEmail", email.trim());
        } else {
          window.localStorage.removeItem("vanworks.rememberedEmail");
        }
      }

      if (!data.user?.email_confirmed_at) {
        toast.message("Please confirm your email to continue.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
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
          autoComplete="email"
          placeholder="you@vanworks.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--mui-palette-primary-main)",
              textDecoration: "none",
            }}
          >
            Forgot password?
          </Link>
        </Box>
        <Input
          id="password"
          type={showPwd ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          endAdornment={
            <IconButton
              size="small"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          }
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
          />
        }
        label="Remember me"
        sx={{ ml: 0, "& .MuiFormControlLabel-label": { fontSize: 14 } }}
      />

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
        Sign in
      </Button>
    </Box>
  );
}
