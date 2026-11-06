import { NextResponse } from 'next/server';

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the route is an admin route
  if (pathname.startsWith('/admin')) {
    // Check for an admin auth cookie or token
    const adminToken = request.cookies.get('admin_token')?.value;

    // If no token exists, redirect to the shop owner login page
    if (!adminToken) {
      const url = new URL('/manage', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ['/admin/:path*'],
};