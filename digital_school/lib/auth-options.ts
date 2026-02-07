import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
    providers: [],
    // secret: process.env.NEXTAUTH_SECRET, // Add this if needed, usually NextAuth reads it automatically
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user && token?.sub) {
                // Safe type casting or extension needed here if you want to add id to session.user
                (session.user as any).id = token.sub;
            }
            return session;
        }
    }
};
