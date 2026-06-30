'use server';

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { getUserCards } from "./CardController";
import { getUserItems } from "./ItemController";
import { getCurrentExchange } from "./ExchangeController";

/**
 * Busca apenas os detalhes essenciais do perfil de um usuário (ou do usuário autenticado se `userId` não for fornecido).
 * Usado na renderização inicial do layout e rotas para evitar lentidão (Time to First Byte alto) 
 * causada por buscar todo o inventário/notificações quando não são necessários.
 * Esta função utiliza o `cache` do React para evitar chamadas redundantes.
 *
 * @param userId - (Opcional) O UUID do perfil a buscar.
 * @returns Os dados básicos do perfil e o e-mail (se autorizado) ou `null` em caso de falha.
 */
export const getBasicProfile = cache(async (userId?: string) => {
  const supabase = await createSupabaseServerClient();

  let targetUserId = userId;
  let email: string | undefined;

  if (!targetUserId) {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data?.user) {
      if (authError && authError.name !== 'AuthSessionMissingError') {
        console.error("Error getting authenticated user:", authError);
      }
      return null;
    }
    targetUserId = data.user.id;
    email = data.user.email;
  } else {
    const { data } = await supabase.auth.getUser();
    if (data?.user && data.user.id === targetUserId) {
      email = data.user.email;
    }
  }

  const { data: fetchedProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching basic user profile:", profileError);
    return null;
  }

  let profile = fetchedProfile;

  if (!profile && !userId) {
    const shortId = targetUserId.substring(0, 8);
    const defaultUsername = `user_${shortId}`;
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: targetUserId,
        username: defaultUsername,
        money: 100,
      })
      .select()
      .maybeSingle();

    if (insertError || !newProfile) {
      console.error("Failed to auto-create missing profile:", insertError);
      return null;
    }
    profile = newProfile;
  } else if (!profile) {
    return null;
  }

  return {
    profile,
    email: email || null,
  };
});

/**
 * Busca os detalhes do perfil de um usuário (ou do usuário autenticado se `userId` não for fornecido).
 * Além das informações básicas, esta função calcula estatísticas agregadas (como quantidade de amigos, 
 * presentes recebidos pendentes, e trocas pendentes) para exibir notificações na interface.
 * Esta função utiliza o `cache` do React para deduzir chamadas duplicadas no mesmo ciclo de renderização.
 *
 * @param userId - (Opcional) O UUID do perfil a buscar.
 * @returns Os dados completos do perfil com agregações ou `null` em caso de falha.
 */
export const getUserProfile = cache(async (userId?: string) => {
  const supabase = await createSupabaseServerClient();

  let targetUserId = userId;
  let email: string | undefined;

  // If no userId is provided, get the currently authenticated user
  if (!targetUserId) {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data?.user) {
      // Avoid printing a console error trace for normal guest redirect states
      if (authError && authError.name !== 'AuthSessionMissingError') {
        console.error("Error getting authenticated user:", authError);
      }
      return null;
    }
    targetUserId = data.user.id;
    email = data.user.email;
  } else {
    // Check if the target user is the currently logged in user to safely get the email
    const { data } = await supabase.auth.getUser();
    if (data?.user && data.user.id === targetUserId) {
      email = data.user.email;
    }
  }

  // Fetch profile from public.profiles
  const { data: fetchedProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  let profile = fetchedProfile;

  // Self-healing: if the authenticated user is missing their profiles table entry, create one
  if (!profile && !userId) {
    const shortId = targetUserId.substring(0, 8);
    const defaultUsername = `user_${shortId}`;
    
    console.log(`Self-healing: Profile missing for user ${targetUserId}. Auto-creating profile with username ${defaultUsername}...`);

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: targetUserId,
        username: defaultUsername,
        money: 100, // default starting money
      })
      .select()
      .maybeSingle();

    if (insertError || !newProfile) {
      console.error("Self-healing: Failed to auto-create missing profile:", insertError);
      return null;
    }
    profile = newProfile;
  } else if (!profile) {
    // If querying another player's profile who doesn't exist
    return null;
  }

  // Fetch items, cards, and current exchange in parallel
  const [
    items, 
    cards, 
    currentExchange,
    friendRequestsRes,
    incomingPendingTradesRes,
    outgoingCounteredTradesRes,
    pendingGiftsRes
  ] = await Promise.all([
    getUserItems(targetUserId),
    getUserCards(targetUserId),
    getCurrentExchange(targetUserId),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('receiver_id', targetUserId).eq('status', 'pending'),
    supabase.from('trades').select('*', { count: 'exact', head: true }).eq('receiver_id', targetUserId).eq('status', 'pending'),
    supabase.from('trades').select('*', { count: 'exact', head: true }).eq('sender_id', targetUserId).eq('status', 'countered'),
    supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('receiver_id', targetUserId).eq('status', 'pending'),
  ]);

  const pendingFriendRequests = friendRequestsRes.count || 0;
  const activeTradesCount = (incomingPendingTradesRes.count || 0) + (outgoingCounteredTradesRes.count || 0);
  const pendingGiftsCount = pendingGiftsRes.count || 0;
  const totalNotifications = pendingFriendRequests + activeTradesCount + pendingGiftsCount;

  return {
    profile,
    email: email || null,
    items,
    cards,
    currentExchange,
    notifications: {
      pendingFriendRequests,
      activeTradesCount,
      pendingGiftsCount,
      total: totalNotifications,
    }
  };
});

/**
 * Verifica no banco de dados se um determinado nome de usuário já está sendo utilizado por outro perfil.
 *
 * @param username - O nome de usuário a ser verificado.
 * @returns Verdadeiro (true) se o nome estiver disponível, Falso (false) se já existir ou houver erro.
 */
export async function checkUsernameExists(username: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('profiles')
    .select('username', { count: 'exact', head: true })
    .eq('username', username);

  if (error) {
    console.error("Error checking username:", error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Atualiza o nome de usuário (username) do perfil do usuário autenticado.
 * 
 * @param newUsername - O novo nome de usuário a ser salvo.
 * @returns Objeto contendo erros em caso de falha de validação/duplicação ou sucesso.
 */
export async function updateUsername(newUsername: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    return { error: "Usuário não autenticado" };
  }

  const user = data.user;
  const trimmed = newUsername.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { error: "O nome de usuário deve ter entre 3 e 20 caracteres" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { error: "O nome de usuário deve conter apenas letras, números e sublinhados (_)" };
  }

  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', trimmed)
    .maybeSingle();

  if (checkError) {
    return { error: "Erro ao validar nome de usuário" };
  }

  if (existing && existing.id !== user.id) {
    return { error: "Este nome de usuário já está em uso" };
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ username: trimmed })
    .eq('id', user.id);

  if (profileUpdateError) {
    return { error: "Erro ao atualizar nome de usuário no perfil" };
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { username: trimmed }
  });

  if (authUpdateError) {
    console.warn("Could not sync username in auth metadata:", authUpdateError);
  }

  return { success: true };
}

import { createClient } from "@supabase/supabase-js";

/**
 * Deleta permanentemente a conta do usuário autenticado e todos os seus dados associados
 * (cartas, trocas, presentes, etc) conforme definido no banco de dados.
 *
 * @returns Objeto contendo as mensagens de erro ou indicador de sucesso.
 */
export async function deleteAccount() {
  const supabase = await createSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    return { error: "Usuário não autenticado" };
  }

  const user = data.user;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return { error: "Credenciais de administrador não configuradas no servidor" };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Admin delete user error:", deleteError);
    return { error: "Erro ao deletar conta: " + deleteError.message };
  }

  await supabase.auth.signOut();
  return { success: true };
}