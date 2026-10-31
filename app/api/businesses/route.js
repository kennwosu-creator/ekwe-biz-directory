import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { parseAndSaveProducts } from '@/lib/productParser';

// Helper: Generate URL-safe slug
function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET: Fetch businesses for directory & search views
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const townSlug = searchParams.get('town') || 'imo-isu-ekwe';
  const searchQuery = searchParams.get('q') || '';

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
        b.is_featured,
        b.is_verified,
        t.name as town_name,
        t.state,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'name', p.name, 'category', c.name)
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) as products
      FROM businesses b
      JOIN towns t ON b.town_id = t.id
      LEFT JOIN products p ON b.id = p.business_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE t.slug = $1 
        AND b.status = 'active'
        AND ($2 = '' OR b.name ILIKE $3 OR p.name ILIKE $3)
      GROUP BY b.id, t.name, t.state
      ORDER BY b.is_featured DESC, b.created_at DESC;
    `;

    const result = await query(sql, [townSlug, searchQuery, `%${searchQuery}%`]);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

// PUT: Update business details & inventory from web editor
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, address, raw_products } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'Business ID and Name required' }, { status: 400 });
    }

    const sql = `
      UPDATE businesses
      SET name = $2, address = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, slug;
    `;

    const result = await query(sql, [id, name, address || '']);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Parse and add any newly submitted inventory items
    if (raw_products) {
      await parseAndSaveProducts(id, raw_products);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// POST: Create a new business profile
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, town_slug, address, phone, whatsapp_number, image_url, pin } = body;

    if (!name || !phone || !pin) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Resolve Town ID
    const townRes = await query('SELECT id FROM towns WHERE slug = $1', [town_slug || 'imo-isu-ekwe']);
    if (townRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Town not found' }, { status: 404 });
    }
    const townId = townRes.rows[0].id;

    // 2. Generate Unique Slug & Hash PIN
    const baseSlug = createSlug(`${name}-${town_slug.split('-').pop()}`);
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pinHash = crypto.createHash('sha256').update(pin.toString()).digest('hex');

    // 3. Insert Business
    const insertSql = `
      INSERT INTO businesses (town_id, name, slug, address, phone, whatsapp_number, image_url, pin_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, slug;
    `;

    const result = await query(insertSql, [
      townId,
      name,
      slug,
      address || 'Ekwe, Imo State',
      phone,
      whatsapp_number || phone,
      image_url || null,
      pinHash
    ]);

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ success: false, error: 'Failed to create business' }, { status: 500 });
  }
}