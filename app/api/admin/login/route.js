import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Retrieve admin credentials from environment variables (fallback to defaults if not set)
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'communityshops2026';

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    // Set the secure admin session cookie using Next.js cookies utility
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'admin_session',
      value: 'authenticated_admin_token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // Valid for 24 hours
    });

    return NextResponse.json({ success: true, message: 'Admin login successful' });
  } catch (err) {
    console.error('Admin Login Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}