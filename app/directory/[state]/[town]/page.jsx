export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import AdSenseBanner from '@/components/AdSenseBanner';

// Fetch town details and active local businesses safely
async function getDirectoryData(stateParam, townParam) {
  try {
    // 1. Fetch target town details (TRIM handles any whitespace differences)
    const townSql = `
      SELECT id, state, lga, name, slug 
      FROM towns 
      WHERE TRIM(LOWER(state)) = TRIM(LOWER($1)) 
        AND (
          TRIM(LOWER(slug)) = TRIM(LOWER($2)) 
          OR TRIM(LOWER(name)) = TRIM(LOWER($2)) 
          OR TRIM(LOWER(slug)) LIKE '%' || TRIM(LOWER($2))
        )
        AND is_active = true
      LIMIT 1;
    `;
    const townRes = await query(townSql, [stateParam, townParam]);
    if (!townRes || !townRes.rows || townRes.rows.length === 0) return null;

    const town = townRes.rows[0];

    // 2. Fetch all active businesses registered under this town
    const bizSql = `
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

    // 3. Fetch active product categories
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
  const capitalizedState = state ? state.charAt(0).toUpperCase() + state.slice(1) : '';

  return {
    title: `${capitalizedTown} Business Directory - Local Shops & Services`,
    description: `Find verified local businesses, shops, and products in ${capitalizedTown}, ${capitalizedState} State.`,
  };
}

export default async function RegionalDirectoryPage({ params }) {
  const { state, town: townParam } = await params;
  const data = await getDirectoryData(state, townParam);

  if (!data) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 max-w-sm">
          <span className="text-4xl">📍</span>
          <h2 className="text-base font-bold text-slate-900 capitalize">Town Directory Not Found</h2>
          <p className="text-xs text-slate-500">
            We couldn't find listings for <strong className="capitalize">{townParam}</strong> in {state} State.
          </p>
          <Link
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition mt-2"
          >
            ← Back to All Towns
          </Link>
        </div>
      </div>
    );
  }

  const { town, businesses, categories } = data;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">{town.name} Business Directory</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{town.lga} LGA, {town.state} State</p>
          </div>
        </div>
        <Link
          href="/join"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
        >
          + Add Shop
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* SEARCH BAR */}
        <form action="/search" method="GET" className="relative">
          <input type="hidden" name="town" value={town.slug} />
          <input
            type="text"
            name="q"
            placeholder={`Search shops or items in ${town.name}...`}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
          />
          <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs">🔍</span>
        </form>

        {/* CATEGORY FILTERS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xs">
            All Listings ({businesses.length})
          </span>
          {categories.map((cat) => (
            <span
              key={cat.name}
              className="bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              {cat.name}
            </span>
          ))}
        </div>

        {/* BUSINESS LISTINGS STACK WITH ADS */}
        <div className="space-y-3">
          {businesses.length > 0 ? (
            businesses.map((biz, index) => (
              <div key={biz.id}>
                <Link
                  href={`/biz/${biz.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-emerald-300 transition active:scale-[0.99]"
                >
                  <div className="flex gap-3.5">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <Image
                        src={biz.image_url || '/uploads/placeholder-shop.jpg'}
                        alt={biz.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-bold text-slate-900 truncate">{biz.name}</h2>
                        {biz.is_verified && (
                          <span className="text-emerald-600 text-xs shrink-0" title="Verified Business">
                            ✓
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-0.5">📍 {biz.address}</p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {biz.products_sample?.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>

                {(index + 1) % 3 === 0 && (
                  <AdSenseBanner slot="DIR_INLINE_DISPLAY_SLOT" />
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
              <span className="text-3xl">🏪</span>
              <h3 className="text-sm font-bold text-slate-800">No businesses listed in {town.name} yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Be the first shop owner in {town.name} to get a free business webpage!
              </p>
              <div className="pt-2">
                <Link
                  href="/join"
                  className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Register Shop via WhatsApp
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}