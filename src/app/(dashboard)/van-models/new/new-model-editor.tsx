"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { NewModelForm } from "./new-model-form";

export function NewVanModelEditor() {
  return (
    <Stack spacing={2}>
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="sales">Sales Form</TabsTrigger>
          <TabsTrigger value="build">Build Form</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <NewModelForm />
        </TabsContent>

        <TabsContent value="sales">
          <LockedFormPlaceholder label="sales form specs" />
        </TabsContent>

        <TabsContent value="build">
          <LockedFormPlaceholder label="build form specs" />
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

function LockedFormPlaceholder({ label }: { label: string }) {
  return (
    <Card>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 1,
          py: 8,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "action.hover",
            color: "text.secondary",
            mb: 1,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Save the model info first
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          Add a name and image in the Info tab, then click{" "}
          <strong>Save info</strong> to create the model. After that you can
          start adding {label} here.
        </Typography>
      </Box>
    </Card>
  );
}
