import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// The exported function name must also be changed to 'proxy'
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        const email = token?.email || "";
        return !!token && (email.endsWith("@provusinc.com") || email.endsWith("@provus.ai"));
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