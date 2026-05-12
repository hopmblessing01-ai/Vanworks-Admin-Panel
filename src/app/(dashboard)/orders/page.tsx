import { createClient } from "@/lib/supabase/server";
import { OrdersListClient } from "./orders-list-client";

export const metadata = { title: "Orders — Vanworks" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();
  const [{ data: orders }, { data: models }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, van_model:van_models(id, name, image_url)")
      .order("created_at", { ascending: false }),
    supabase
      .from("van_models")
      .select("id, name, image_url")
      .order("name", { ascending: true }),
  ]);

  return (
    <OrdersListClient
      initialOrders={(orders as never) ?? []}
      models={models ?? []}
    />
  );
}
