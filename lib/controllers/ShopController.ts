'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Compra itens de aceleração na loja (consumíveis que pulam o tempo de sorteio).
 * Deduz o saldo de moedas do usuário e adiciona a quantidade especificada ao inventário.
 *
 * @param quantity - Quantidade de itens de aceleração a serem comprados (padrão é 1).
 * @returns Um objeto indicando o sucesso da transação ou um erro em caso de saldo insuficiente, etc.
 */
export async function buyAccelerationItem(quantity: number = 1) {
  if (quantity < 1) {
    return { error: "Quantidade inválida" };
  }
  const supabase = await createSupabaseServerClient();

  // 1. Obter o usuário autenticado atual
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Buscar detalhes do item de "skip" (aceleração) no banco de dados
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('type', 'skip')
    .maybeSingle();

  let finalItem = item;
  if (itemError || !item) {
    const { data: itemByName } = await supabase
      .from('items')
      .select('*')
      .eq('name', 'Acelerar')
      .maybeSingle();
    finalItem = itemByName;
  }

  if (!finalItem) {
    return { error: "Item de aceleração não cadastrado" };
  }

  const price = finalItem.price * quantity;

  // 3. Obter saldo de moedas do perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('money')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil do usuário não encontrado" };
  }

  if (profile.money < price) {
    return { error: "Moedas insuficientes" };
  }

  // 4. Deduzir o valor em moedas
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money - price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar pagamento" };
  }

  // 5. Adicionar a compra na tabela profiles_items
  const { data: existingRecord } = await supabase
    .from('profiles_items')
    .select('*')
    .eq('profile_id', user.id)
    .eq('item_id', finalItem.id)
    .maybeSingle();

  if (existingRecord) {
    await supabase
      .from('profiles_items')
      .update({ quantity: existingRecord.quantity + quantity })
      .eq('profile_id', user.id)
      .eq('item_id', finalItem.id);
  } else {
    await supabase
      .from('profiles_items')
      .insert({
        profile_id: user.id,
        item_id: finalItem.id,
        quantity: quantity
      });
  }

  revalidatePath("/home/shop");
  revalidatePath("/home");
  return { success: true, item: finalItem };
}
