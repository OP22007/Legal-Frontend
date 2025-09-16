import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    // You may want to issue a session or JWT here, but NextAuth handles sessions.
    return NextResponse.json({ message: "Login successful.", user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
