"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Model = Database["public"]["Tables"]["van_models"]["Row"];

export function InfoTab({ model }: { model: Model }) {
  const router = useRouter();
  const [name, setName] = useState(model.name);
  const [price, setPrice] = useState<string>(String(model.price ?? 0));
  const [image, setImage] = useState<string | null>(model.image_url);
  const [saving, setSaving] = useState(false);

  // Track the last-saved values so we can detect unsaved edits. Initialized
  // from props and updated after a successful save / when the props change
  // (e.g., router.refresh() pulls a newer model snapshot).
  const [savedName, setSavedName] = useState(model.name);
  const [savedPrice, setSavedPrice] = useState<string>(
    String(model.price ?? 0),
  );
  const [savedImage, setSavedImage] = useState<string | null>(model.image_url);

  useEffect(() => {
    setSavedName(model.name);
    setSavedPrice(String(model.price ?? 0));
    setSavedImage(model.image_url);
  }, [model.name, model.price, model.image_url]);

  const isDirty =
    name !== savedName ||
    Number.parseFloat(price || "0") !== Number.parseFloat(savedPrice || "0") ||
    image !== savedImage;

  async function onSave() {
    if (!isDirty) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const trimmedName = name.trim() || "Untitled Model";
      const parsedPrice = Number.parseFloat(price) || 0;
      const { error } = await supabase
        .from("van_models")
        .update({
          name: trimmedName,
          price: parsedPrice,
          image_url: image,
        })
        .eq("id", model.id);
      if (error) throw error;
      // Sync the "saved" snapshot so the button immediately disables again.
      setSavedName(trimmedName);
      setSavedPrice(String(parsedPrice));
      setSavedImage(image);
      setName(trimmedName);
      setPrice(String(parsedPrice));
      toast.success("Model info saved.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          p: 3,
          gridTemplateColumns: { md: "280px 1fr" },
        }}
      >
        <Stack spacing={1.5}>
          <Label>Model image</Label>
          <ImageUpload
            value={image}
            onChange={setImage}
            pathPrefix={`van-models/${model.id}`}
            aspect="wide"
          />
        </Stack>

        <Stack spacing={2.5}>
          <Box>
            <Label htmlFor="name" style={{ marginBottom: 8 }}>
              Model name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Wanderer"
            />
          </Box>

          <Box>
            <Label htmlFor="price" style={{ marginBottom: 8 }}>
              Base price (USD)
            </Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              This is the starting price for the model. Add-ons are priced
              separately.
            </Typography>
          </Box>

          <Box sx={{ pt: 1 }}>
            <Button
              onClick={onSave}
              disabled={saving || !isDirty}
              startIcon={
                saving ? (
                  <CircularProgress size={16} sx={{ color: "currentColor" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 18 }} />
                )
              }
            >
              {isDirty ? "Save info" : "Saved"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}
