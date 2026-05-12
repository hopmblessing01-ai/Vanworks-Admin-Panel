"use client";

import { useMemo, useState } from "react";
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
import { createVanModel } from "./actions";

// Generate a client-side UUID v4. crypto.randomUUID is widely supported in
// modern browsers; fallback to a simple Math.random-based generator.
function randomUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function NewModelForm() {
  const router = useRouter();
  // Reserve an id up-front so the image-upload path can use it
  // before the row exists. We'll insert the row with this same id.
  const pendingId = useMemo(() => randomUUID(), []);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!name.trim()) {
      toast.error("Please enter a model name.");
      return;
    }
    setSaving(true);
    try {
      const result = await createVanModel({
        id: pendingId,
        name: name.trim(),
        price: Number.parseFloat(price) || 0,
        image_url: image,
      });
      if (!result.ok) throw new Error(result.error);

      toast.success("Van model created.");
      // Refresh first so the /van-models RSC payload is fresh on back-nav,
      // then navigate into the new model's editor.
      router.refresh();
      router.push(`/van-models/${result.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create.");
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
            pathPrefix={`van-models/${pendingId}`}
            aspect="wide"
          />
        </Stack>

        <Stack spacing={2.5}>
          <Box>
            <Label htmlFor="name" sx={{ mb: 1 }}>
              Model name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Wanderer"
              required
            />
          </Box>

          <Box>
            <Label htmlFor="price" sx={{ mb: 1 }}>
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
              separately. Sales and Build form specs become available after
              you save.
            </Typography>
          </Box>

          <Box sx={{ pt: 1 }}>
            <Button
              onClick={onSave}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} sx={{ color: "currentColor" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 18 }} />
                )
              }
            >
              Save info
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}
