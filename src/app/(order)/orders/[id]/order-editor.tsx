"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import SaveIcon from "@mui/icons-material/Save";
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
import { SALES_FORM_SECTIONS, BUILD_FORM_SECTIONS } from "@/lib/constants";
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
type Extra = Database["public"]["Tables"]["order_build_extras"]["Row"];

type Props = {
  order: Order;
  salesSpecs: SalesSpec[];
  buildSpecs: BuildSpec[];
  selections: Selection[];
  extras: Extra[];
};

const ADDON_OR_COLOR = new Set<string>(
  SALES_FORM_SECTIONS.filter((s) => s.kind !== "spec").map((s) => s.key),
);

export function OrderEditor({
  order,
  salesSpecs,
  buildSpecs,
  selections,
  extras,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

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
    return total;
  }, [salesSpecs, selected]);

  const total = Number(mainPrice) + addonsPrice;

  useEffect(() => {
    const selectedWall = salesSpecs.find(
      (s) => s.section === "WALL_COLOR" && selected[s.id],
    );
    if (selectedWall) setFabricColor(selectedWall.name);
  }, [selected, salesSpecs]);

  useEffect(() => {
    const selectedFloor = salesSpecs.find(
      (s) => s.section === "FLOOR_COLOR" && selected[s.id],
    );
    if (selectedFloor) setFloorColor(selectedFloor.name);
  }, [selected, salesSpecs]);

  const selectedAddonNames = useMemo(() => {
    return salesSpecs
      .filter(
        (s) =>
          (s.section === "CABIN_ADDONS" ||
            s.section === "MISC_ADDONS" ||
            s.section === "EXTERIOR_ADDONS") &&
          selected[s.id],
      )
      .map((s) => ({ id: s.id, name: s.name, price: Number(s.price ?? 0) }));
  }, [salesSpecs, selected]);

  const toggle = useCallback(
    (specId: string) =>
      setSelected((p) => ({ ...p, [specId]: !p[specId] })),
    [],
  );

  async function onSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: oerr } = await supabase
        .from("orders")
        .update({
          customer_name: customerName.trim() || "Unnamed",
          order_date: orderDate,
          sales_notes: salesNotes,
          build_notes: buildNotes,
          fabric_color: fabricColor,
          floor_color: floorColor,
          main_price: mainPrice,
          addons_price: addonsPrice,
          total,
        })
        .eq("id", order.id);
      if (oerr) throw oerr;

      const { error: delErr } = await supabase
        .from("order_sales_selections")
        .delete()
        .eq("order_id", order.id);
      if (delErr) throw delErr;
      const toInsert = Object.entries(selected)
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
      const extrasInsert = otherExtras
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

      toast.success("Order saved.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

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
        const supabase = createClient();
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
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {order.van_model?.name ?? "Van Model"}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Order for{" "}
                  <Box component="span" sx={{ color: "primary.main" }}>
                    {customerName || "—"}
                  </Box>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Created {formatDate(order.created_at)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
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
                <Button variant="outline" size="icon" onClick={onDelete}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={14}
                        sx={{ color: "currentColor" }}
                      />
                    ) : (
                      <SaveIcon sx={{ fontSize: 16 }} />
                    )
                  }
                >
                  Save
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Label sx={{ fontSize: 12, mb: 1 }}>Customer name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Label sx={{ fontSize: 12, mb: 1 }}>Order date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
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
            fabricColor={fabricColor}
            floorColor={floorColor}
            mainPrice={Number(mainPrice)}
            addonsPrice={addonsPrice}
            total={total}
            salesNotes={salesNotes}
            setSalesNotes={setSalesNotes}
          />
        </TabsContent>

        <TabsContent value="build">
          <BuildFormView
            buildSpecs={buildSpecs}
            selectedAddons={selectedAddonNames}
            extras={otherExtras}
            setExtras={setOtherExtras}
            buildNotes={buildNotes}
            setBuildNotes={setBuildNotes}
          />
        </TabsContent>
      </Tabs>

      <Box sx={{ display: "flex", justifyContent: "flex-end", pb: 3 }}>
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
          Save order
        </Button>
      </Box>
    </Stack>
  );
}

function SalesFormView({
  salesSpecs,
  selected,
  onToggle,
  fabricColor,
  floorColor,
  mainPrice,
  addonsPrice,
  total,
  salesNotes,
  setSalesNotes,
}: {
  salesSpecs: SalesSpec[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  fabricColor: string | null;
  floorColor: string | null;
  mainPrice: number;
  addonsPrice: number;
  total: number;
  salesNotes: string;
  setSalesNotes: (s: string) => void;
}) {
  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        {SALES_FORM_SECTIONS.map((section) => {
          const sectionSpecs = salesSpecs.filter(
            (s) => s.section === section.key,
          );
          const isCheckable =
            section.kind === "addon" || section.kind === "color";
          return (
            <Grid key={section.key} size={{ xs: 12, lg: 6 }}>
              <Card>
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

                  {sectionSpecs.length === 0 ? (
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
                      No {section.label.toLowerCase()} configured for this
                      model.
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {sectionSpecs.map((spec) => {
                        const checked = !!selected[spec.id];
                        const highlighted = isCheckable && checked;
                        return (
                          <Box
                            key={spec.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              borderRadius: 1.5,
                              border: 1,
                              borderColor: highlighted
                                ? "primary.main"
                                : "divider",
                              backgroundColor: highlighted
                                ? "rgba(71, 85, 105, 0.06)"
                                : "background.default",
                              px: 1.5,
                              py: 1,
                              transition: "all 0.15s",
                            }}
                          >
                            {isCheckable && (
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => onToggle(spec.id)}
                              />
                            )}
                            {section.kind === "color" && spec.image_url && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={spec.image_url}
                                alt={spec.name}
                                style={{
                                  height: 48,
                                  width: 48,
                                  borderRadius: 6,
                                  objectFit: "cover",
                                  border: "1px solid rgba(0,0,0,0.12)",
                                }}
                              />
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                }}
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
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatCurrency(spec.price)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
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
              <SummaryRow label="Fabric color" value={fabricColor ?? "—"} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SummaryRow label="Floor color" value={floorColor ?? "—"} />
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
            />
          </Box>
        </Stack>
      </Card>
    </Stack>
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

function BuildFormView({
  buildSpecs,
  selectedAddons,
  extras,
  setExtras,
  buildNotes,
  setBuildNotes,
}: {
  buildSpecs: BuildSpec[];
  selectedAddons: { id: string; name: string; price: number }[];
  extras: { id?: string; tempId: string; name: string }[];
  setExtras: React.Dispatch<
    React.SetStateAction<{ id?: string; tempId: string; name: string }[]>
  >;
  buildNotes: string;
  setBuildNotes: (s: string) => void;
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
          const sectionSpecs = buildSpecs.filter(
            (b) => b.section === section.key,
          );
          return (
            <Grid key={section.key} size={{ xs: 12, lg: 6 }}>
              <Card>
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
                  {sectionSpecs.length === 0 ? (
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
                  ) : (
                    <Stack spacing={0.75}>
                      {sectionSpecs.map((s) => (
                        <Box
                          key={s.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontSize: 14,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                            }}
                          />
                          {s.name}
                        </Box>
                      ))}
                    </Stack>
                  )}
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
              Mirrored from the sales form (selected add-ons appear
              automatically):
            </Typography>
            {selectedAddons.length === 0 ? (
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
              <Grid container spacing={1}>
                {selectedAddons.map((a) => (
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
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(a.price)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
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
              <Button size="sm" variant="outline" onClick={addExtra}>
                + Add extra
              </Button>
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
                Add custom items not listed in the sales add-ons.
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
                      />
                    </Box>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeExtra(e.tempId)}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </Button>
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
            />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
