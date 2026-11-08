import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM public.agents ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, agent_code, region, access_pin } = body;

    const pin = access_pin || Math.floor(1000 + Math.random() * 9000).toString();

    const res = await query(
      `INSERT INTO public.agents (name, full_name, phone, whatsapp_number, agent_code, region, access_pin, pin_hash, status)
       VALUES ($1, $1, $2, $2, $3, $4, $5, $5, 'active') RETURNING *`,
      [name, phone || 'N/A', agent_code, region || 'General', pin]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const res = await query(
      `UPDATE public.agents SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Agent ID required' }, { status: 400 });
    }

    await query('DELETE FROM public.agents WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}