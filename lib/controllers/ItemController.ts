'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

/**
 * Busca o inventário de itens de um usuário específico.
 * Retorna a quantidade possuída de cada item e os detalhes do item (nome, descrição, preço).
 *
 * @param profileId - O UUID do perfil do usuário para buscar os itens.
 * @returns Um array contendo os dados dos itens (quantidade e detalhes do item), ou um array vazio em caso de erro.
 */
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
