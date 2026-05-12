"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import type { Role } from "@/lib/constants";

type Props = {
  user: {
    email: string;
    name: string | null;
    photo: string | null;
    role: Role;
  };
};

export function Topbar({ user }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAnchorEl(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "rgba(255,255,255,0.85)",
        color: "text.primary",
        backdropFilter: "blur(8px)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: 64,
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
          }}
        >
          <MenuIcon sx={{ color: "text.secondary" }} />
          <Logo size="sm" />
        </Box>

        <Box sx={{ display: { xs: "none", md: "block" } }} />

        <Box
          component="button"
          onClick={(e: React.MouseEvent<HTMLElement>) =>
            setAnchorEl(e.currentTarget)
          }
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            borderRadius: 999,
            padding: "4px 12px 4px 4px",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <Avatar
            src={user.photo}
            fallback={initials(user.name ?? user.email)}
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>
              {user.name ?? user.email.split("@")[0]}
            </Typography>
            {/* <Typography
              sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.2 }}
            >
              {user.email}
            </Typography> */}
          </Box>
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role}
          </Badge>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, mt: 1 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {user.name ?? "Vanworks user"}
            </Typography>
            <Typography
              sx={{ fontSize: 12, color: "text.secondary" }}
            >
              {user.email}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            component={Link}
            href="/profile"
            onClick={() => setAnchorEl(null)}
            sx={{ gap: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={signOut} sx={{ color: "error.main", gap: 1 }}>
            <ListItemIcon sx={{ color: "error.main", minWidth: 32 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
