import NextAuth from "next-auth";
// TODO: Replace with your actual authOptions
const handler = NextAuth({ providers: [], secret: process.env.NEXTAUTH_SECRET });
export { handler as GET, handler as POST }; 