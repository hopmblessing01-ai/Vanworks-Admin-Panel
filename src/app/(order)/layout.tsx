import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Logo } from "@/components/brand/logo";

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "rgba(245, 247, 250, 0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1.5,
            }}
          >
            <Link href="/dashboard" style={{ display: "inline-flex" }}>
              <Logo size="sm" />
            </Link>
            <Link
              href="/orders"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--mui-palette-text-secondary)",
                textDecoration: "none",
              }}
            >
              All orders
            </Link>
          </Box>
        </Container>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: "divider",
          py: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Built with care · Vanworks © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
