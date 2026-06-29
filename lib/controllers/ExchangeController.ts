'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

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
