import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch all businesses with optional status filter
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || 'all';

  try {
    const sql = `
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.address,
        b.phone,
        b.whatsapp_number,
        b.image_url,
        b.status,
        b.is_featured,
        b.is_verified,
        b.created_at,
        t.name as town_name,
        t.state
      FROM businesses b
      JOIN towns t ON b.town_id = t.id
      WHERE ($1 = 'all' OR b.status = $1::business_status)
      ORDER BY b.created_at DESC;
    `;

    const result = await query(sql, [statusFilter]);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching admin businesses:', error);
    return NextResponse.json({ success: false, error: 'Database fetch failed' }, { status: 500 });
  }
}

// PATCH: Update business status, verified badge, or featured slot
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, is_verified, is_featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 });
    }

    const sql = `
      UPDATE businesses
      SET 
        status = COALESCE($2::business_status, status),
        is_verified = COALESCE($3, is_verified),
        is_featured = COALESCE($4, is_featured),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, status, is_verified, is_featured;
    `;

    const result = await query(sql, [id, status || null, is_verified ?? null, is_featured ?? null]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Remove a business listing
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 });
    }

    await query('DELETE FROM businesses WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}