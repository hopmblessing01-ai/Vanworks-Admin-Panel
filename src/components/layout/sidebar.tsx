"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import { Logo } from "@/components/brand/logo";
import type { Role } from "@/lib/constants";
import type { SvgIconComponent } from "@mui/icons-material";

type NavItem = {
  href: string;
  label: string;
  icon: SvgIconComponent;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/orders", label: "Orders", icon: AssignmentIcon },
  { href: "/van-models", label: "Van Models", icon: LocalShippingIcon },
  { href: "/users", label: "Users", icon: GroupIcon, adminOnly: true },
];

export const DASHBOARD_DRAWER_WIDTH = 256;

function DashboardNavList({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <List sx={{ flex: 1, px: 1.5, py: 2 }}>
      {NAV.filter((n) => !n.adminOnly || role === "admin").map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={active}
              onClick={onNavigate}
              sx={{
                borderRadius: 1.5,
                color: "inherit",
                "&.Mui-selected": {
                  backgroundColor: "sidebar.hover",
                  color: "common.white",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "sidebar.hover",
                },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontSize: 14, fontWeight: 500 } },
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
}) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: DASHBOARD_DRAWER_WIDTH,
          boxSizing: "border-box",
          backgroundColor: "sidebar.main",
          color: "sidebar.contrastText",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
      slotProps={{ paper: { elevation: 8 } }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.5,
          borderBottom: 1,
          borderColor: "sidebar.border",
        }}
      >
        <Link
          href="/dashboard"
          style={{ textDecoration: "none" }}
          onClick={onClose}
        >
          <Logo variant="dark" />
        </Link>
        <IconButton
          onClick={onClose}
          aria-label="Close menu"
          sx={{ color: "rgba(255,255,255,0.85)" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DashboardNavList role={role} onNavigate={onClose} />

      <Box
        sx={{
          p: 2.5,
          borderTop: 1,
          borderColor: "sidebar.border",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
        >
          Vanworks Admin · v0.1
        </Typography>
      </Box>
    </Drawer>
  );
}

export function Sidebar({ role }: { role: Role }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "flex" },
        width: DASHBOARD_DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DASHBOARD_DRAWER_WIDTH,
          boxSizing: "border-box",
          position: "relative",
          minHeight: "100vh",
          height: "100%",
          backgroundColor: "sidebar.main",
          color: "sidebar.contrastText",
          borderRight: 0,
        },
      }}
      slotProps={{ paper: { elevation: 0 } }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          px: 2.5,
          borderBottom: 1,
          borderColor: "sidebar.border",
        }}
      >
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <Logo variant="dark" />
        </Link>
      </Box>

      <DashboardNavList role={role} />

      <Box
        sx={{
          p: 2.5,
          borderTop: 1,
          borderColor: "sidebar.border",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
        >
          Vanworks Admin · v0.1
        </Typography>
      </Box>
    </Drawer>
  );
}
