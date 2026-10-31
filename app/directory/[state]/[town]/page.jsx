// FORCE NEXT.JS TO NEVER CACHE THIS PAGE
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { query } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import AdSenseBanner from '@/components/AdSenseBanner';

// Fetch town details and active local businesses safely
async function getDirectoryData(stateParam, townParam) {
  try {
    // 1. Fetch target town details using TRIM to prevent invisible space errors
    const townSql = `
      SELECT id, state, lga, name, slug 
      FROM towns 
      WHERE TRIM(LOWER(state)) = TRIM(LOWER($1)) 
        AND (
          TRIM(LOWER(slug)) = TRIM(LOWER($2)) 
          OR TRIM(LOWER(name)) = TRIM(LOWER($2))
        ) 
        AND is_active = true
      LIMIT 1;
    `;
    const townRes = await query(townSql, [stateParam, townParam]);
    
    if (!townRes || !townRes.rows || townRes.rows.length === 0) return null;

    const town = townRes.rows[0];

    // 2. Fetch all businesses registered under this town
    const bizSql = `
      SELECT 
        b.id, b.name, b.slug, b.address, b.phone, b.whatsapp_number, 
        b.image_url, b.is_featured, b.is_verified,
        COALESCE(
          json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]'
        ) as products_sample
      FROM businesses b
      LEFT JOIN products p ON b.id = p.business_id
      WHERE b.town_id = $1 AND b.status = 'active'
      GROUP BY b.id
      ORDER BY b.is_featured DESC, b.created_at DESC;
    `;
    const bizRes = await query(bizSql, [town.id]);

    // 3. Fetch categories
    const categoriesRes = await query('SELECT name FROM categories ORDER BY name ASC');

    return {
      town,
      businesses: bizRes ? bizRes.rows : [],
      categories: categoriesRes ? categoriesRes.rows : [],
    };
  } catch (error) {
    console.error('Error in getDirectoryData:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { state, town } = await params;
  const capitalizedTown = town ? town.charAt(0).toUpperCase() + town.slice(1) : 'Local';
  return {
    title: `${capitalizedTown} Business Directory`,
    description: `Find local businesses in ${capitalizedTown}.`,
  };
}

// Added searchParams to force Next.js to evaluate the route dynamically
export default async function RegionalDirectoryPage({ params, searchParams }) {
  const { state, town: townParam } = await params;
  
  // Await searchParams to satisfy Next.js 15 async requirements
  await searchParams; 

  const data = await getDirectoryData(state, townParam);

  if (!data) {
    return (
      <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border p-8 text-center space-y-3 max-w-sm">
          <span className="text-4xl">📍</span>
          <h2 className="text-base font-bold capitalize">Directory Error</h2>
          <p className="text-xs text-slate-500">
            We couldn't load the live database for <strong className="capitalize">{townParam}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const { town, businesses, categories } = data;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <div>
            <h1 className="text-sm font-bold leading-none">{town.name} Business Directory</h1>
            <p className="text-[11px] text-slate-500">{town.lga} LGA, {town.state} State</p>
          </div>
        </div>
        <Link href="/join" className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          + Add Shop
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* FILTERS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap">
            All Listings ({businesses.length})
          </span>
        </div>

        {/* LISTINGS */}
        <div className="space-y-3">
          {businesses.length > 0 ? (
            businesses.map((biz) => (
              <div key={biz.id} className="block bg-white rounded-2xl border p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">{biz.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">📍 {biz.address}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {biz.products_sample?.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm">No businesses listed yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}