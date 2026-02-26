import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; // NEW
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
          role: "user",
        };
      },
    }),
    // --- NEW: DEVELOPMENT CREDENTIALS PROVIDER ---
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Development Bypass",
            credentials: {
              name: { label: "Name", type: "text" },
              email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              // Return a mock user object
              return {
                id: `dev-${credentials.email}`,
                name: credentials.name || "Dev User",
                email: credentials.email,
                role: "admin", // Give dev users admin rights for testing
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ profile, account }) {
      // FIX: Always allow credentials provider on localhost
      if (process.env.NODE_ENV === "development" && account?.provider === "credentials") {
        return true;
      }

      const email = profile?.email?.toLowerCase();
      if (!email) return "/auth/error?error=NoEmail";
      
      // FIX: Bypass domain check on localhost
      const isLocalhost = process.env.NODE_ENV === "development";
      const isDomainAllowed = ALLOWED_DOMAINS.some((domain) => 
        email.endsWith(`@${domain.toLowerCase()}`)
      );

      if (isLocalhost || isDomainAllowed) {
        return true; 
      }

      return false; 
    },

    async jwt({ token, user }) {
      if (user) {
        // Skip DB check for mock dev users to avoid Supabase errors
        if (user.id.startsWith("dev-")) {
          token.role = user.role;
          return token;
        }

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
export { handler as GET, handler as POST }; // Fix: Ensure POST is exported for Credentials