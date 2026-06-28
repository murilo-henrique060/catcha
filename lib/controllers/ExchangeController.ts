'use server';

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function getCurrentExchange(profileId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('exchanges')
    .select('*')
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error("Error fetching current exchange:", error);
    return null;
  }

  return data;
}
