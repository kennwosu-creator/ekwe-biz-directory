import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, organizer, event_date, time_label, town_id, venue, description, whatsapp_contact } = body;

    if (!title || !event_date || !town_id || !venue || !whatsapp_contact) {
      return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO public.events (id, title, organizer, event_date, time_label, town_id, venue, description, whatsapp_contact, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [title, organizer, event_date, time_label, town_id, venue, description, whatsapp_contact]
    );

    return NextResponse.json({ success: true, eventId: insertRes.rows[0].id });
  } catch (error) {
    console.error('Event registration API error:', error);
    return NextResponse.json({ error: 'Internal server error while publishing event.' }, { status: 500 });
  }
}