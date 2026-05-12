import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Authentication error — Vanworks" };

export default function AuthErrorPage() {
  return (
    <Box
      className="auth-pattern"
      sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Box component="header" sx={{ px: { xs: 3, sm: 5 }, py: 2.5 }}>
        <Link href="/login" style={{ display: "inline-flex" }}>
          <Logo />
        </Link>
      </Box>
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pb: 6,
        }}
      >
        <Card sx={{ width: "100%", boxShadow: 6 }}>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
              }}
            >
              <WarningAmberIcon sx={{ color: "error.main", fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Something went wrong
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              The link may have expired or already been used. Please try
              signing in again, or request a new email.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button component={Link} href="/login">
                Back to sign in
              </Button>
              <Button
                variant="outline"
                component={Link}
                href="/forgot-password"
              >
                Request new link
              </Button>
            </Stack>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
