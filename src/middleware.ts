import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Use process.env directly as a fallback to ensure Edge compatibility
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  console.log("Token in Middleware:", token)
  
  const isAuthenticated = !!token;

  // 1. Redirect authenticated users away from public auth pages
  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Protect dashboard routes
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    // Crucial: Pass the current URL as a callback so users return after login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based protection (Uncomment when ready)
  if (pathname.startsWith("/dashboard/admin")) {
    if (token?.role !== "admin") {
      return NextResponse.redirect(new URL("/404", req.url)); // Use a real route
    }
  }

  return NextResponse.next();
}

export const config = {
  // Ensure your matcher covers all relevant paths
  matcher: ["/", "/login", "/dashboard/:path*"],
};