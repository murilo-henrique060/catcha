'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function getUserItems(profileId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles_items')
    .select(`
      quantity,
      item:items (
        id,
        name,
        type,
        description,
        image_url,
        price
      )
    `)
    .eq('profile_id', profileId);

  if (error) {
    console.error("Error fetching user items:", error);
    return [];
  }

  return data;
}
