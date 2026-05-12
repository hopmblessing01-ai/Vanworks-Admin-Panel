"use client";

import { createClient } from "@/lib/supabase/client";
import { SUPABASE_BUCKET } from "@/lib/constants";

export async function uploadImage(
  file: File,
  pathPrefix: string,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${pathPrefix}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
