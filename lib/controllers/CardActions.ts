'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { DRAW_INTERVAL_MS, getBuyPrice, getRarityValue } from "./CardController";
import { revalidatePath } from "next/cache";

// Helper function to draw a random card and add it to the user's collection
async function executeCardDraw(supabase: SupabaseClient, userId: string) {
  // Choose rarity: S: 5%, A: 15%, B: 30%, C: 50%
  const rand = Math.random();
  let chosenRarity: 'S' | 'A' | 'B' | 'C' = 'C';
  
  if (rand < 0.05) {
    chosenRarity = 'S';
  } else if (rand < 0.20) {
    chosenRarity = 'A';
  } else if (rand < 0.50) {
    chosenRarity = 'B';
  } else {
    chosenRarity = 'C';
  }

  // Fetch cats of chosen rarity
  const { data: initialCats, error: catsError } = await supabase
    .from('cats')
    .select('*')
    .eq('rarity', chosenRarity);

  if (catsError) {
    throw new Error("Erro ao buscar cartas");
  }

  let cats = initialCats;

  // Fallback if no cats of chosen rarity exist in the DB
  if (!cats || cats.length === 0) {
    const { data: fallbackCats, error: fallbackError } = await supabase
      .from('cats')
      .select('*');
    
    if (fallbackError || !fallbackCats || fallbackCats.length === 0) {
      throw new Error("Nenhuma carta cadastrada no banco de dados");
    }
    cats = fallbackCats;
  }

  // Draw random cat
  const randomCat = cats[Math.floor(Math.random() * cats.length)];

  // Update profiles_cats junction table
  const { data: existingCollection } = await supabase
    .from('profiles_cats')
    .select('*')
    .eq('profile_id', userId)
    .eq('cat_id', randomCat.id)
    .maybeSingle();

  if (existingCollection) {
    const { error: updateError } = await supabase
      .from('profiles_cats')
      .update({ quantity: existingCollection.quantity + 1 })
      .eq('profile_id', userId)
      .eq('cat_id', randomCat.id);
    
    if (updateError) {
      throw new Error("Erro ao atualizar a quantidade da carta na coleção");
    }
  } else {
    const { error: insertError } = await supabase
      .from('profiles_cats')
      .insert({
        profile_id: userId,
        cat_id: randomCat.id,
        quantity: 1,
      });

    if (insertError) {
      throw new Error("Erro ao adicionar a carta à coleção");
    }
  }

  return randomCat;
}

// Draw method (standard cooldown check)
export async function drawCard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Fetch profile to verify cooldown
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('next_draw, cards_drawn')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil não encontrado" };
  }

  const now = new Date();
  const nextDrawTime = new Date(profile.next_draw);
  if (now < nextDrawTime) {
    return { error: "O sorteio ainda não está disponível" };
  }

  try {
    const randomCat = await executeCardDraw(supabase, user.id);

    // Update profile cooldown and draw counter
    const nextDrawISO = new Date(Date.now() + DRAW_INTERVAL_MS).toISOString();
    
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        next_draw: nextDrawISO,
        cards_drawn: profile.cards_drawn + 1,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      return { error: "Erro ao atualizar o perfil de sorteio" };
    }

    return {
      success: true,
      card: randomCat,
      nextDraw: nextDrawISO,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Erro desconhecido ao sortear carta" };
  }
}

// Accelerate method (skip cooldown using 1 accelerate item)
export async function accelerateDraw() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Fetch profile to verify cooldown is active
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('next_draw, cards_drawn')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil não encontrado" };
  }

  const now = new Date();
  const nextDrawTime = new Date(profile.next_draw);
  if (now >= nextDrawTime) {
    return { error: "O sorteio já está disponível, não é necessário acelerar" };
  }

  // Find the skip/acelerar item
  const { data: skipItem, error: itemError } = await supabase
    .from('items')
    .select('id')
    .eq('type', 'skip')
    .single();

  if (itemError || !skipItem) {
    return { error: "Item de aceleração não cadastrado" };
  }

  // Check user balance of this item
  const { data: userItem, error: userItemError } = await supabase
    .from('profiles_items')
    .select('*')
    .eq('profile_id', user.id)
    .eq('item_id', skipItem.id)
    .maybeSingle();

  if (userItemError || !userItem || userItem.quantity < 1) {
    return { error: "Você não possui itens de aceleração suficientes" };
  }

  try {
    // Consume 1 skip item
    if (userItem.quantity === 1) {
      const { error: deleteError } = await supabase
        .from('profiles_items')
        .delete()
        .eq('profile_id', user.id)
        .eq('item_id', skipItem.id);
      
      if (deleteError) {
        return { error: "Erro ao consumir item de aceleração" };
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles_items')
        .update({ quantity: userItem.quantity - 1 })
        .eq('profile_id', user.id)
        .eq('item_id', skipItem.id);
      
      if (updateError) {
        return { error: "Erro ao consumir item de aceleração" };
      }
    }

    // Execute standard card draw
    const randomCat = await executeCardDraw(supabase, user.id);

    // Reset cooldown to now + 1 hour, and increment cards drawn
    const nextDrawISO = new Date(Date.now() + DRAW_INTERVAL_MS).toISOString();
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        next_draw: nextDrawISO,
        cards_drawn: profile.cards_drawn + 1,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      return { error: "Erro ao atualizar o perfil de sorteio" };
    }

    return {
      success: true,
      card: randomCat,
      nextDraw: nextDrawISO,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Erro desconhecido ao acelerar sorteio" };
  }
}

export async function buyCat(catId: number) {
  const supabase = await createSupabaseServerClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get cat details
  const { data: cat, error: catError } = await supabase
    .from('cats')
    .select('*')
    .eq('id', catId)
    .single();

  if (catError || !cat) {
    return { error: "Carta não encontrada" };
  }

  const price = await getBuyPrice(cat.rarity);

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

  // 4. Deduct money from profile
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money - price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar pagamento" };
  }

  // 5. Add cat to user inventory (profiles_cats)
  const { data: existingRecord } = await supabase
    .from('profiles_cats')
    .select('*')
    .eq('profile_id', user.id)
    .eq('cat_id', catId)
    .maybeSingle();

  if (existingRecord) {
    await supabase
      .from('profiles_cats')
      .update({ quantity: existingRecord.quantity + 1 })
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  } else {
    await supabase
      .from('profiles_cats')
      .insert({
        profile_id: user.id,
        cat_id: catId,
        quantity: 1
      });
  }

  revalidatePath("/home/loja");
  revalidatePath("/home/album");
  revalidatePath("/home");
  return { success: true, cat };
}

export async function sellCat(catId: number) {
  const supabase = await createSupabaseServerClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // 2. Get user's card record
  const { data: record, error: recordError } = await supabase
    .from('profiles_cats')
    .select('*, cat:cats(*)')
    .eq('profile_id', user.id)
    .eq('cat_id', catId)
    .maybeSingle();

  if (recordError || !record || record.quantity <= 0) {
    return { error: "Você não possui esta carta para vender" };
  }

  const price = await getRarityValue(record.cat.rarity);

  // 3. Get user profiles balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('money')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Perfil do usuário não encontrado" };
  }

  // 4. Update money in profile
  const { error: updateMoneyError } = await supabase
    .from('profiles')
    .update({ money: profile.money + price })
    .eq('id', user.id);

  if (updateMoneyError) {
    return { error: "Erro ao processar venda" };
  }

  // 5. Update profiles_cats quantity
  if (record.quantity > 1) {
    await supabase
      .from('profiles_cats')
      .update({ quantity: record.quantity - 1 })
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  } else {
    await supabase
      .from('profiles_cats')
      .delete()
      .eq('profile_id', user.id)
      .eq('cat_id', catId);
  }

  revalidatePath("/home/loja");
  revalidatePath("/home/album");
  revalidatePath("/home");
  return { success: true, price };
}

export async function getAllCats() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('cats')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching all cats:", error);
    return [];
  }
  return data;
}
