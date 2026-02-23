import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

// Validation for environment variables to prevent runtime/deployment crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing. Database sync will fail.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

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
        updateAge: 24 * 60 * 60,
    },
    callbacks: {
        async signIn({ user, profile }) {
            const email = profile?.email;
            if (!email || !supabaseUrl) return false;

            const allowedDomains = ["provusinc.com", "provus.ai"];
            const isAllowedDomain = allowedDomains.some(domain => email.endsWith(`@${domain}`));
            
            // ✅ OPTION 2: Dev Environment Bypass
            const isDevMode = process.env.NODE_ENV === "development";

            // Reject if not an allowed domain AND we are NOT in development mode
            if (!isAllowedDomain && !isDevMode) {
                console.warn(`Blocked login attempt from unauthorized email: ${email}`);
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
                    return false;
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
        error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };