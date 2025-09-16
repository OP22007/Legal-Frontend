import NextAuth, { DefaultSession } from "next-auth";
import { UserRole, UserPersona } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      persona: UserPersona;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    persona: UserPersona;
  }
}
