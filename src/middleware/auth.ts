import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Protect API routes under /api/user and /api/secure
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/user/:path*",
    "/api/secure/:path*",
    "/dashboard/:path*"
  ]
};
