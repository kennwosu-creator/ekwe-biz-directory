import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { whatsapp_number, pin } = body;

    if (!whatsapp_number || !pin) {
      return NextResponse.json({ success: false, error: 'Phone number and PIN required' }, { status: 400 });
    }

    const cleanPhone = String(whatsapp_number).trim();
    const cleanPin = String(pin).trim();
    const pinHash = crypto.createHash('sha256').update(cleanPin).digest('hex');

    // DEBUG LOGS - View in your VS Code / npm terminal
    console.log('--- DEBUG OTP AUTH ---');
    console.log('Clean Phone:', cleanPhone);
    console.log('Computed PIN Hash:', pinHash);

    const sql = `
      SELECT id, name, slug 
      FROM businesses 
      WHERE (whatsapp_number = $1 OR phone = $1) AND pin_hash = $2 AND status = 'active'
    `;

    const result = await query(sql, [cleanPhone, pinHash]);

    console.log('DB Query Match Count:', result.rows.length);
    console.log('----------------------');

    if (!result || !result.rows || result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid phone number or 4-digit PIN' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      authenticated: true,
      business: result.rows[0]
    });
  } catch (error) {
    console.error('OTP AUTH ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Authentication failed' 
    }, { status: 500 });
  }
}