import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        const email = token?.email || "";
        return !!token && (email.endsWith("@provusinc.com") || email.endsWith("@provus.ai")) || email.endsWith("@gmail.com");
      },
    },
    pages: {
      signIn: "/login", 
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*", 
  ],
};