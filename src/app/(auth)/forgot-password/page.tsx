import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ForgotPasswordForm } from "./forgot-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Forgot password — Vanworks" };

export default function ForgotPasswordPage() {
  return (
    <Card sx={{ boxShadow: 6 }}>
      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Reset your password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </Typography>
        </Box>

        <ForgotPasswordForm />

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          Remembered it?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--mui-palette-primary-main)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Back to sign in
          </Link>
        </Typography>
      </Box>
    </Card>
  );
}
