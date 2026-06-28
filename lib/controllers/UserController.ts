'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { getUserCards } from "./CardController";
import { getUserItems } from "./ItemController";
import { getCurrentExchange } from "./ExchangeController";

export async function getUserProfile(userId?: string) {
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  // Fetch items, cards, and current exchange in parallel
  const [items, cards, currentExchange] = await Promise.all([
    getUserItems(targetUserId),
    getUserCards(targetUserId),
    getCurrentExchange(targetUserId),
  ]);

  return {
    profile,
    email: email || null,
    items,
    cards,
    currentExchange,
  };
}