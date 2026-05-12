"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Set a user's role. Admin-only.
 */
export async function setUserRoleAction(
  userId: string,
  role: "admin" | "user",
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") return { error: "Forbidden." };

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { ok: true };
}

/**
 * Approve (or revoke) a user. Admin-only.
 *
 * When approving, also emails the user a magic link that signs them in and
 * lands them on /dashboard. The email body itself is controlled by Supabase's
 * "Magic Link" email template (Dashboard → Authentication → Email Templates).
 */
export async function setUserApprovedAction(
  userId: string,
  approved: boolean,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") return { error: "Forbidden." };

  const admin = createAdminClient();

  const { data: target, error: lookupErr } = await admin
    .from("profiles")
    .select("email, full_name, approved")
    .eq("id", userId)
    .maybeSingle();
  if (lookupErr || !target) {
    return { error: lookupErr?.message ?? "User not found." };
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ approved })
    .eq("id", userId);
  if (updateErr) return { error: updateErr.message };

  // Only send the "approved" email when we're flipping pending → approved.
  if (approved && !target.approved && target.email) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
      options: {
        redirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      },
    });

    if (linkErr) {
      // Don't fail the approval — the admin already approved them. Just warn.
      console.error("Failed to send approval email:", linkErr.message);
      revalidatePath("/users");
      return {
        ok: true,
        warning: `User approved, but email failed to send: ${linkErr.message}`,
      };
    }
  }

  revalidatePath("/users");
  return { ok: true };
}
