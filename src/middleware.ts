import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: env.NEXTAUTH_SECRET 
  });
  
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!token;

  // 1. Redirect authenticated users away from Login/Landing
  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Protect all Dashboard routes from unauthenticated users
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. NEW: Admin Guard
  // Only allow users with role === 'admin' into the admin sub-folder
  if (pathname.startsWith("/dashboard/admin")) {
    if (token?.role !== "admin") {
      // If not admin, send them to the main dashboard
      return NextResponse.redirect(new URL("/not-found", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};