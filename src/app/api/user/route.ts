import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    persona: user.persona,
    preferredLanguage: user.preferredLanguage,
    notificationsEnabled: user.notificationsEnabled,
    dataRetentionDays: user.dataRetentionDays,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json();
  const allowedFields = ["firstName", "lastName", "persona", "preferredLanguage", "notificationsEnabled", "dataRetentionDays"];
  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in data) updateData[key] = data[key];
  }
  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: updateData,
  });
  return NextResponse.json({ message: "Profile updated", user });
}
