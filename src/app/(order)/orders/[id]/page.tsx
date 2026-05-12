import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderEditor } from "./order-editor";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userClient = createClient();

  // Anyone with the share link can view the order detail page. Whether they
  // can edit it depends on profile.approved (RLS enforces this on writes).
  const {
    data: { user },
  } = await userClient.auth.getUser();

  // For guests (no session), fall back to the service-role admin client so
  // RLS doesn't block the read. Server-only, never exposed to the browser.
  const readClient = user ? userClient : createAdminClient();

  const { data: order } = await readClient
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
    { data: buildExtras },
    { data: salesExtras },
    profileRes,
  ] = await Promise.all([
    readClient
      .from("sales_specs")
      .select("*")
      .eq("van_model_id", order.van_model_id)
      .order("section")
      .order("sort_order"),
    readClient
      .from("build_specs")
      .select("*")
      .eq("van_model_id", order.van_model_id)
      .order("section")
      .order("sort_order"),
    readClient
      .from("order_sales_selections")
      .select("*")
      .eq("order_id", order.id),
    readClient
      .from("order_build_extras")
      .select("*")
      .eq("order_id", order.id)
      .order("sort_order"),
    readClient
      .from("order_sales_extras")
      .select("*")
      .eq("order_id", order.id)
      .order("sort_order"),
    user
      ? userClient
          .from("profiles")
          .select("approved, role")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileRes.data;
  const canEdit = Boolean(profile?.approved) || profile?.role === "admin";

  return (
    <OrderEditor
      order={order as never}
      salesSpecs={salesSpecs ?? []}
      buildSpecs={buildSpecs ?? []}
      selections={selections ?? []}
      extras={buildExtras ?? []}
      salesExtras={salesExtras ?? []}
      canEdit={canEdit}
    />
  );
}
