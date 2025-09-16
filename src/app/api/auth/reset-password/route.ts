import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

// POST: Request password reset (send email with token)
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.user.update({
    where: { email },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });
  // TODO: Send email with reset link containing token
  return NextResponse.json({ message: "Password reset email sent." });
}

// PATCH: Reset password using token
export async function PATCH(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token and password required." }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } } });
  if (!user) return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });
  return NextResponse.json({ message: "Password reset successful." });
}
