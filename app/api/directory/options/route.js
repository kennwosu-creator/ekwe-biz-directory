import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const lga = searchParams.get('lga');
    const district = searchParams.get('district');

    // 1. Level 1: Fetch States (Only returns ~37 unique state strings)
    if (!state) {
      const statesRes = await query(
        `SELECT DISTINCT state 
         FROM public.towns 
         WHERE is_active = true AND state IS NOT NULL AND TRIM(state) != '' 
         ORDER BY state ASC`
      );
      
      const categoriesRes = await query(
        `SELECT id, name FROM public.categories ORDER BY name ASC`
      );

      return NextResponse.json({
        states: statesRes.rows.map((r) => r.state),
        categories: categoriesRes.rows || [],
      });
    }

    // 2. Level 2: Fetch LGAs for selected State (Returns ~15-30 LGAs)
    if (state && !lga) {
      const lgasRes = await query(
        `SELECT DISTINCT lga 
         FROM public.towns 
         WHERE is_active = true AND state = $1 AND lga IS NOT NULL AND TRIM(lga) != '' 
         ORDER BY lga ASC`,
        [state]
      );
      return NextResponse.json({ lgas: lgasRes.rows.map((r) => r.lga) });
    }

    // 3. Level 3: Fetch Districts / Major Towns for selected State & LGA
    if (state && lga && !district) {
      const distRes = await query(
        `SELECT DISTINCT COALESCE(district, name) AS district 
         FROM public.towns 
         WHERE is_active = true AND state = $1 AND lga = $2 
         ORDER BY district ASC`,
        [state, lga]
      );
      return NextResponse.json({ districts: distRes.rows.map((r) => r.district) });
    }

    // 4. Level 4: Fetch Villages & Kindreds for selected District
    if (state && lga && district) {
      const villagesRes = await query(
        `SELECT id, name, sub_locality, slug 
         FROM public.towns 
         WHERE is_active = true AND state = $1 AND lga = $2 AND (district = $3 OR name = $3)
         ORDER BY name ASC, sub_locality ASC`,
        [state, lga, district]
      );
      return NextResponse.json({ villages: villagesRes.rows });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('[Directory Options API Error]:', error);
    return NextResponse.json({ states: [], categories: [], lgas: [], districts: [], villages: [] }, { status: 500 });
  }
}