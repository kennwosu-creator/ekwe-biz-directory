import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, phone, pin } = body;

    if (!full_name || !phone || !pin || pin.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Full name, valid phone number, and 4-digit PIN required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');

    // Insert Agent with an initial ₦2,500 credit balance (allows onboarding 5 traders)
    const sql = `
      INSERT INTO agents (full_name, phone, whatsapp_number, pin_hash, wallet_balance)
      VALUES ($1, $2, $2, $3, 2500.00)
      ON CONFLICT (whatsapp_number) DO NOTHING
      RETURNING id, full_name, phone, wallet_balance;
    `;

    const res = await query(sql, [full_name, cleanPhone, pinHash]);

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'An agent with this phone number is already registered. Please log in.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: res.rows[0],
    });
  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json({ success: false, error: 'Agent registration failed' }, { status: 500 });
  }
}