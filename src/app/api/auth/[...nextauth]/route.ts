import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});

				if (!user || !user.passwordHash) {
					return null;
				}

				const isPasswordValid = await compare(
					credentials.password,
					user.passwordHash
				);

				if (!isPasswordValid) {
					return null;
				}

				return user;
			},
		}),
	],

	// ✅ CHANGE THIS: Use the database strategy to enable account linking
	session: {
		strategy: "database",
	},

	pages: {
		signIn: "/auth/login",
	},

	callbacks: {
		// ✅ SIMPLIFIED CALLBACK: With a database strategy, the user object is directly available.
        async signIn({ user, account, profile }) {
			// Allow credentials login
			if (account?.provider === "credentials") {
				return true;
			}
			// For OAuth providers, check if the user already exists in your database
			if (account?.provider === "google") {
				const userExists = await prisma.user.findUnique({
					where: { email: user.email! },
				});
				// If user doesn't exist, block the sign-in
				if (!userExists) {
					// You can redirect to a custom error page or back to login
					return "/auth/login?error=AccountNotFound";
				}
				// If user exists, allow sign-in
				return true;
			}
			// Deny other providers by default
			return false;
		},
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
                session.user.name = user.firstName+" "+user.lastName // Add 
                // user ID to the session
                session.user.role = user.role // Add user role to the session
                session.user.persona = user.persona // Add user persona to the session
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };