import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Extend the session type to include user ID
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

// Safe Supabase Initialization to prevent top-level crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account", // Fixes "sticky session" by forcing account choice
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
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async signIn({ user, profile }) {
            const email = profile?.email;
            if (!email) return false;

            // Restrict login to specific domains
            const allowedDomains = ["provusinc.com", "provus.ai"];
            const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain}`));

            if (!isAllowed) return false;

            // Sync user data to Supabase
            if (supabase) {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            email: user.email,
                            display_name: user.name,
                            avatar_url: user.image,
                            last_login: new Date().toISOString(),
                        }, { onConflict: 'email' });

                    if (error) {
                        console.error("Supabase Sync Error:", error.message);
                        // Allow login to proceed even if DB sync fails
                        return true; 
                    }
                } catch (e) {
                    console.error("Critical Sync Error:", e);
                    return true;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub as string; // Pass ID to client-side session
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // Redirects here for sign-in
        error: '/api/auth/error', // Redirects here for auth failures
    },
    secret: process.env.NEXTAUTH_SECRET, // Required for production deployments
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };