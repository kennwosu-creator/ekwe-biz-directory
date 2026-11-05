import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const townsRes = await query(
      'SELECT id, name, slug, lga, state FROM public.towns WHERE is_active = true ORDER BY name ASC'
    );
    const categoriesRes = await query(
      'SELECT id, name FROM public.categories ORDER BY name ASC'
    );

    return NextResponse.json({
      towns: townsRes?.rows || [],
      categories: categoriesRes?.rows || [],
    });
  } catch (error) {
    console.error('[Directory Options API Error]:', error);
    return NextResponse.json({ towns: [], categories: [] }, { status: 500 });
  }
}