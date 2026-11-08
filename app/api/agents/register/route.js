import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, phone, agent_code, region, access_pin } = await request.json();

    if (!name || !phone || !agent_code || !access_pin) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    // Insert new agent with 'pending' status so admin can approve/reject/suspend later
    const result = await query(
      `INSERT INTO public.agents (name, phone, agent_code, region, access_pin, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, agent_code, name, status`,
      [name, phone, agent_code.toUpperCase(), region || 'General', access_pin]
    );

    return NextResponse.json({ success: true, agent: result.rows[0] });
  } catch (err) {
    console.error('Agent Registration Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Database error during registration.' }, { status: 500 });
  }
}