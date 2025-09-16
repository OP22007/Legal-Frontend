import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, persona, preferredLanguage, notificationsEnabled } = await req.json();
    if (!email || !password || !firstName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    const passwordHash = await hash(password, 10);
    // Generate email verification token
    const { randomBytes } = await import("crypto");
    const emailVerificationToken = randomBytes(32).toString("hex");
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        persona,
        preferredLanguage: preferredLanguage || "en",
        notificationsEnabled: notificationsEnabled ?? true,
        emailVerificationToken,
      },
    });
    // Send verification email
    try {
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail({ to: email, token: emailVerificationToken });
    } catch (e) {
      // Log error but don't block registration
      console.error("Failed to send verification email", e);
    }
    return NextResponse.json({ message: "User registered successfully. Please verify your email.", user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
