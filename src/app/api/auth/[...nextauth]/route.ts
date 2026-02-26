import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { ALLOWED_DOMAINS } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}

// Initialize Supabase with Service Role to bypass RLS for auth checks
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user", // Default role; will be overridden by DB value in jwt callback
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ profile }) {
  console.log("--- AUTH ATTEMPT ---");
  const email = profile?.email?.toLowerCase();
  console.log("Attempting email:", email);

  if (!email) return "/auth/error?error=NoEmail";
  
  const isDomainAllowed = ALLOWED_DOMAINS.some((domain) => 
    email.endsWith(`@${domain.toLowerCase()}`)
  );

  console.log("Domain Allowed?", isDomainAllowed);

  if (!isDomainAllowed) {
    console.log("❌ ACCESS DENIED: Not a Provus email.");
    return false; // Returning FALSE explicitly kills the session creation
  }

  console.log("✅ ACCESS GRANTED: Proceeding to Sync...");
  return true; 
},

    async jwt({ token, user }) {
      // On initial sign-in, fetch the true role from the database
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        token.role = data?.role || "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };