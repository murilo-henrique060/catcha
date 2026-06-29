'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { getUserProfile } from "./UserController";
import { revalidatePath } from "next/cache";

export async function createTradeOffer(friendId: string, catId: number) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();

  if (!user || !user.profile) return { error: "Não autenticado." };
  const senderId = user.profile.id;

  if (senderId === friendId) return { error: "Não pode trocar consigo mesmo." };

  // 1. Verify friendship
  const { data: friendship, error: friendError } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${senderId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (friendError || !friendship) return { error: "Só é possível trocar com amigos." };

  // 1.5 Verify active trade limits (max 1 per user)
  const { count: senderActiveTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
    .in('status', ['pending', 'countered']);

  if (senderActiveTrades && senderActiveTrades > 0) return { error: "Você já possui uma troca em andamento." };

  const { count: receiverActiveTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
    .in('status', ['pending', 'countered']);

  if (receiverActiveTrades && receiverActiveTrades > 0) return { error: "Este amigo já possui uma troca em andamento." };

  // 2. Verify and deduct card
  const { data: senderCard } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', senderId)
    .eq('cat_id', catId)
    .maybeSingle();

  if (!senderCard || senderCard.quantity < 1) return { error: "Você não possui esta carta." };

  let deductError = null;
  let affectedRows = 0;
  if (senderCard.quantity === 1) {
    const { data, error } = await supabase.from('profiles_cats').delete().eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  } else {
    const { data, error } = await supabase.from('profiles_cats').update({ quantity: senderCard.quantity - 1 }).eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  }

  if (deductError) {
    console.error("Error deducting card in trade offer:", deductError);
    return { error: "Erro ao deduzir a carta para a troca: " + deductError.message };
  }
  if (affectedRows === 0) {
    console.error("0 rows updated during trade deduction. RLS or not found.");
    return { error: "Erro: Nenhuma carta foi deduzida (possível bloqueio de permissão)." };
  }

  // 3. Create pending trade
  const { error } = await supabase.from('trades').insert({
    sender_id: senderId,
    receiver_id: friendId,
    sender_cat_id: catId,
    status: 'pending'
  });

  if (error) {
    // refund on error
    await refundCard(senderId, catId);
    return { error: "Erro ao criar oferta de troca." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

export async function counterTradeOffer(tradeId: string, counterCatId: number) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };
  
  const receiverId = user.profile.id;

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*, sender_cat:cats!sender_cat_id(rarity)')
    .eq('id', tradeId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada ou já respondida." };

  // 2. Verify counter card and rarity
  const { data: counterCat } = await supabase.from('cats').select('rarity').eq('id', counterCatId).maybeSingle();
  if (!counterCat) return { error: "Carta inválida." };

  // @ts-ignore
  if (trade.sender_cat.rarity !== counterCat.rarity) {
    return { error: "A carta oferecida deve ser da mesma raridade." };
  }

  // 3. Deduct receiver card
  const { data: receiverCard } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', receiverId)
    .eq('cat_id', counterCatId)
    .maybeSingle();

  if (!receiverCard || receiverCard.quantity < 1) return { error: "Você não possui esta carta." };

  let deductError = null;
  let affectedRows = 0;
  if (receiverCard.quantity === 1) {
    const { data, error } = await supabase.from('profiles_cats').delete().eq('profile_id', receiverId).eq('cat_id', counterCatId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  } else {
    const { data, error } = await supabase.from('profiles_cats').update({ quantity: receiverCard.quantity - 1 }).eq('profile_id', receiverId).eq('cat_id', counterCatId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  }

  if (deductError) {
    console.error("Error deducting card in counter offer:", deductError);
    return { error: "Erro ao deduzir a carta para a contra-proposta: " + deductError.message };
  }
  if (affectedRows === 0) {
    console.error("0 rows updated during counter offer deduction. RLS or not found.");
    return { error: "Erro: Nenhuma carta foi deduzida (possível bloqueio de permissão)." };
  }

  // 4. Update trade
  const { error } = await supabase.from('trades').update({
    receiver_cat_id: counterCatId,
    status: 'countered',
    updated_at: new Date().toISOString()
  }).eq('id', tradeId);

  if (error) {
    await refundCard(receiverId, counterCatId);
    return { error: "Erro ao responder troca." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

export async function acceptTrade(tradeId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .eq('sender_id', user.profile.id)
    .eq('status', 'countered')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada." };

  // 2. Transfer cards permanently
  // sender gets receiver_cat_id
  await refundCard(trade.sender_id, trade.receiver_cat_id!);
  // receiver gets sender_cat_id
  await refundCard(trade.receiver_id, trade.sender_cat_id);

  // 3. Update status
  await supabase.from('trades').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

export async function rejectTrade(tradeId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .or(`sender_id.eq.${user.profile.id},receiver_id.eq.${user.profile.id}`)
    .in('status', ['pending', 'countered'])
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada." };

  // 2. Refund cards
  await refundCard(trade.sender_id, trade.sender_cat_id);
  if (trade.receiver_cat_id) {
    await refundCard(trade.receiver_id, trade.receiver_cat_id);
  }

  // 3. Update status
  await supabase.from('trades').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

export async function cancelTrade(tradeId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();
  if (!user || !user.profile) return { error: "Não autenticado." };

  // 1. Fetch trade
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .eq('sender_id', user.profile.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (!trade) return { error: "Troca não encontrada ou já respondida." };

  // 2. Refund sender card
  await refundCard(trade.sender_id, trade.sender_cat_id);

  // 3. Update status
  await supabase.from('trades').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', tradeId);

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

export async function getActiveTrades(profileId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data: incoming } = await supabase
    .from('trades')
    .select('*, sender:profiles!sender_id(username), sender_cat:cats!sender_cat_id(*), receiver_cat:cats!receiver_cat_id(*)')
    .eq('receiver_id', profileId)
    .in('status', ['pending', 'countered'])
    .order('created_at', { ascending: false });

  const { data: outgoing } = await supabase
    .from('trades')
    .select('*, receiver:profiles!receiver_id(username), sender_cat:cats!sender_cat_id(*), receiver_cat:cats!receiver_cat_id(*)')
    .eq('sender_id', profileId)
    .in('status', ['pending', 'countered'])
    .order('created_at', { ascending: false });

  return { incoming: incoming || [], outgoing: outgoing || [] };
}

// Helper
async function refundCard(profileId: string, catId: number) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('profiles_cats').select('quantity').eq('profile_id', profileId).eq('cat_id', catId).maybeSingle();
  if (data) {
    await supabase.from('profiles_cats').update({ quantity: data.quantity + 1 }).eq('profile_id', profileId).eq('cat_id', catId);
  } else {
    await supabase.from('profiles_cats').insert({ profile_id: profileId, cat_id: catId, quantity: 1 });
  }
}
