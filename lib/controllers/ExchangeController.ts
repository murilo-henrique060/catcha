'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

/**
 * Busca a troca ativa atual do usuário (seja como remetente ou destinatário).
 * Verifica as trocas que estão com o status 'pending' ou 'countered'.
 * Útil para garantir a regra de negócio de apenas uma troca ativa por vez.
 *
 * @param profileId - O UUID do perfil do usuário a ser verificado.
 * @returns Os dados da troca se existir, ou null caso contrário.
 */
export async function getCurrentExchange(profileId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .in('status', ['pending', 'countered'])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching current exchange:", error);
    return null;
  }

  return data;
}
