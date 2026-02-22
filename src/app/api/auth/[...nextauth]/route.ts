import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Extend the built-in session types to include the user ID
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

// Safe Supabase Initialization: Prevents build-time errors on Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            // Forces account selection to prevent "sticky" sessions with wrong accounts
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

            // Domain Restriction: Matches middleware.ts
            const allowedDomains = ["provusinc.com", "provus.ai"];
            const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain}`));

            if (!isAllowed) {
                return false; // Denies access and redirects to error page
            }

            // Database Sync: Upsert user profile to Supabase
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
                        // We return true here so a DB failure doesn't block the login flow entirely
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
                // Ensure the user ID is passed from the token to the session
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
    // Required for Vercel production deployments
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };