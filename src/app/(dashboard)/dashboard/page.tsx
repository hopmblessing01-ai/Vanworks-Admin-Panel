import Link from "next/link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { SvgIconComponent } from "@mui/icons-material";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Dashboard — Vanworks" };

async function getCounts() {
  const supabase = createClient();
  const [{ count: orders }, { count: vans }, { count: users }] =
    await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("van_models").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
  return {
    orders: orders ?? 0,
    vans: vans ?? 0,
    users: users ?? 0,
  };
}

type Stat = {
  label: string;
  value: number;
  href: string;
  icon: SvgIconComponent;
};

export default async function DashboardPage() {
  const counts = await getCounts();

  const stats: Stat[] = [
    { label: "Orders", value: counts.orders, href: "/orders", icon: AssignmentIcon },
    { label: "Van Models", value: counts.vans, href: "/van-models", icon: LocalShippingIcon },
    { label: "Users", value: counts.users, href: "/users", icon: GroupIcon },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back. Here&apos;s an overview of your Vanworks operations.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Grid key={s.label} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                component={Link}
                href={s.href}
                sx={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 4,
                    transform: "translateY(-2px)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    >
                      {s.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: "rgba(71, 85, 105, 0.08)",
                      color: "primary.main",
                    }}
                  >
                    <Icon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: 1,
                    borderColor: "divider",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    px: 3,
                    py: 1.25,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  View
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
