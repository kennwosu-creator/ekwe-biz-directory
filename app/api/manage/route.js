import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST: Verify PIN and fetch/update shop data
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, slug, pin, updates } = body;

    if (!slug || !pin) {
      return NextResponse.json({ success: false, error: 'Shop slug and 4-digit PIN are required.' }, { status: 400 });
    }

    // Verify business and PIN
    const bizRes = await query(
      `SELECT * FROM public.businesses WHERE slug = $1 AND pin = $2 LIMIT 1`,
      [slug.trim(), pin.trim()]
    );

    if (bizRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid shop URL or 4-digit PIN.' }, { status: 401 });
    }

    const business = bizRes.rows[0];

    // If action is update, save changes
    if (action === 'update') {
      const { name, address, phone, whatsapp_number, image_url } = updates;
      await query(
        `UPDATE public.businesses 
         SET name = $1, address = $2, phone = $3, whatsapp_number = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $6`,
        [name, address, phone, whatsapp_number, image_url, business.id]
      );
      return NextResponse.json({ success: true, message: 'Shop updated successfully!' });
    }

    // Default: Return business details and its current products
    const productsRes = await query(
      `SELECT id, name, price, in_stock FROM public.products WHERE business_id = $1 ORDER BY name ASC`,
      [business.id]
    );

    return NextResponse.json({
      success: true,
      business,
      products: productsRes.rows,
    });
  } catch (error) {
    console.error('[Manage API Error]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}