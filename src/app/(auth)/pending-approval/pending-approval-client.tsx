"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 5000;

export function PendingApprovalClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [approved, setApproved] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let cancelled = false;

    async function check() {
      const { data, error } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data?.approved) {
        setApproved(true);
        toast.success("You have been approved! Redirecting...");
        router.replace("/dashboard");
        router.refresh();
      }
    }

    check();

    const channel = supabase
      .channel(`profiles:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { approved?: boolean } | null;
          if (row?.approved) {
            setApproved(true);
            toast.success("You have been approved! Redirecting...");
            router.replace("/dashboard");
            router.refresh();
          }
        },
      )
      .subscribe();

    const interval = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  async function signOut() {
    await supabaseRef.current.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

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
            backgroundColor: approved
              ? "rgba(16, 185, 129, 0.16)"
              : "rgba(245, 158, 11, 0.16)",
          }}
        >
          {approved ? (
            <CheckCircleIcon sx={{ color: "#047857", fontSize: 24 }} />
          ) : (
            <AccessTimeIcon sx={{ color: "#b45309", fontSize: 24 }} />
          )}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {approved ? "You're approved!" : "Awaiting approval"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          {approved
            ? "Taking you to your dashboard..."
            : "Your account is confirmed. An administrator will review and approve your access shortly. This page will update automatically once you're approved — no need to refresh."}
        </Typography>
        <Box
          sx={{
            mt: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption">
            {approved ? "Redirecting..." : "Checking for approval..."}
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="outline"
          sx={{ mt: 3 }}
          onClick={signOut}
        >
          Sign out
        </Button>
      </Box>
    </Card>
  );
}
