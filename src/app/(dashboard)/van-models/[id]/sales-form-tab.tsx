"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SALES_FORM_SECTIONS,
  SALES_SECTION_LAYOUT,
  type SalesSectionKey,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import type { Database } from "@/lib/supabase/types";

type SalesSpec = Database["public"]["Tables"]["sales_specs"]["Row"];
type SalesSpecUpdate = Database["public"]["Tables"]["sales_specs"]["Update"];

type Item = {
  id: string;
  section: SalesSectionKey;
  name: string;
  price: number;
  image_url: string | null;
  sort_order: number;
};

const SECTION_BY_KEY = Object.fromEntries(
  SALES_FORM_SECTIONS.map((s) => [s.key, s] as const),
) as Record<SalesSectionKey, (typeof SALES_FORM_SECTIONS)[number]>;

export function SalesFormTab({
  modelId,
  initial,
}: {
  modelId: string;
  initial: SalesSpec[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [items, setItems] = useState<Item[]>(
    initial.map((s) => ({
      id: s.id,
      section: s.section as SalesSectionKey,
      name: s.name,
      price: Number(s.price ?? 0),
      image_url: s.image_url,
      sort_order: s.sort_order ?? 0,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  const pendingRef = useRef<Map<string, SalesSpecUpdate>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);

  async function flushNow() {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setSaving(true);
    try {
      while (pendingRef.current.size > 0) {
        const entries = Array.from(pendingRef.current.entries());
        pendingRef.current.clear();
        for (const [id, patch] of entries) {
          const { error } = await supabase
            .from("sales_specs")
            .update(patch)
            .eq("id", id);
          if (error) throw error;
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-save failed.");
    } finally {
      flushingRef.current = false;
      setSaving(false);
    }
  }

  function scheduleSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushNow(), 600);
  }

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (pendingRef.current.size === 0) return;
      // Best-effort: kick a final flush. The browser may or may not give
      // it time to complete, but combined with onBlur this catches
      // virtually every case.
      void flushNow();
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
      void flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flushIfPending() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current.size > 0) {
      void flushNow();
    }
  }

  function patchItem(id: string, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
    const dbPatch: SalesSpecUpdate = {};
    if ("name" in patch) dbPatch.name = patch.name ?? "";
    if ("price" in patch) dbPatch.price = patch.price ?? 0;
    if ("image_url" in patch) dbPatch.image_url = patch.image_url ?? null;
    if ("sort_order" in patch) dbPatch.sort_order = patch.sort_order ?? 0;
    pendingRef.current.set(id, { ...pendingRef.current.get(id), ...dbPatch });
    scheduleSave();
  }

  async function addItem(section: SalesSectionKey) {
    const sectionItems = items.filter((i) => i.section === section);
    const sortOrder = sectionItems.length
      ? Math.max(...sectionItems.map((p) => p.sort_order)) + 1
      : 0;
    const meta = SECTION_BY_KEY[section];
    const defaultName =
      meta?.kind === "color" ? `${meta.label} ${sortOrder + 1}` : "";

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("sales_specs")
        .insert({
          van_model_id: modelId,
          section,
          name: defaultName,
          price: 0,
          image_url: null,
          sort_order: sortOrder,
        })
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Failed to add.");
      setItems((prev) => [
        ...prev,
        {
          id: data.id,
          section,
          name: data.name,
          price: Number(data.price ?? 0),
          image_url: data.image_url,
          sort_order: data.sort_order ?? sortOrder,
        },
      ]);
      if (meta?.kind !== "color") setAutoFocusId(data.id);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    pendingRef.current.delete(id);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sales_specs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          fontSize: 12,
          color: "text.secondary",
        }}
      >
        {saving ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CircularProgress size={14} />
            Saving…
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckIcon sx={{ fontSize: 16, color: "success.main" }} />
            All changes saved
          </Box>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {SALES_FORM_SECTIONS.map((section) => {
          const layout = SALES_SECTION_LAYOUT[section.key];
          const sectionItems = items
            .filter((i) => i.section === section.key)
            .sort((a, b) => a.sort_order - b.sort_order);

          const renderSpecOrAddonItem = (it: Item) => {
            const showPrice = section.kind === "addon";
            return (
              <Box
                key={it.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: "divider",
                  backgroundColor: "rgba(0,0,0,0.03)",
                  p: 0.75,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Input
                    value={it.name}
                    onChange={(e) => patchItem(it.id, { name: e.target.value })}
                    onBlur={flushIfPending}
                    placeholder={showPrice ? "Add-on name" : "Spec name"}
                    autoFocus={autoFocusId === it.id}
                  />
                </Box>
                {showPrice && (
                  <Box sx={{ width: 110 }}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={it.price}
                      onChange={(e) =>
                        patchItem(it.id, {
                          price: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      onBlur={flushIfPending}
                      placeholder="Price"
                    />
                  </Box>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(it.id)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            );
          };

          const renderColorItem = (it: Item) => (
            <ColorSwatchCard
              key={it.id}
              value={it.image_url}
              onChange={(url) => patchItem(it.id, { image_url: url })}
              onRemove={() => removeItem(it.id)}
              pathPrefix={`van-models/${modelId}/colors`}
            />
          );

          let itemsNode: React.ReactNode;
          if (sectionItems.length === 0) {
            itemsNode = (
              <Box
                sx={{
                  borderRadius: 1.5,
                  border: 1,
                  borderStyle: "dashed",
                  borderColor: "divider",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  px: 2,
                  py: 2,
                  textAlign: "center",
                  fontSize: 12,
                  color: "text.secondary",
                }}
              >
                No entries yet.
              </Box>
            );
          } else if (layout.itemsLayout === "wrap" && section.kind === "color") {
            itemsNode = (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {sectionItems.map(renderColorItem)}
              </Box>
            );
          } else if (layout.itemsLayout === "grid2") {
            itemsNode = (
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
              >
                {sectionItems.map(renderSpecOrAddonItem)}
              </Box>
            );
          } else {
            itemsNode = <Stack spacing={1}>{sectionItems.map(renderSpecOrAddonItem)}</Stack>;
          }

          return (
            <Grid
              key={section.key}
              size={{ xs: 12, lg: layout.colsLg }}
            >
              <Card sx={{ height: "100%" }}>
                <Box sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {section.label}
                    </Typography>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(section.key)}
                      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    >
                      Add
                    </Button>
                  </Box>
                  {itemsNode}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

function ColorSwatchCard({
  value,
  onChange,
  onRemove,
  pathPrefix,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onRemove: () => void;
  pathPrefix: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, pathPrefix);
      onChange(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: 104,
        height: 104,
        flexShrink: 0,
        borderRadius: 1.5,
        overflow: "hidden",
        boxShadow: 1,
        backgroundColor: "background.paper",
        transition: "all 0.15s",
        "&:hover": { boxShadow: 3 },
        "&:hover .swatch-delete": { opacity: 1 },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          padding: 0,
          cursor: uploading ? "default" : "pointer",
          backgroundColor: value ? "transparent" : "action.hover",
        }}
      >
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt="Color swatch"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              height: "100%",
              width: "100%",
              color: "text.secondary",
            }}
          >
            {uploading ? (
              <CircularProgress size={22} />
            ) : (
              <>
                <AddPhotoAlternateIcon sx={{ fontSize: 28 }} />
                <Box component="span" sx={{ fontSize: 11 }}>
                  Upload
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      <Box
        component="button"
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove color"
        className="swatch-delete"
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 24,
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: 0,
          padding: 0,
          cursor: "pointer",
          backgroundColor: "rgba(0,0,0,0.55)",
          color: "#fff",
          opacity: 0,
          transition: "opacity 0.15s, background-color 0.15s",
          "&:hover": { backgroundColor: "error.main" },
        }}
      >
        <DeleteIcon sx={{ fontSize: 16 }} />
      </Box>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </Box>
  );
}
