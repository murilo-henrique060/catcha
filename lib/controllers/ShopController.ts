'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function buyAccelerationItem() {
  const supabase = await createSupabaseServerClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get skip item details from database
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

  const price = finalItem.price;

  // 3. Get user profiles balance
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

  // 4. Deduct money
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money - price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar pagamento" };
  }

  // 5. Add to profiles_items
  const { data: existingRecord } = await supabase
    .from('profiles_items')
    .select('*')
    .eq('profile_id', user.id)
    .eq('item_id', finalItem.id)
    .maybeSingle();

  if (existingRecord) {
    await supabase
      .from('profiles_items')
      .update({ quantity: existingRecord.quantity + 1 })
      .eq('profile_id', user.id)
      .eq('item_id', finalItem.id);
  } else {
    await supabase
      .from('profiles_items')
      .insert({
        profile_id: user.id,
        item_id: finalItem.id,
        quantity: 1
      });
  }

  revalidatePath("/home/shop");
  revalidatePath("/home");
  return { success: true, item: finalItem };
}
