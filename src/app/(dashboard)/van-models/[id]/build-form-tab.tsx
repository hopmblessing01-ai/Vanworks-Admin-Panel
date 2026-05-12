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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BUILD_FORM_SECTIONS, type BuildSectionKey } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type BuildSpec = Database["public"]["Tables"]["build_specs"]["Row"];
type BuildSpecUpdate = Database["public"]["Tables"]["build_specs"]["Update"];

type Item = {
  id: string;
  section: BuildSectionKey;
  name: string;
  sort_order: number;
};

// Per-section layout for the build form. Sections default to a half-width
// card (lg: 6) with items stacked one-per-line, but can opt into a wider
// card with a multi-column inner grid.
type BuildSectionLayout = {
  colsLg: 4 | 6 | 12;
  itemsLayout: "stack" | "grid2";
};

const BUILD_SECTION_LAYOUT: Partial<Record<BuildSectionKey, BuildSectionLayout>> = {
  ELECTRICAL: { colsLg: 12, itemsLayout: "grid2" },
};

const DEFAULT_BUILD_SECTION_LAYOUT: BuildSectionLayout = {
  colsLg: 6,
  itemsLayout: "stack",
};

export function BuildFormTab({
  modelId,
  initial,
}: {
  modelId: string;
  initial: BuildSpec[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [items, setItems] = useState<Item[]>(
    initial.map((s) => ({
      id: s.id,
      section: s.section as BuildSectionKey,
      name: s.name,
      sort_order: s.sort_order ?? 0,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  const pendingRef = useRef<Map<string, BuildSpecUpdate>>(new Map());
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
            .from("build_specs")
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

  function patchName(id: string, name: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
    pendingRef.current.set(id, { ...pendingRef.current.get(id), name });
    scheduleSave();
  }

  async function addItem(section: BuildSectionKey) {
    const sectionItems = items.filter((i) => i.section === section);
    const sortOrder = sectionItems.length
      ? Math.max(...sectionItems.map((p) => p.sort_order)) + 1
      : 0;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("build_specs")
        .insert({
          van_model_id: modelId,
          section,
          name: "",
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
          sort_order: data.sort_order ?? sortOrder,
        },
      ]);
      setAutoFocusId(data.id);
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
        .from("build_specs")
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
        {BUILD_FORM_SECTIONS.map((section) => {
          const layout =
            BUILD_SECTION_LAYOUT[section.key] ?? DEFAULT_BUILD_SECTION_LAYOUT;
          const sectionItems = items
            .filter((i) => i.section === section.key)
            .sort((a, b) => a.sort_order - b.sort_order);

          const renderItem = (it: Item) => (
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
                  onChange={(e) => patchName(it.id, e.target.value)}
                  onBlur={flushIfPending}
                  placeholder="Spec name"
                  autoFocus={autoFocusId === it.id}
                />
              </Box>
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
          } else if (layout.itemsLayout === "grid2") {
            itemsNode = (
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
              >
                {sectionItems.map(renderItem)}
              </Box>
            );
          } else {
            itemsNode = <Stack spacing={1}>{sectionItems.map(renderItem)}</Stack>;
          }

          return (
            <Grid key={section.key} size={{ xs: 12, lg: layout.colsLg }}>
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
