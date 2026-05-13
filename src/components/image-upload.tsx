"use client";

import { useRef, useState } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  pathPrefix: string;
  aspect?: "square" | "video" | "wide";
  className?: string;
};

const aspectClasses = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[4/3]",
};

export function ImageUpload({
  value,
  onChange,
  pathPrefix,
  aspect = "wide",
  className,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, pathPrefix);
      onChange(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        aspectClasses[aspect],
        className,
      )}
      sx={{
        border: "1px dashed",
        borderColor: "divider",
        backgroundColor: "background.default",
      }}
    >
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Upload preview"
            className="h-full w-full object-cover"
          />
          <Box
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              display: "flex",
              gap: 1,
            }}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => ref.current?.click()}
              disabled={uploading}
              sx={
                uploading
                  ? {
                      pointerEvents: "none",
                      "&.Mui-disabled": {
                        backgroundColor: "secondary.main",
                        color: "secondary.contrastText",
                        opacity: 0.92,
                      },
                    }
                  : undefined
              }
              startIcon={
                uploading ? (
                  <CircularProgress size={14} sx={{ color: "inherit" }} />
                ) : (
                  <AddPhotoAlternateIcon sx={{ fontSize: 16 }} />
                )
              }
            >
              Replace
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={() => onChange(null)}
              disabled={uploading}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        </>
      ) : (
        <Box
          component="button"
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            height: "100%",
            width: "100%",
            border: 0,
            background: "transparent",
            color: "text.secondary",
            cursor: uploading ? "default" : "pointer",
            "&:hover": { color: "text.primary", backgroundColor: "action.hover" },
            transition: "all 0.15s",
          }}
        >
          {uploading ? (
            <CircularProgress size={28} />
          ) : (
            <AddPhotoAlternateIcon sx={{ fontSize: 32 }} />
          )}
          <Box component="span" sx={{ fontSize: 12, fontWeight: 500 }}>
            {uploading ? "Uploading..." : "Click to upload image"}
          </Box>
        </Box>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </Box>
  );
}
