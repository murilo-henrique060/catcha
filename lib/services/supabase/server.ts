import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

/**
 * Cria uma instância do cliente Supabase para o lado do servidor (Server Actions e Server Components).
 * Extrai e insere os cookies automaticamente, garantindo que as chamadas ao banco de dados herdem a 
 * sessão do usuário e o Row-Level Security (RLS) funcione corretamente.
 *
 * @returns Instância do cliente Supabase.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}