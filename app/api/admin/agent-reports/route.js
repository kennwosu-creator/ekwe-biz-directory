import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM public.agent_reports ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Error fetching agent reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { reportId, status } = body;

    const res = await query(
      `UPDATE public.agent_reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, reportId]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}