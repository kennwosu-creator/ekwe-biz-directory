import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, town_id, address, phone, whatsapp_number, pin, agent_code, image_url, products } = body;

    if (!name || !town_id || !address || !phone || !whatsapp_number || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Generate clean URL slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Resolve Agent if agent_code supplied
    let agentId = null;
    if (agent_code && agent_code.trim()) {
      const agentRes = await query('SELECT id FROM public.agents WHERE phone = $1 LIMIT 1', [agent_code.trim()]);
      if (agentRes?.rows?.length > 0) {
        agentId = agentRes.rows[0].id;
      }
    }

    // 3. Insert Business
    const defaultImage = image_url || 'https://images.unsplash.com/photo-1595855759920-86582396756a';
    const bizSql = `
      INSERT INTO public.businesses 
      (town_id, name, slug, address, phone, whatsapp_number, image_url, pin_hash, status, is_verified, is_featured, onboarded_by_agent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active'::business_status, true, false, $9)
      RETURNING id, slug;
    `;

    const bizParams = [town_id, name, slug, address, phone, whatsapp_number, defaultImage, pin, agentId];
    const bizRes = await query(bizSql, bizParams);
    const newBiz = bizRes.rows[0];

    // 4. Insert Products if provided
    if (Array.isArray(products) && products.length > 0) {
      for (const prod of products) {
        if (prod.name && prod.name.trim()) {
          await query(
            `INSERT INTO public.products (business_id, name, price, in_stock, search_count) VALUES ($1, $2, $3, true, 0)`,
            [newBiz.id, prod.name.trim(), prod.price ? parseFloat(prod.price) : null]
          );
        }
      }
    }

    return NextResponse.json({ success: true, slug: newBiz.slug });
  } catch (error) {
    console.error('[Registration API Error]:', error);
    return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 });
  }
}