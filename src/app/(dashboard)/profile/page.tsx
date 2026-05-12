import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile — Vanworks" };

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Your profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your name, photo, and password.
        </Typography>
      </Box>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initialName={profile?.full_name ?? ""}
        initialPhoto={profile?.photo_url ?? null}
        role={profile?.role ?? "user"}
      />
    </Stack>
  );
}
