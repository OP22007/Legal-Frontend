//src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { UserRole, UserPersona } from "@/generated/prisma/client";

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

	session: {
		strategy: "jwt",
	},

	pages: {
		signIn: "/auth/login",
	},

	callbacks: {
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
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
                token.email = user.email;
                token.name = user.firstName+" "+user.lastName;
				token.role = user.role;
				token.persona = user.persona;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
				session.user.role = token.role as UserRole;
				session.user.persona = token.persona as UserPersona;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
