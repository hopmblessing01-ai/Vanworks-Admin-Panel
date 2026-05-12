import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      className="auth-pattern"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Box component="header" sx={{ px: { xs: 3, sm: 5 }, py: 2.5 }}>
        <Link href="/login" style={{ display: "inline-flex" }}>
          <Logo size="md" />
        </Link>
      </Box>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pb: 6,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>{children}</Box>
      </Container>

      <Box
        component="footer"
        sx={{ px: 3, py: 2.5, textAlign: "center" }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Vanworks. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
