import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ResetPasswordForm } from "./reset-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Set new password — Vanworks" };

export default function ResetPasswordPage() {
  return (
    <Card sx={{ boxShadow: 6 }}>
      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Set a new password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a strong password you haven&apos;t used before.
          </Typography>
        </Box>
        <ResetPasswordForm />
      </Box>
    </Card>
  );
}
