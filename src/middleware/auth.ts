import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('favicon.ico') ||
      pathname.includes('.png') ||
      pathname.includes('.jpg')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const publicPaths = ['/', '/auth/login', '/auth/register', '/terms', '/privacy'];

  // If it's a public path, allow access regardless of token status
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // If it's not a public path and there's no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in and tries to access login/register, redirect them away
  if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If the user is logged in, allow access to the protected route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - favicon.ico, images
     */
    '/((?!api|_next|favicon.ico|.*\\.(png|jpg|jpeg|gif|svg)).*)',
  ],
};