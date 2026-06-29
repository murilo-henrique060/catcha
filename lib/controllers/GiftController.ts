'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { getUserProfile } from "./UserController";
import { revalidatePath } from "next/cache";

// 5 hours in milliseconds
const GIFT_COOLDOWN_MS = 5 * 60 * 60 * 1000;
const MAX_GIFTS_PER_DAY = 5;

/**
 * Envia uma carta como presente para um amigo.
 * Aplica validações de cooldown (espera de 5h por amigo) e limite diário (máx 5 presentes recebidos/dia).
 * A carta é deduzida do inventário do remetente e o presente fica como 'pending' (pendente)
 * até o destinatário resgatar.
 *
 * @param friendId - UUID do amigo recebendo o presente.
 * @param catId - O ID da carta sendo enviada.
 * @returns Objeto com sucesso ou erro caso viole alguma regra.
 */
export async function sendGift(friendId: string, catId: number) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();

  if (!user || !user.profile) {
    return { error: "Não autenticado." };
  }

  const senderId = user.profile.id;

  if (senderId === friendId) {
    return { error: "Você não pode enviar um presente para si mesmo." };
  }

  // 1. Verify friendship is accepted
  const { data: friendship, error: friendError } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${senderId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (friendError || !friendship) {
    return { error: "Você só pode enviar presentes para amigos." };
  }

  // 2. Check 5-hour cooldown for the same player
  const { data: lastGift } = await supabase
    .from('gifts')
    .select('created_at')
    .eq('sender_id', senderId)
    .eq('receiver_id', friendId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastGift) {
    const lastGiftTime = new Date(lastGift.created_at).getTime();
    if (Date.now() - lastGiftTime < GIFT_COOLDOWN_MS) {
      return { error: "Você só pode enviar um presente para este amigo a cada 5 horas." };
    }
  }

  // 3. Check receiver's 5 gifts/day limit
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const { count: receivedGiftsCount } = await supabase
    .from('gifts')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', friendId)
    .gte('created_at', today.toISOString());

  if (receivedGiftsCount !== null && receivedGiftsCount >= MAX_GIFTS_PER_DAY) {
    return { error: "Este amigo já recebeu o limite máximo de 5 presentes hoje." };
  }

  // 4. Verify sender owns the card
  const { data: senderCard, error: cardError } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', senderId)
    .eq('cat_id', catId)
    .maybeSingle();

  if (cardError || !senderCard || senderCard.quantity < 1) {
    return { error: "Você não possui esta carta para enviar." };
  }

  // 5. Deduct card from sender
  const newSenderQuantity = senderCard.quantity - 1;
  let deductError = null;
  let affectedRows = 0;
  if (newSenderQuantity === 0) {
    const { data, error } = await supabase.from('profiles_cats').delete().eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  } else {
    const { data, error } = await supabase.from('profiles_cats').update({ quantity: newSenderQuantity }).eq('profile_id', senderId).eq('cat_id', catId).select();
    deductError = error;
    if (data) affectedRows = data.length;
  }

  if (deductError) {
    console.error("Error deducting card from sender:", deductError);
    return { error: "Erro ao deduzir a carta do seu inventário: " + deductError.message };
  }
  if (affectedRows === 0) {
    console.error("0 rows updated during deduction. RLS or not found.");
    return { error: "Erro: Nenhuma carta foi deduzida (possível bloqueio de permissão)." };
  }

  // 6. Log the gift as pending (it will NOT be added to receiver's inventory yet)
  const { error: insertError } = await supabase.from('gifts').insert({
    sender_id: senderId,
    receiver_id: friendId,
    cat_id: catId,
    status: 'pending'
  });

  if (insertError) {
    console.error("Error logging gift:", insertError);
    // Refund the sender
    const { data: senderCardRefund } = await supabase.from('profiles_cats').select('quantity').eq('profile_id', senderId).eq('cat_id', catId).maybeSingle();
    if (senderCardRefund) {
      await supabase.from('profiles_cats').update({ quantity: senderCardRefund.quantity + 1 }).eq('profile_id', senderId).eq('cat_id', catId);
    } else {
      await supabase.from('profiles_cats').insert({ profile_id: senderId, cat_id: catId, quantity: 1 });
    }
    return { error: "Erro ao registrar o presente." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Resgata um presente pendente que foi enviado ao usuário atual.
 * A carta é adicionada ao inventário do destinatário e o status do presente muda para 'received' (recebido).
 *
 * @param giftId - UUID do registro do presente.
 * @returns Objeto com sucesso ou erro caso o presente não seja encontrado/válido.
 */
export async function receiveGift(giftId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserProfile();

  if (!user || !user.profile) {
    return { error: "Não autenticado." };
  }

  const receiverId = user.profile.id;

  // 1. Fetch gift and check if it's pending and belongs to current user
  const { data: gift, error: fetchError } = await supabase
    .from('gifts')
    .select('*')
    .eq('id', giftId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError || !gift) {
    return { error: "Presente não encontrado ou já recebido." };
  }

  // 2. Add card to receiver's inventory
  const { data: receiverCard } = await supabase
    .from('profiles_cats')
    .select('quantity')
    .eq('profile_id', receiverId)
    .eq('cat_id', gift.cat_id)
    .maybeSingle();

  if (receiverCard) {
    await supabase.from('profiles_cats').update({ quantity: receiverCard.quantity + 1 }).eq('profile_id', receiverId).eq('cat_id', gift.cat_id);
  } else {
    await supabase.from('profiles_cats').insert({ profile_id: receiverId, cat_id: gift.cat_id, quantity: 1 });
  }

  // 3. Mark gift as received
  const { error: updateError } = await supabase
    .from('gifts')
    .update({ status: 'received' })
    .eq('id', giftId);

  if (updateError) {
    console.error("Error updating gift status:", updateError);
    return { error: "Erro ao atualizar o status do presente." };
  }

  revalidatePath("/home/album");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Busca o histórico de presentes enviados e recebidos por um determinado usuário.
 * 
 * @param profileId - O UUID do usuário para o qual consultar o histórico.
 * @returns Um objeto agrupando os presentes de chegada (`incoming`) e de saída (`outgoing`).
 */
export async function getGiftsHistory(profileId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Received gifts
  const { data: incomingGifts } = await supabase
    .from('gifts')
    .select('*, sender:profiles!sender_id(username), cat:cats(*)')
    .eq('receiver_id', profileId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Sent gifts
  const { data: outgoingGifts } = await supabase
    .from('gifts')
    .select('*, receiver:profiles!receiver_id(username), cat:cats(*)')
    .eq('sender_id', profileId)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    incoming: incomingGifts || [],
    outgoing: outgoingGifts || []
  };
}
