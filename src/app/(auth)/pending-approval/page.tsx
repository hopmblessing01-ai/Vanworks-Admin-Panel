import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalClient } from "./pending-approval-client";

export const metadata = { title: "Pending approval — Vanworks" };
export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session — go to login.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("approved")
    .eq("id", user.id)
    .maybeSingle();

  // Already approved — skip the wait, go straight to the dashboard.
  // This handles the "reload after approval" case.
  if (profile?.approved) redirect("/dashboard");

  return <PendingApprovalClient userId={user.id} />;
}
