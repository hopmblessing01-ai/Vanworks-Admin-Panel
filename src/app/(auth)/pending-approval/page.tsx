import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pending approval — Vanworks" };

export default function PendingApprovalPage() {
  return (
    <Card sx={{ boxShadow: 6 }}>
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
            backgroundColor: "rgba(245, 158, 11, 0.16)",
          }}
        >
          <AccessTimeIcon sx={{ color: "#b45309", fontSize: 24 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Awaiting approval
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Your account is confirmed. An administrator will review and approve
          your access shortly. You&apos;ll be able to sign in once you&apos;re
          approved.
        </Typography>
        <Button
          component={Link}
          href="/login"
          fullWidth
          sx={{ mt: 3 }}
        >
          Back to sign in
        </Button>
      </Box>
    </Card>
  );
}
