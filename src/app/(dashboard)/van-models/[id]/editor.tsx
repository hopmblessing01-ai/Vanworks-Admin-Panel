"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./info-tab";
import { SalesFormTab } from "./sales-form-tab";
import { BuildFormTab } from "./build-form-tab";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/confirm/confirm-provider";
import type { Database } from "@/lib/supabase/types";

type Model = Database["public"]["Tables"]["van_models"]["Row"];
type SalesSpec = Database["public"]["Tables"]["sales_specs"]["Row"];
type BuildSpec = Database["public"]["Tables"]["build_specs"]["Row"];

export function VanModelEditor({
  model,
  salesSpecs,
  buildSpecs,
}: {
  model: Model;
  salesSpecs: SalesSpec[];
  buildSpecs: BuildSpec[];
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this van model?",
      description:
        "This cannot be undone. All sales and build form specs for this model will be removed.",
      confirmText: "Delete model",
      cancelText: "Cancel",
      tone: "danger",
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from("van_models")
          .delete()
          .eq("id", model.id);
        if (error) {
          toast.error(error.message);
          throw error;
        }
      },
    });
    if (!ok) return;
    toast.success("Van model deleted.");
    router.push("/van-models");
    router.refresh();
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
        >
          Delete model
        </Button>
      </Box>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="sales">Sales Form</TabsTrigger>
          <TabsTrigger value="build">Build Form</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoTab model={model} />
        </TabsContent>

        <TabsContent value="sales">
          <SalesFormTab modelId={model.id} initial={salesSpecs} />
        </TabsContent>

        <TabsContent value="build">
          <BuildFormTab modelId={model.id} initial={buildSpecs} />
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
