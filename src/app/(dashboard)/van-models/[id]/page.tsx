import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { VanModelEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function VanModelEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: model } = await supabase
    .from("van_models")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!model) notFound();

  const [{ data: sales }, { data: build }] = await Promise.all([
    supabase
      .from("sales_specs")
      .select("*")
      .eq("van_model_id", params.id)
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("build_specs")
      .select("*")
      .eq("van_model_id", params.id)
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          component={Link}
          href="/van-models"
          variant="ghost"
          size="sm"
          startIcon={<KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />}
        >
          Van Models
        </Button>
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {model.name || "Untitled Model"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage info, sales form specs, and build form specs.
        </Typography>
      </Box>

      <VanModelEditor
        model={model}
        salesSpecs={sales ?? []}
        buildSpecs={build ?? []}
      />
    </Stack>
  );
}
