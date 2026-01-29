import NextAuth, { AuthOptions } from "next-auth";
// TODO: Replace with your actual authOptions or import from a config file if exists
export const authOptions: AuthOptions = {
    providers: [],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user && token?.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    }
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 