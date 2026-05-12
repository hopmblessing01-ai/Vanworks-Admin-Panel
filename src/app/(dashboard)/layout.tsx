import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const DRAWER_WIDTH = 256;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Keep the session alive so /pending-approval can detect approval in
  // realtime and redirect the user to /dashboard without re-logging-in.
  if (profile && !profile.approved) {
    redirect("/pending-approval");
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Sidebar role={profile?.role ?? "user"} />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          ml: { md: `${DRAWER_WIDTH}px` },
          minWidth: 0,
        }}
      >
        <Topbar
          user={{
            email: user.email ?? "",
            name: profile?.full_name ?? null,
            photo: profile?.photo_url ?? null,
            role: profile?.role ?? "user",
          }}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, lg: 4 },
            py: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
