import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

// POST: Request email verification (send email with token)
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.isEmailVerified) return NextResponse.json({ message: "Email already verified." });
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { email },
    data: { emailVerificationToken: token },
  });
  // TODO: Send email with verification link containing token
  return NextResponse.json({ message: "Verification email sent." });
}

// PATCH: Verify email using token
export async function PATCH(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required." }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerificationToken: null },
  });
  return NextResponse.json({ message: "Email verified successfully." });
}
