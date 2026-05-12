import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Sign in — Vanworks" };

export default function LoginPage() {
  return (
    <Card sx={{ boxShadow: 6 }}>
      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your Vanworks admin account.
          </Typography>
        </Box>

        <LoginForm />

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--mui-palette-primary-main)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Create one
          </Link>
        </Typography>
      </Box>
    </Card>
  );
}
