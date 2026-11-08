import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_id, agent_code, agent_name, groups_posted_to, shops_added_count, proof_links_or_notes } = body;

    const res = await query(
      `INSERT INTO public.agent_reports (agent_id, agent_code, agent_name, groups_posted_to, shops_added_count, proof_links_or_notes, report_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'pending') RETURNING *`,
      [agent_id, agent_code, agent_name, groups_posted_to || 0, shops_added_count || 0, proof_links_or_notes || '']
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Submit Report Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}