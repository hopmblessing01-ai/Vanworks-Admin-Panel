import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderEditor } from "./order-editor";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, van_model:van_models(id, name, image_url, price)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const [
    { data: salesSpecs },
    { data: buildSpecs },
    { data: selections },
    { data: extras },
  ] = await Promise.all([
    supabase
      .from("sales_specs")
      .select("*")
      .eq("van_model_id", order.van_model_id)
      .order("section")
      .order("sort_order"),
    supabase
      .from("build_specs")
      .select("*")
      .eq("van_model_id", order.van_model_id)
      .order("section")
      .order("sort_order"),
    supabase
      .from("order_sales_selections")
      .select("*")
      .eq("order_id", order.id),
    supabase
      .from("order_build_extras")
      .select("*")
      .eq("order_id", order.id)
      .order("sort_order"),
  ]);

  return (
    <OrderEditor
      order={order as never}
      salesSpecs={salesSpecs ?? []}
      buildSpecs={buildSpecs ?? []}
      selections={selections ?? []}
      extras={extras ?? []}
    />
  );
}
