"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Model = { id: string; name: string; image_url: string | null };
type Order = {
  id: string;
  van_model_id: string;
  customer_name: string;
  order_date: string;
  total: number | string;
  created_at: string;
  van_model: Model | null;
};

export function OrdersListClient({
  initialOrders,
  models,
}: {
  initialOrders: Order[];
  models: Model[];
}) {
  const router = useRouter();
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [sort, setSort] = useState<"recent" | "model_asc">("recent");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");
  const [newModelId, setNewModelId] = useState<string>("");

  const orders = useMemo(() => {
    let arr = [...initialOrders];
    if (modelFilter !== "all") {
      arr = arr.filter((o) => o.van_model_id === modelFilter);
    }
    if (sort === "recent") {
      arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else {
      arr.sort((a, b) =>
        (a.van_model?.name ?? "").localeCompare(b.van_model?.name ?? ""),
      );
    }
    return arr;
  }, [initialOrders, modelFilter, sort]);

  async function onCreate() {
    if (!newModelId) {
      toast.error("Please select a van model.");
      return;
    }
    if (!newCustomer.trim()) {
      toast.error("Please enter a customer name.");
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();
      const model = models.find((m) => m.id === newModelId);

      const { data: vm } = await supabase
        .from("van_models")
        .select("price")
        .eq("id", newModelId)
        .maybeSingle();

      const { data: created, error } = await supabase
        .from("orders")
        .insert({
          van_model_id: newModelId,
          customer_name: newCustomer.trim(),
          main_price: vm?.price ?? 0,
          total: vm?.price ?? 0,
        })
        .select("id")
        .single();
      if (error || !created) throw error ?? new Error("Failed to create order.");

      toast.success(`Order started for ${model?.name ?? "model"}.`);
      setOpen(false);
      setNewCustomer("");
      setNewModelId("");
      window.open(`/orders/${created.id}`, "_blank");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create order.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Orders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View existing orders or start a new one.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 220 }}>
            <Label sx={{ fontSize: 11, textTransform: "uppercase", mb: 0.5 }}>
              Model
            </Label>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Box sx={{ minWidth: 220 }}>
            <Label sx={{ fontSize: 11, textTransform: "uppercase", mb: 0.5 }}>
              Sort by
            </Label>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="model_asc">Model A–Z</SelectItem>
              </SelectContent>
            </Select>
          </Box>
        </Stack>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            onClick={() => setOpen(true)}
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          >
            New Order
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new order</DialogTitle>
              <DialogDescription>
                Select a van model and enter a customer name. The order will
                open in a new tab.
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <Stack spacing={2}>
                <Box>
                  <Label sx={{ mb: 1 }}>Van Model</Label>
                  <Select value={newModelId} onValueChange={setNewModelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a van model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.length === 0 ? (
                        <Box
                          sx={{
                            px: 2,
                            py: 3,
                            textAlign: "center",
                            color: "text.secondary",
                          }}
                        >
                          No models yet. Create one first.
                        </Box>
                      ) : (
                        models.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Box>
                <Box>
                  <Label sx={{ mb: 1 }}>Customer name</Label>
                  <Input
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="e.g., John Smith"
                  />
                </Box>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={onCreate}
                disabled={creating}
                startIcon={
                  creating ? (
                    <CircularProgress
                      size={16}
                      sx={{ color: "currentColor" }}
                    />
                  ) : undefined
                }
              >
                Create order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Box>

      {orders.length === 0 ? (
        <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
          <CardContent>
            <Stack
              spacing={1.5}
              sx={{
                py: 6,
                textAlign: "center",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.04)",
                  color: "text.secondary",
                }}
              >
                <AssignmentIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6">No orders yet</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 360 }}
              >
                Start a new order to begin building a customer&apos;s van.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {orders.map((o) => (
            <Grid key={o.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <Card
                component={Link}
                href={`/orders/${o.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                    borderColor: "primary.main",
                  },
                  "&:hover .order-image": {
                    transform: "scale(1.03)",
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    width: "100%",
                    overflow: "hidden",
                    backgroundColor: "rgba(0,0,0,0.04)",
                  }}
                >
                  {o.van_model?.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={o.van_model.image_url}
                      alt={o.van_model.name}
                      className="order-image"
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s",
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
                      <LocalShippingIcon sx={{ fontSize: 40 }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {o.customer_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {o.van_model?.name ?? "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(o.order_date)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
