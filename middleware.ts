// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 修改响应头
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    "connect-src 'self' https://bill-aurora.ip-ddns.com"
  );
  return response;
}

export const config = {
  matcher: "/:path*",
};
