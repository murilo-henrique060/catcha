import { createSupabaseServerClient } from "@/lib/services/supabase/server";

/**
 * Intervalo padrão entre sorteios gratuitos em horas.
 */
export const DRAW_INTERVAL_HOURS = 1;

/**
 * Intervalo padrão entre sorteios em milissegundos.
 */
export const DRAW_INTERVAL_MS = DRAW_INTERVAL_HOURS * 60 * 60 * 1000;

/**
 * As chances baseadas nas raridades do jogo para sorteios.
 */
export const RARITY_CHANCES = {
  S: 0.05,
  A: 0.15,
  B: 0.30,
  C: 0.50,
};

/**
 * Retorna o valor de venda em moedas de uma carta baseado em sua raridade.
 *
 * @param rarity - A raridade da carta (S, A, B ou C).
 * @returns O valor em moedas da carta.
 */
export async function getRarityValue(rarity: string): Promise<number> {
  switch (rarity) {
    case 'S': return 1000;
    case 'A': return 500;
    case 'B': return 200;
    default: return 100;
  }
}

/**
 * Retorna o preço de compra de uma carta baseada em sua raridade.
 * (Atualmente equivale ao valor de venda).
 *
 * @param rarity - A raridade da carta.
 * @returns O preço de compra em moedas.
 */
export async function getBuyPrice(rarity: string): Promise<number> {
  return getRarityValue(rarity); // S = 1000, A = 500, B = 200, C = 100
}

/**
 * Retorna uma contagem de todas as cartas existentes no banco de dados,
 * agrupadas pelas suas respectivas raridades. Utilizado para estatísticas e interface do usuário.
 *
 * @returns Um objeto mapeando a raridade (S, A, B, C) para o total existente.
 */
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

/**
 * Busca todas as cartas que um determinado usuário possui (o seu álbum).
 * Traz as propriedades da carta, a quantidade que o usuário possui e o caminho da imagem.
 *
 * @param profileId - O UUID do usuário.
 * @returns Uma lista de objetos contendo quantidade e a própria carta.
 */
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
