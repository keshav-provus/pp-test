import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Extend session user type to include 'id'
declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

// Initialize inside or use a getter to prevent top-level crashes if variables are missing
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
};

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
        maxAge: 24 * 60 * 60,
    },
    callbacks: {
        async signIn({ user, profile }) {
            const email = profile?.email;
            if (!email) return false;

            const allowedDomains = ["provusinc.com", "provus.ai"];
            const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain}`));

            if (!isAllowed) return false;

            const supabase = getSupabase();
            if (!supabase) {
                console.error("Supabase config missing");
                return false; 
            }

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
                    return false; // If this returns false, NextAuth redirects back to login/error
                }
            } catch (e) {
                console.error("Critical Sync Error:", e);
                return false;
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
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/api/auth/error', // Matches your project structure
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };