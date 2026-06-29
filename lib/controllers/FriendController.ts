'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Envia uma solicitação de amizade para outro usuário.
 * Verifica se já existe uma amizade (ou solicitação pendente) antes de enviar.
 *
 * @param receiverId - O UUID do usuário que receberá o pedido.
 * @returns Objeto de sucesso ou erro (ex: se já forem amigos).
 */
export async function sendFriendRequest(receiverId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  if (user.id === receiverId) {
    return { error: "Você não pode enviar convite para si mesmo" };
  }

  // Check if a relationship already exists in either direction
  const { data: existing, error: queryError } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (queryError) {
    return { error: "Erro ao verificar solicitações existentes" };
  }

  if (existing) {
    if (existing.status === 'accepted') {
      return { error: "Vocês já são amigos" };
    }
    return { error: "Solicitação de amizade já pendente ou enviada" };
  }

  const { error: insertError } = await supabase
    .from('friendships')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    });

  if (insertError) {
    return { error: "Erro ao enviar solicitação de amizade" };
  }

  revalidatePath("/home/public");
  revalidatePath("/home/friends");
  return { success: true };
}

/**
 * Aceita uma solicitação de amizade que foi enviada para o usuário autenticado.
 *
 * @param senderId - O UUID do usuário que enviou o pedido originalmente.
 * @returns Objeto indicando sucesso ou a mensagem de erro.
 */
export async function acceptFriendRequest(senderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('sender_id', senderId)
    .eq('receiver_id', user.id);

  if (updateError) {
    return { error: "Erro ao aceitar solicitação" };
  }

  revalidatePath("/home/friends");
  revalidatePath("/home/public");
  return { success: true };
}

/**
 * Recusa (exclui) uma solicitação de amizade pendente enviada para o usuário autenticado,
 * ou remove um amigo existente da lista.
 *
 * @param senderId - O UUID do usuário que enviou o pedido ou do amigo a ser removido.
 * @returns Objeto indicando sucesso ou a mensagem de erro.
 */
export async function declineFriendRequest(senderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Delete the pending invitation record
  const { error: deleteError } = await supabase
    .from('friendships')
    .delete()
    .eq('sender_id', senderId)
    .eq('receiver_id', user.id);

  if (deleteError) {
    return { error: "Erro ao recusar solicitação" };
  }

  revalidatePath("/home/friends");
  revalidatePath("/home/public");
  return { success: true };
}

/**
 * Busca a lista completa de conexões do usuário atual, divididas em:
 * amigos confirmados, solicitações recebidas (pendentes) e solicitações enviadas.
 *
 * @returns Um objeto com 3 arrays: `friends`, `incomingRequests` e `outgoingRequests`.
 */
export async function getFriendships() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return [];
  }

  // Query friendships where user is sender OR receiver
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      sender_id,
      receiver_id,
      status,
      sender:sender_id(id, username),
      receiver:receiver_id(id, username)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error || !data) {
    console.error("Error fetching friendships:", error);
    return [];
  }

  interface ProfileStub {
    id: string;
    username: string;
  }

  interface FriendshipRow {
    sender_id: string;
    receiver_id: string;
    status: string;
    sender: ProfileStub | ProfileStub[] | null;
    receiver: ProfileStub | ProfileStub[] | null;
  }

  // Map to a clean list representing invitations and active friends
  return (data as unknown as FriendshipRow[]).map((row) => {
    const isSender = row.sender_id === user.id;
    const senderProfile = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    const receiverProfile = Array.isArray(row.receiver) ? row.receiver[0] : row.receiver;
    const friendProfile = isSender ? receiverProfile : senderProfile;
    
    if (!friendProfile) return null;

    return {
      friendId: friendProfile.id,
      username: friendProfile.username,
      status: row.status,
      isOutgoing: isSender // True if the logged-in user sent it, False if received
    };
  }).filter((f): f is Exclude<typeof f, null> => f !== null);
}

/**
 * Busca uma lista de todos os usuários (jogadores públicos) cadastrados no jogo.
 * Retorna as informações públicas como username, foto e as cartas que cada um possui.
 *
 * @returns Um array contendo os dados dos jogadores e seus álbuns.
 */
export async function getPublicPlayers() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return [];
  }

  // 1. Fetch all profiles except current user
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .neq('id', user.id);

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  // 2. Fetch friendships for current user to map state
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  // Map relationships by player ID
  interface FriendshipItem {
    sender_id: string;
    receiver_id: string;
    status: string;
  }

  const relationshipMap = new Map<string, { status: string; isOutgoing: boolean }>();
  if (friendships) {
    (friendships as unknown as FriendshipItem[]).forEach((f) => {
      const isSender = f.sender_id === user.id;
      const otherId = isSender ? f.receiver_id : f.sender_id;
      relationshipMap.set(otherId, { status: f.status, isOutgoing: isSender });
    });
  }

  // 3. For each profile, fetch their count of unique cats owned
  const { data: catCounts } = await supabase
    .from('profiles_cats')
    .select('profile_id, cat_id');

  interface ProfileCatItem {
    profile_id: string;
    cat_id: number;
  }

  const countMap = new Map<string, number>();
  if (catCounts) {
    (catCounts as unknown as ProfileCatItem[]).forEach((c) => {
      countMap.set(c.profile_id, (countMap.get(c.profile_id) || 0) + 1);
    });
  }

  interface ProfileItem {
    id: string;
    username: string;
  }

  return (profiles as unknown as ProfileItem[]).map((p) => {
    const relationship = relationshipMap.get(p.id);
    return {
      id: p.id,
      username: p.username,
      uniqueCards: countMap.get(p.id) || 0,
      friendshipStatus: relationship ? relationship.status : 'none',
      isOutgoingRequest: relationship ? relationship.isOutgoing : false
    };
  });
}
