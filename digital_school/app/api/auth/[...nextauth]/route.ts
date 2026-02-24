import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prismadb from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { socketService } from "@/lib/socket";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Phone", type: "text" },
                password: { label: "Password", type: "password" },
                loginMethod: { label: "Login Method", type: "text" }
            },
            async authorize(credentials, req) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                const loginMethod = credentials.loginMethod || 'email';

                let user;
                try {
                    user = await (prismadb.user as any).findFirst({
                        where: loginMethod === 'email'
                            ? { email: credentials.identifier }
                            : { phone: credentials.identifier },
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            password: true,
                            role: true,
                            name: true,
                            isActive: true,
                            emailVerified: true,
                            isApproved: true,
                            instituteId: true,
                            institute: { select: { id: true, name: true } },
                        }
                    });
                } catch (dbError: any) {
                    console.warn('[NEXTAUTH] Initial findFirst failed, trying minimal select.', dbError.message);
                    user = await (prismadb.user as any).findFirst({
                        where: loginMethod === 'email'
                            ? { email: credentials.identifier }
                            : { phone: credentials.identifier }
                    });
                }

                if (!user) {
                    throw new Error(`No user found with this ${loginMethod}`);
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                // Create Session ID
                const sessionId = uuidv4();

                // Get device info from headers (passed via req in authorize)
                const userAgent = req?.headers?.['user-agent'] || 'Unknown Device';
                const ip = req?.headers?.['x-forwarded-for'] || 'Unknown IP';

                let deviceName = 'PC/Browser';
                if (userAgent.includes('iPhone')) deviceName = 'iPhone';
                else if (userAgent.includes('Android')) deviceName = 'Android Phone';
                else if (userAgent.includes('iPad')) deviceName = 'iPad';
                else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
                else if (userAgent.includes('Windows')) deviceName = 'Windows PC';

                const sessionInfo = {
                    device: deviceName, ip, time: new Date().toISOString(), userAgent
                };

                // Emit forced-logout to previous session via socket if enabled
                try {
                    socketService.sendNotificationToUser(user.id, {
                        type: 'forced-logout',
                        message: `New login: ${deviceName} at ${new Date().toLocaleTimeString()}`,
                        info: sessionInfo
                    });
                } catch (socketError) {
                    console.warn('[NEXTAUTH] Socket emission failed:', socketError);
                }

                // Update user session in DB
                try {
                    await prismadb.user.update({
                        where: { id: user.id },
                        data: {
                            lastLoginAt: new Date(),
                            activeSessionId: sessionId,
                            lastSessionInfo: sessionInfo
                        } as any,
                    });
                } catch (dbError: any) {
                    console.error('[NEXTAUTH] DB Session update failed:', dbError.message);
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    sid: sessionId,
                    verified: (user as any).emailVerified !== false,
                    approved: (user as any).isApproved !== false,
                    instituteId: user.instituteId,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.sid = (user as any).sid;
                token.verified = (user as any).verified;
                token.approved = (user as any).approved;
                token.instituteId = (user as any).instituteId;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).sid = token.sid;
                (session.user as any).verified = token.verified;
                (session.user as any).approved = token.approved;
                (session.user as any).instituteId = token.instituteId;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
