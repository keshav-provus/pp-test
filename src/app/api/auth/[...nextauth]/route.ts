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

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // ⚡️ THIS BLOCK FIXES THE "STICKY SESSION" ERROR
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
    // app/api/auth/[...nextauth]/route.ts

    session: {
        strategy: "jwt",
        
        maxAge: 24 * 60 * 60, 

        updateAge: 24 * 60 * 60,
    },
    callbacks: {
        async signIn({ user, profile }) {
            const email = profile?.email;
            if (!email) return false;

            const allowedDomains = ["provusinc.com", "provus.ai"];
            const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain}`));

            if (!isAllowed) {
                // Return false here triggers the redirect to /auth/error
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
                        last_login: new Date().toISOString(), // Good practice to track login time
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
                session.user.id = token.sub;
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