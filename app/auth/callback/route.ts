import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_recovery_session", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}