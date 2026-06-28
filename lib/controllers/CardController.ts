'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function getUserCards(profileId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('profiles_cats')
    .select(`
      quantity,
      cat:cats (
        id,
        name,
        rarity,
        image_path
      )
    `)
    .eq('profile_id', profileId);

  if (error) {
    console.error("Error fetching user cards (cats):", error);
    return [];
  }

  return data;
}
