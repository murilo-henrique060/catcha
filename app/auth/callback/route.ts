import { NextRequest, NextResponse } from "next/server";

import { confirmEmail } from "@/lib/actions/AuthController";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/home";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  // Use the configured site URL if available, otherwise use the request's origin
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

  if (code) {
    const { error } = await confirmEmail({ code });

    if (error) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_recovery_session", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}