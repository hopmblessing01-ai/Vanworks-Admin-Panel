import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SignupForm } from "./signup-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Sign up — Vanworks" };

export default function SignupPage() {
  return (
    <Card sx={{ boxShadow: 6 }}>
      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get started with Vanworks. Your account will be reviewed by an
            administrator.
          </Typography>
        </Box>

        <SignupForm />

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--mui-palette-primary-main)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Card>
  );
}
