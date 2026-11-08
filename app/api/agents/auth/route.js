import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { agent_code, access_pin } = await request.json();
    const res = await query(
      `SELECT * FROM public.agents WHERE LOWER(agent_code) = LOWER($1) AND access_pin = $2 LIMIT 1`,
      [agent_code.trim(), access_pin.trim()]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid agent code or PIN' }, { status: 401 });
    }

    return NextResponse.json({ success: true, agent: res.rows[0] });
  } catch (error) {
    console.error('Agent Auth Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}