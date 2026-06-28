import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export const DRAW_INTERVAL_HOURS = 1;
export const DRAW_INTERVAL_MS = DRAW_INTERVAL_HOURS * 60 * 60 * 1000;

export const RARITY_CHANCES = {
  S: 0.05,
  A: 0.15,
  B: 0.30,
  C: 0.50,
};

export async function getCardsCountPerRarity() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('cats')
    .select('rarity');

  if (error) {
    console.error("Error fetching cards count per rarity:", error);
    return { S: 0, A: 0, B: 0, C: 0 };
  }

  const counts = { S: 0, A: 0, B: 0, C: 0 };
  data.forEach((cat: { rarity: string }) => {
    if (cat.rarity in counts) {
      counts[cat.rarity as 'S' | 'A' | 'B' | 'C']++;
    }
  });

  return counts;
}





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
