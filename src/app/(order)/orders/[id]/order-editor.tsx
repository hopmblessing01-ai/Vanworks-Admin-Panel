"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Radio from "@mui/material/Radio";
import CheckIcon from "@mui/icons-material/Check";
import ShareIcon from "@mui/icons-material/IosShare";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  SALES_FORM_SECTIONS,
  SALES_SECTION_LAYOUT,
  BUILD_FORM_SECTIONS,
  BUILD_SECTION_LAYOUT,
  DEFAULT_BUILD_SECTION_LAYOUT,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/confirm/confirm-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  van_model:
    | (Database["public"]["Tables"]["van_models"]["Row"] & {
        price: number;
      })
    | null;
};
type SalesSpec = Database["public"]["Tables"]["sales_specs"]["Row"];
type BuildSpec = Database["public"]["Tables"]["build_specs"]["Row"];
type Selection =
  Database["public"]["Tables"]["order_sales_selections"]["Row"];
type BuildExtraRow = Database["public"]["Tables"]["order_build_extras"]["Row"];
type SalesExtraRow = Database["public"]["Tables"]["order_sales_extras"]["Row"];

type AddonSection = "CABIN_ADDONS" | "MISC_ADDONS" | "EXTERIOR_ADDONS";

/** Sales add-on sections in display order (matches sales sheet). */
const SALES_ADDON_SECTIONS = SALES_FORM_SECTIONS.filter(
  (s): s is (typeof SALES_FORM_SECTIONS)[number] & { key: AddonSection } =>
    s.kind === "addon",
);

type SalesExtraDraft = {
  id?: string;
  tempId: string;
  section: AddonSection;
  name: string;
  price: number;
};

type Props = {
  order: Order;
  salesSpecs: SalesSpec[];
  buildSpecs: BuildSpec[];
  selections: Selection[];
  extras: BuildExtraRow[];
  salesExtras?: SalesExtraRow[];
  /** When false, the editor renders in read-only mode (no auto-save, inputs
   *  disabled). Defaults to true. */
  canEdit?: boolean;
};

const ADDON_OR_COLOR = new Set<string>(
  SALES_FORM_SECTIONS.filter((s) => s.kind !== "spec").map((s) => s.key),
);

const AUTOSAVE_DEBOUNCE_MS = 600;

export function OrderEditor({
  order,
  salesSpecs,
  buildSpecs,
  selections,
  extras,
  salesExtras = [],
  canEdit = true,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const supabase = useMemo(() => createClient(), []);

  const [customerName, setCustomerName] = useState(order.customer_name);
  const [orderDate, setOrderDate] = useState<string>(
    order.order_date?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
  );
  const [salesNotes, setSalesNotes] = useState(order.sales_notes ?? "");
  const [buildNotes, setBuildNotes] = useState(order.build_notes ?? "");
  const [fabricColor, setFabricColor] = useState<string | null>(
    order.fabric_color,
  );
  const [floorColor, setFloorColor] = useState<string | null>(order.floor_color);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      selections.filter((s) => s.selected).map((s) => [s.sales_spec_id, true]),
    ),
  );
  const [otherExtras, setOtherExtras] = useState<
    { id?: string; tempId: string; name: string }[]
  >(
    extras.map((e) => ({ id: e.id, tempId: e.id, name: e.name })),
  );
  const [customSalesExtras, setCustomSalesExtras] = useState<SalesExtraDraft[]>(
    salesExtras.map((e) => ({
      id: e.id,
      tempId: e.id,
      section: e.section as AddonSection,
      name: e.name,
      price: Number(e.price ?? 0),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const mainPrice = order.van_model?.price ?? 0;

  const addonsPrice = useMemo(() => {
    let total = 0;
    for (const spec of salesSpecs) {
      if (ADDON_OR_COLOR.has(spec.section) && selected[spec.id]) {
        total += Number(spec.price ?? 0);
      }
    }
    for (const ce of customSalesExtras) {
      if (ce.name.trim()) total += Number(ce.price ?? 0);
    }
    return total;
  }, [salesSpecs, selected, customSalesExtras]);

  const total = Number(mainPrice) + addonsPrice;

  const selectedWallSpec = useMemo(
    () =>
      salesSpecs.find(
        (s) => s.section === "WALL_COLOR" && selected[s.id],
      ) ?? null,
    [salesSpecs, selected],
  );
  const selectedFloorSpec = useMemo(
    () =>
      salesSpecs.find(
        (s) => s.section === "FLOOR_COLOR" && selected[s.id],
      ) ?? null,
    [salesSpecs, selected],
  );

  // Keep orders.fabric_color / orders.floor_color (text columns) in sync
  // with the radio-selected swatches.
  useEffect(() => {
    setFabricColor(selectedWallSpec?.name ?? null);
  }, [selectedWallSpec]);
  useEffect(() => {
    setFloorColor(selectedFloorSpec?.name ?? null);
  }, [selectedFloorSpec]);

  const selectedSalesAddons = useMemo(() => {
    const fromCatalog = salesSpecs
      .filter(
        (s) =>
          (s.section === "CABIN_ADDONS" ||
            s.section === "MISC_ADDONS" ||
            s.section === "EXTERIOR_ADDONS") &&
          selected[s.id],
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price ?? 0),
        section: s.section as AddonSection,
      }));
    const fromCustom = customSalesExtras
      .filter((e) => e.name.trim())
      .map((e) => ({
        id: e.id ?? e.tempId,
        name: e.name,
        price: Number(e.price ?? 0),
        section: e.section,
      }));
    return [...fromCatalog, ...fromCustom];
  }, [salesSpecs, selected, customSalesExtras]);

  const toggle = useCallback(
    (specId: string) =>
      setSelected((p) => ({ ...p, [specId]: !p[specId] })),
    [],
  );

  /** Radio-style selection: at most one spec selected per color section. */
  const selectColor = useCallback(
    (specId: string, sectionKey: string) => {
      setSelected((prev) => {
        const next: Record<string, boolean> = { ...prev };
        for (const s of salesSpecs) {
          if (s.section === sectionKey) next[s.id] = false;
        }
        next[specId] = !prev[specId];
        return next;
      });
    },
    [salesSpecs],
  );

  // -------- Auto-save --------
  const isMountedRef = useRef(false);
  const flushingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot of latest state for flushes that fire outside React's render
  // cycle (e.g. window beforeunload).
  const stateRef = useRef({
    customerName,
    orderDate,
    salesNotes,
    buildNotes,
    fabricColor,
    floorColor,
    selected,
    otherExtras,
    customSalesExtras,
    mainPrice,
    addonsPrice,
    total,
  });
  stateRef.current = {
    customerName,
    orderDate,
    salesNotes,
    buildNotes,
    fabricColor,
    floorColor,
    selected,
    otherExtras,
    customSalesExtras,
    mainPrice,
    addonsPrice,
    total,
  };

  const flushNow = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setSaving(true);
    try {
      const s = stateRef.current;

      const { error: oerr } = await supabase
        .from("orders")
        .update({
          customer_name: s.customerName.trim() || "Unnamed",
          order_date: s.orderDate,
          sales_notes: s.salesNotes,
          build_notes: s.buildNotes,
          fabric_color: s.fabricColor,
          floor_color: s.floorColor,
          main_price: s.mainPrice,
          addons_price: s.addonsPrice,
          total: s.total,
        })
        .eq("id", order.id);
      if (oerr) throw oerr;

      const { error: delErr } = await supabase
        .from("order_sales_selections")
        .delete()
        .eq("order_id", order.id);
      if (delErr) throw delErr;
      const toInsert = Object.entries(s.selected)
        .filter(([, v]) => v)
        .map(([id]) => ({
          order_id: order.id,
          sales_spec_id: id,
          selected: true,
        }));
      if (toInsert.length) {
        const { error } = await supabase
          .from("order_sales_selections")
          .insert(toInsert);
        if (error) throw error;
      }

      const { error: dext } = await supabase
        .from("order_build_extras")
        .delete()
        .eq("order_id", order.id);
      if (dext) throw dext;
      const extrasInsert = s.otherExtras
        .filter((e) => e.name.trim())
        .map((e, i) => ({
          order_id: order.id,
          name: e.name.trim(),
          sort_order: i,
        }));
      if (extrasInsert.length) {
        const { error } = await supabase
          .from("order_build_extras")
          .insert(extrasInsert);
        if (error) throw error;
      }

      // Custom sales add-ons (per section, with price).
      const { error: dse } = await supabase
        .from("order_sales_extras")
        .delete()
        .eq("order_id", order.id);
      if (dse) throw dse;
      const salesExtrasInsert = s.customSalesExtras
        .filter((e) => e.name.trim())
        .map((e, i) => ({
          order_id: order.id,
          section: e.section,
          name: e.name.trim(),
          price: Number(e.price ?? 0),
          sort_order: i,
        }));
      if (salesExtrasInsert.length) {
        const { error } = await supabase
          .from("order_sales_extras")
          .insert(salesExtrasInsert);
        if (error) throw error;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-save failed.");
    } finally {
      flushingRef.current = false;
      setSaving(false);
    }
  }, [order.id, supabase]);

  // Debounce a save whenever any editable state changes (only when the
  // current viewer is allowed to edit).
  useEffect(() => {
    if (!canEdit) return;
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushNow(), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    canEdit,
    customerName,
    orderDate,
    salesNotes,
    buildNotes,
    fabricColor,
    floorColor,
    selected,
    otherExtras,
    customSalesExtras,
    mainPrice,
    addonsPrice,
    total,
    flushNow,
  ]);

  // Best-effort flush on tab close, plus a final flush on unmount.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!timerRef.current && !flushingRef.current) return;
      void flushNow();
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        void flushNow();
      }
    };
  }, [flushNow]);

  // -------- Actions --------
  async function copyShareLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this order?",
      description:
        "This cannot be undone. All selections and notes on this order will be removed.",
      confirmText: "Delete order",
      cancelText: "Cancel",
      tone: "danger",
      onConfirm: async () => {
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);
        if (error) {
          toast.error(error.message);
          throw error;
        }
      },
    });
    if (!ok) return;
    toast.success("Order deleted.");
    window.location.href = "/orders";
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gap: 0,
            gridTemplateColumns: { md: "280px 1fr" },
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: { xs: 192, md: "100%" },
              width: "100%",
              minHeight: 192,
              backgroundColor: "rgba(0,0,0,0.04)",
            }}
          >
            {order.van_model?.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={order.van_model.image_url}
                alt={order.van_model.name}
                style={{
                  height: "100%",
                  width: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  width: "100%",
                  color: "text.secondary",
                }}
              >
                <LocalShippingIcon sx={{ fontSize: 48 }} />
              </Box>
            )}
          </Box>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 28, sm: 34, md: 40 },
                    lineHeight: 1.15,
                    letterSpacing: "-0.01em",
                    wordBreak: "break-word",
                  }}
                >
                  {order.van_model?.name ?? "Van Model"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                >
                  Created {formatDate(order.created_at)}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexShrink: 0 }}
              >
                {canEdit ? (
                  <SaveStatus saving={saving} />
                ) : (
                  <Box
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      px: 0.5,
                    }}
                  >
                    View only
                  </Box>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                  startIcon={
                    copied ? (
                      <CheckIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <ShareIcon sx={{ fontSize: 16 }} />
                    )
                  }
                >
                  {copied ? "Copied" : "Share"}
                </Button>
                {canEdit && (
                  <Button variant="outline" size="icon" onClick={onDelete}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </Button>
                )}
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Label sx={{ fontSize: 12, mb: 1 }}>Customer name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Label sx={{ fontSize: 12, mb: 1 }}>Order date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Form</TabsTrigger>
          <TabsTrigger value="build">Build Form</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesFormView
            salesSpecs={salesSpecs}
            selected={selected}
            onToggle={toggle}
            onSelectColor={selectColor}
            selectedWallSpec={selectedWallSpec}
            selectedFloorSpec={selectedFloorSpec}
            customSalesExtras={customSalesExtras}
            setCustomSalesExtras={setCustomSalesExtras}
            mainPrice={Number(mainPrice)}
            addonsPrice={addonsPrice}
            total={total}
            salesNotes={salesNotes}
            setSalesNotes={setSalesNotes}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="build">
          <BuildFormView
            buildSpecs={buildSpecs}
            selectedSalesAddons={selectedSalesAddons}
            extras={otherExtras}
            setExtras={setOtherExtras}
            buildNotes={buildNotes}
            setBuildNotes={setBuildNotes}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

function SaveStatus({ saving }: { saving: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        fontSize: 12,
        color: "text.secondary",
        pr: 0.5,
      }}
    >
      {saving ? (
        <>
          <CircularProgress size={14} />
          <Box component="span">Saving…</Box>
        </>
      ) : (
        <>
          <CheckIcon sx={{ fontSize: 16, color: "success.main" }} />
          <Box component="span">All changes saved</Box>
        </>
      )}
    </Box>
  );
}

function SalesFormView({
  salesSpecs,
  selected,
  onToggle,
  onSelectColor,
  selectedWallSpec,
  selectedFloorSpec,
  customSalesExtras,
  setCustomSalesExtras,
  mainPrice,
  addonsPrice,
  total,
  salesNotes,
  setSalesNotes,
  canEdit,
}: {
  salesSpecs: SalesSpec[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectColor: (id: string, sectionKey: string) => void;
  selectedWallSpec: SalesSpec | null;
  selectedFloorSpec: SalesSpec | null;
  customSalesExtras: SalesExtraDraft[];
  setCustomSalesExtras: React.Dispatch<React.SetStateAction<SalesExtraDraft[]>>;
  mainPrice: number;
  addonsPrice: number;
  total: number;
  salesNotes: string;
  setSalesNotes: (s: string) => void;
  canEdit: boolean;
}) {
  function addCustomExtra(section: AddonSection) {
    setCustomSalesExtras((prev) => [
      ...prev,
      {
        tempId: Math.random().toString(36).slice(2, 9),
        section,
        name: "",
        price: 0,
      },
    ]);
  }
  function updateCustomExtra(
    tempId: string,
    patch: Partial<Pick<SalesExtraDraft, "name" | "price">>,
  ) {
    setCustomSalesExtras((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, ...patch } : e)),
    );
  }
  function removeCustomExtra(tempId: string) {
    setCustomSalesExtras((prev) => prev.filter((e) => e.tempId !== tempId));
  }
  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        {SALES_FORM_SECTIONS.map((section) => {
          const layout = SALES_SECTION_LAYOUT[section.key];
          const sectionSpecs = salesSpecs
            .filter((s) => s.section === section.key)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

          // --- Color sections render as image cards with a radio underneath. ---
          const renderColorCard = (spec: SalesSpec) => {
            const checked = !!selected[spec.id];
            return (
              <Box
                key={spec.id}
                onClick={() => {
                  if (canEdit) onSelectColor(spec.id, section.key);
                }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  p: 1,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: checked ? "primary.main" : "divider",
                  backgroundColor: checked
                    ? "rgba(71, 85, 105, 0.06)"
                    : "background.default",
                  boxShadow: checked ? 2 : 0,
                  transition: "all 0.15s",
                  cursor: canEdit ? "pointer" : "default",
                  width: 96,
                  opacity: !canEdit && !checked ? 0.85 : 1,
                }}
              >
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {spec.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={spec.image_url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}
                </Box>
                <Radio
                  size="small"
                  checked={checked}
                  disabled={!canEdit}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => {
                    if (canEdit) onSelectColor(spec.id, section.key);
                  }}
                  sx={{ p: 0.25 }}
                />
              </Box>
            );
          };

          // --- Addon rows: name on the left, price on the right (justify-between). ---
          const renderAddonRow = (spec: SalesSpec) => {
            const checked = !!selected[spec.id];
            return (
              <Box
                key={spec.id}
                onClick={() => {
                  if (canEdit) onToggle(spec.id);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: checked ? "primary.main" : "divider",
                  backgroundColor: checked
                    ? "rgba(71, 85, 105, 0.06)"
                    : "background.default",
                  px: 1.5,
                  py: 1,
                  transition: "all 0.15s",
                  cursor: canEdit ? "pointer" : "default",
                  opacity: !canEdit && !checked ? 0.85 : 1,
                }}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => canEdit && onToggle(spec.id)}
                  disabled={!canEdit}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
                <Typography
                  sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}
                >
                  {spec.name || (
                    <Box
                      component="span"
                      sx={{
                        color: "text.secondary",
                        fontStyle: "italic",
                      }}
                    >
                      (unnamed)
                    </Box>
                  )}
                </Typography>
                {Number(spec.price) > 0 && (
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "text.primary",
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(spec.price)}
                  </Typography>
                )}
              </Box>
            );
          };

          // --- Plain spec rows: bullet + name. ---
          const renderSpecRow = (spec: SalesSpec) => (
            <Box
              key={spec.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 1.5,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.default",
                px: 1.5,
                py: 1,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                {spec.name || (
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    (unnamed)
                  </Box>
                )}
              </Typography>
            </Box>
          );

          // Custom (off-catalog) add-ons for this addon section.
          const sectionCustomExtras =
            section.kind === "addon"
              ? customSalesExtras.filter(
                  (e) => e.section === (section.key as AddonSection),
                )
              : [];
          const renderCustomExtraRow = (e: SalesExtraDraft) => (
            <Box
              key={e.tempId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 1.5,
                border: 1,
                borderStyle: "dashed",
                borderColor: "divider",
                backgroundColor: "rgba(71, 85, 105, 0.04)",
                px: 1.5,
                py: 0.75,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Input
                  value={e.name}
                  onChange={(ev) =>
                    updateCustomExtra(e.tempId, { name: ev.target.value })
                  }
                  placeholder="Custom add-on name"
                  disabled={!canEdit}
                />
              </Box>
              <Box sx={{ width: 110, flexShrink: 0 }}>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={e.price}
                  onChange={(ev) =>
                    updateCustomExtra(e.tempId, {
                      price: Number.parseFloat(ev.target.value) || 0,
                    })
                  }
                  placeholder="Price"
                  disabled={!canEdit}
                />
              </Box>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCustomExtra(e.tempId)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </Button>
              )}
            </Box>
          );

          let itemsNode: React.ReactNode;
          if (section.kind === "color") {
            itemsNode =
              sectionSpecs.length === 0 ? (
                <EmptyHint label={section.label} />
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                  {sectionSpecs.map(renderColorCard)}
                </Box>
              );
          } else if (section.kind === "addon") {
            const sectionAddonTotal =
              sectionSpecs
                .filter((s) => selected[s.id])
                .reduce((acc, s) => acc + Number(s.price ?? 0), 0) +
              sectionCustomExtras
                .filter((e) => e.name.trim())
                .reduce((acc, e) => acc + Number(e.price ?? 0), 0);

            const catalogNode =
              sectionSpecs.length === 0 ? null : layout.itemsLayout ===
                "grid2" ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  }}
                >
                  {sectionSpecs.map(renderAddonRow)}
                </Box>
              ) : (
                <Stack spacing={1}>{sectionSpecs.map(renderAddonRow)}</Stack>
              );

            const customNode =
              sectionCustomExtras.length === 0 ? null : layout.itemsLayout ===
                "grid2" ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  }}
                >
                  {sectionCustomExtras.map(renderCustomExtraRow)}
                </Box>
              ) : (
                <Stack spacing={1}>
                  {sectionCustomExtras.map(renderCustomExtraRow)}
                </Stack>
              );

            const hasAnyAddonRows =
              sectionSpecs.length > 0 || sectionCustomExtras.length > 0;
            const showEmptyReadOnly =
              sectionSpecs.length === 0 &&
              sectionCustomExtras.length === 0 &&
              !canEdit;

            itemsNode = (
              <Stack spacing={1.25}>
                {catalogNode}
                {customNode}
                {showEmptyReadOnly && <EmptyHint label={section.label} />}
                {!showEmptyReadOnly && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 1.5,
                      border: 1,
                      borderColor: "divider",
                      backgroundColor: "rgba(71, 85, 105, 0.08)",
                      px: 1.5,
                      py: 1,
                      mt: 0.25,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "text.secondary",
                      }}
                    >
                      Section total
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "primary.main",
                      }}
                    >
                      {formatCurrency(sectionAddonTotal)}
                    </Typography>
                  </Box>
                )}
                {canEdit && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      pt: 0.5,
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addCustomExtra(section.key as AddonSection)
                      }
                    >
                      + Add custom add-on
                    </Button>
                  </Box>
                )}
              </Stack>
            );
          } else {
            itemsNode =
              sectionSpecs.length === 0 ? (
                <EmptyHint label={section.label} />
              ) : (
                <Stack spacing={1}>{sectionSpecs.map(renderSpecRow)}</Stack>
              );
          }

          return (
            <Grid key={section.key} size={{ xs: 12, lg: layout.colsLg }}>
              <Card sx={{ height: "100%" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {section.label}
                  </Typography>
                  {itemsNode}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Overall
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ColorSummaryRow label="Fabric color" spec={selectedWallSpec} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <ColorSummaryRow label="Floor color" spec={selectedFloorSpec} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryRow label="Main price" value={formatCurrency(mainPrice)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryRow
                label="Add-ons price"
                value={formatCurrency(addonsPrice)}
              />
            </Grid>
          </Grid>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 2,
              backgroundColor: "rgba(71, 85, 105, 0.1)",
              px: 2,
              py: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "primary.main",
              }}
            >
              Total
            </Typography>
            <Typography
              sx={{ fontSize: 20, fontWeight: 600, color: "primary.main" }}
            >
              {formatCurrency(total)}
            </Typography>
          </Box>

          <Box>
            <Label sx={{ fontSize: 12, mb: 1 }}>Notes</Label>
            <Textarea
              rows={4}
              value={salesNotes}
              onChange={(e) => setSalesNotes(e.target.value)}
              placeholder="Internal notes about this sale..."
              disabled={!canEdit}
            />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: 1,
        borderStyle: "dashed",
        borderColor: "divider",
        backgroundColor: "rgba(0,0,0,0.02)",
        px: 2,
        py: 2.5,
        textAlign: "center",
        fontSize: 12,
        color: "text.secondary",
      }}
    >
      No {label.toLowerCase()} configured for this model.
    </Box>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        backgroundColor: "rgba(0,0,0,0.02)",
        px: 1.5,
        py: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

function ColorSummaryRow({
  label,
  spec,
}: {
  label: string;
  spec: SalesSpec | null;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        backgroundColor: "rgba(0,0,0,0.02)",
        px: 1.5,
        py: 1,
        minHeight: 56,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      {spec?.image_url ? (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.12)",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spec.image_url}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      ) : (
        <Typography
          sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}
        >
          —
        </Typography>
      )}
    </Box>
  );
}

function BuildFormView({
  buildSpecs,
  selectedSalesAddons,
  extras,
  setExtras,
  buildNotes,
  setBuildNotes,
  canEdit,
}: {
  buildSpecs: BuildSpec[];
  selectedSalesAddons: {
    id: string;
    name: string;
    price: number;
    section: AddonSection;
  }[];
  extras: { id?: string; tempId: string; name: string }[];
  setExtras: React.Dispatch<
    React.SetStateAction<{ id?: string; tempId: string; name: string }[]>
  >;
  buildNotes: string;
  setBuildNotes: (s: string) => void;
  canEdit: boolean;
}) {
  function addExtra() {
    setExtras((prev) => [
      ...prev,
      { tempId: Math.random().toString(36).slice(2, 9), name: "" },
    ]);
  }
  function updateExtra(tempId: string, name: string) {
    setExtras((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, name } : e)),
    );
  }
  function removeExtra(tempId: string) {
    setExtras((prev) => prev.filter((e) => e.tempId !== tempId));
  }

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        {BUILD_FORM_SECTIONS.map((section) => {
          const layout =
            BUILD_SECTION_LAYOUT[section.key] ?? DEFAULT_BUILD_SECTION_LAYOUT;
          const sectionSpecs = buildSpecs
            .filter((b) => b.section === section.key)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

          const renderRow = (s: BuildSpec) => (
            <Box
              key={s.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 1.5,
                border: 1,
                borderColor: "divider",
                backgroundColor: "rgba(0,0,0,0.02)",
                px: 1.5,
                py: 1,
                fontSize: 14,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                {s.name || (
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", fontStyle: "italic" }}
                  >
                    (unnamed)
                  </Box>
                )}
              </Typography>
            </Box>
          );

          let itemsNode: React.ReactNode;
          if (sectionSpecs.length === 0) {
            itemsNode = (
              <Box
                sx={{
                  borderRadius: 1.5,
                  border: 1,
                  borderStyle: "dashed",
                  borderColor: "divider",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  px: 2,
                  py: 2.5,
                  textAlign: "center",
                  fontSize: 12,
                  color: "text.secondary",
                }}
              >
                No {section.label.toLowerCase()} configured.
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
                {sectionSpecs.map(renderRow)}
              </Box>
            );
          } else {
            itemsNode = (
              <Stack spacing={1}>{sectionSpecs.map(renderRow)}</Stack>
            );
          }

          return (
            <Grid key={section.key} size={{ xs: 12, lg: layout.colsLg }}>
              <Card sx={{ height: "100%" }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {section.label}
                  </Typography>
                  {itemsNode}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Other Add-Ons
            </Typography>
          </Box>

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Mirrored from the sales form, grouped under the same add-on
              sections (Cabin, Misc, Exterior):
            </Typography>
            {selectedSalesAddons.length === 0 ? (
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
                No add-ons selected on the sales form yet.
              </Box>
            ) : (
              <Stack spacing={2.25}>
                {SALES_ADDON_SECTIONS.map(({ key, label }) => {
                  const items = selectedSalesAddons.filter(
                    (a) => a.section === key,
                  );
                  if (items.length === 0) return null;
                  return (
                    <Box key={key}>
                      <Typography
                        sx={{
                          mb: 1,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: "text.secondary",
                        }}
                      >
                        {label}
                      </Typography>
                      <Grid container spacing={1}>
                        {items.map((a) => (
                          <Grid key={a.id} size={{ xs: 12, sm: 6 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRadius: 1.5,
                                border: 1,
                                borderColor: "divider",
                                backgroundColor: "rgba(0,0,0,0.02)",
                                px: 1.5,
                                py: 1,
                                fontSize: 14,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Checkbox checked disabled />
                                {a.name}
                              </Box>
                              {a.price > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatCurrency(a.price)}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>

          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "text.secondary",
                }}
              >
                Custom extras
              </Typography>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={addExtra}>
                  + Add extra
                </Button>
              )}
            </Box>
            {extras.length === 0 ? (
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
                {canEdit
                  ? "Add custom items not listed in the sales add-ons."
                  : "No custom extras."}
              </Box>
            ) : (
              <Stack spacing={1}>
                {extras.map((e) => (
                  <Box
                    key={e.tempId}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Input
                        value={e.name}
                        onChange={(ev) =>
                          updateExtra(e.tempId, ev.target.value)
                        }
                        placeholder="e.g., Custom roof rack"
                        disabled={!canEdit}
                      />
                    </Box>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeExtra(e.tempId)}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>

          <Box>
            <Label sx={{ fontSize: 12, mb: 1 }}>Build notes</Label>
            <Textarea
              rows={4}
              value={buildNotes}
              onChange={(e) => setBuildNotes(e.target.value)}
              placeholder="Build instructions, callouts, or special considerations..."
              disabled={!canEdit}
            />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
