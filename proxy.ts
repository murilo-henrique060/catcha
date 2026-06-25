import { NextRequest, NextResponse } from "next/server";

function isMobileUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/unsupported-mobile") {
    return NextResponse.next();
  }

  if (isMobileUserAgent(request.headers.get("user-agent"))) {
    const unsupportedUrl = new URL("/unsupported-mobile", request.url);
    return NextResponse.redirect(unsupportedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};