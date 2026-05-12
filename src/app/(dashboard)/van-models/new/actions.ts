"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateVanModelInput = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
};

export async function createVanModel(input: CreateVanModelInput): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("van_models")
    .insert({
      id: input.id,
      name: input.name,
      price: input.price,
      image_url: input.image_url,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create model." };
  }

  // Drop the cached /van-models RSC payload so the new model shows up
  // immediately when the user navigates back to the list.
  revalidatePath("/van-models");
  revalidatePath(`/van-models/${data.id}`);

  return { ok: true, id: data.id };
}
