import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  
  // Allow the login page and login API endpoint to be publicly accessible
  if (url.pathname.startsWith('/admin/login') || url.pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (url.pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};