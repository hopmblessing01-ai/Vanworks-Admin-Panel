"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/LockOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCameraOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import type { Role } from "@/lib/constants";

type Props = {
  userId: string;
  email: string;
  initialName: string;
  initialPhoto: string | null;
  role: Role;
};

export function ProfileForm({
  userId,
  email,
  initialName,
  initialPhoto,
  role,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [savedName, setSavedName] = useState(initialName);
  const [savedPhoto, setSavedPhoto] = useState<string | null>(initialPhoto);
  const [uploading, setUploading] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    setSavedName(initialName);
    setSavedPhoto(initialPhoto);
  }, [initialName, initialPhoto]);

  const infoDirty = name !== savedName || photo !== savedPhoto;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handlePhotoFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, `profiles/${userId}`);
      setPhoto(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSaveInfo() {
    if (!infoDirty) return;
    setSavingInfo(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim() || null,
          photo_url: photo,
        })
        .eq("id", userId);
      if (error) throw error;
      setSavedName(name.trim());
      setName(name.trim());
      setSavedPhoto(photo);
      toast.success("Profile updated.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setPassword("");
      setConfirm("");
      toast.success("Password updated.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card sx={{ height: "100%" }}>
          <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>Your information</Typography>
            <Typography variant="body2" color="text.secondary">
              Update your profile photo and display name.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row", lg: "column", xl: "row" }}
            spacing={3}
            sx={{ alignItems: { sm: "flex-start", lg: "center", xl: "flex-start" } }}
          >
            <Stack spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={photo}
                  fallback={initials(name || email)}
                  sx={{
                    width: 112,
                    height: 112,
                    fontSize: 36,
                    boxShadow: 1,
                  }}
                />
                {uploading && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={28} sx={{ color: "#fff" }} />
                  </Box>
                )}
                <IconButton
                  size="small"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change photo"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    boxShadow: 2,
                    "&:hover": { backgroundColor: "primary.dark" },
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {photo ? "Replace" : "Upload"}
                </Button>
                {photo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPhoto(null)}
                    disabled={uploading}
                    startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                    sx={{ color: "error.main" }}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePhotoFile(f);
                  e.target.value = "";
                }}
              />
            </Stack>

            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <Box>
                <Label htmlFor="full_name" sx={{ mb: 1 }}>
                  Full name
                </Label>
                <Input
                  id="full_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  autoComplete="name"
                />
              </Box>
              <Box>
                <Label htmlFor="email" sx={{ mb: 1 }}>
                  Email
                </Label>
                <Input id="email" value={email} disabled />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Contact an admin if you need to change your email.
                </Typography>
              </Box>
              <Box>
                <Label sx={{ mb: 1 }}>Role</Label>
                <Box>
                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {role}
                  </Badge>
                </Box>
              </Box>

              <Box sx={{ pt: 1 }}>
                <Button
                  onClick={onSaveInfo}
                  disabled={savingInfo || !infoDirty}
                  startIcon={
                    savingInfo ? (
                      <CircularProgress
                        size={16}
                        sx={{ color: "currentColor" }}
                      />
                    ) : (
                      <SaveIcon sx={{ fontSize: 18 }} />
                    )
                  }
                >
                  {infoDirty ? "Save changes" : "Saved"}
                </Button>
              </Box>
            </Stack>
          </Stack>
          </Box>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Card sx={{ height: "100%" }}>
        <Box
          component="form"
          onSubmit={onChangePassword}
          sx={{ p: 3 }}
          noValidate
        >
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>Change password</Typography>
            <Typography variant="body2" color="text.secondary">
              Pick a password you don&apos;t use anywhere else. Minimum
              8&nbsp;characters.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Label htmlFor="new_password" sx={{ mb: 1 }}>
                New password
              </Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>
            <Box>
              <Label htmlFor="confirm_password" sx={{ mb: 1 }}>
                Confirm new password
              </Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Box>

            <Box sx={{ pt: 1 }}>
              <Button
                type="submit"
                disabled={savingPassword || !password || !confirm}
                startIcon={
                  savingPassword ? (
                    <CircularProgress
                      size={16}
                      sx={{ color: "currentColor" }}
                    />
                  ) : (
                    <LockIcon sx={{ fontSize: 18 }} />
                  )
                }
              >
                Update password
              </Button>
            </Box>
          </Stack>
        </Box>
        </Card>
      </Grid>
    </Grid>
  );
}
