import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export const DRAW_INTERVAL_HOURS = 1;
export const DRAW_INTERVAL_MS = DRAW_INTERVAL_HOURS * 60 * 60 * 1000;

export const RARITY_CHANCES = {
  S: 0.05,
  A: 0.15,
  B: 0.30,
  C: 0.50,
};

// Rarity values (Sell prices)
export async function getRarityValue(rarity: string): Promise<number> {
  switch (rarity) {
    case 'S': return 1000;
    case 'A': return 500;
    case 'B': return 200;
    default: return 100;
  }
}

// Buy price
export async function getBuyPrice(rarity: string): Promise<number> {
  return getRarityValue(rarity); // S = 1000, A = 500, B = 200, C = 100
}

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

  if (error || !data) {
    console.error("Error fetching user cards (cats):", error);
    return [];
  }

  return data.map((row) => ({
    quantity: row.quantity,
    cat: Array.isArray(row.cat) ? row.cat[0] : (row.cat as unknown as { id: number; name: string; rarity: string; image_path: string }),
  })).filter(row => row.cat !== null && row.cat !== undefined);
}
