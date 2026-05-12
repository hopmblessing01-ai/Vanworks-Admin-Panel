import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { Button } from "@/components/ui/button";
import { NewVanModelEditor } from "./new-model-editor";

export const metadata = { title: "New Van Model — Vanworks" };

export default function NewVanModelPage() {
  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          component={Link}
          href="/van-models"
          variant="ghost"
          size="sm"
          startIcon={<KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />}
        >
          Van Models
        </Button>
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          New Van Model
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add the model info, then save to set up sales and build form specs.
        </Typography>
      </Box>

      <NewVanModelEditor />
    </Stack>
  );
}
