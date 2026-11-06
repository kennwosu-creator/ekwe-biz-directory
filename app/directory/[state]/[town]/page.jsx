export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import AdSenseBanner from '@/components/AdSenseBanner';
import AdvancedSearch from '@/components/AdvancedSearch';
import SafeImage from '@/components/SafeImage';
import WhatsAppButton from '@/components/WhatsAppButton';

// Fetch town details, sister towns in LGA, categories, and active local businesses safely
async function getDirectoryData(stateParam, townParam) {
  if (!stateParam || !townParam) return null;

  try {
    // 1. Fetch target town details using explicit schema and TRIM (1 row limit)
    const townSql = `
      SELECT id, state, lga, name, slug, district, sub_locality 
      FROM public.towns 
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
    if (!townRes || !townRes.rows || townRes.rows.length === 0) {
      console.warn(`[Directory Lookup Failed] State: "${stateParam}", Town: "${townParam}"`);
      return null;
    }

    const town = townRes.rows[0];

    // 2. Fetch active businesses registered under this town (safely pulling category icon via products)
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
        (
          SELECT c.icon_url 
          FROM public.products pr 
          JOIN public.categories c ON pr.category_id = c.id 
          WHERE pr.business_id = b.id 
          LIMIT 1
        ) AS category_icon_url,
        COALESCE(
          json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]'
        ) as products_sample
      FROM public.businesses b
      LEFT JOIN public.products p ON b.id = p.business_id
      WHERE b.town_id = $1 AND (b.status::text ILIKE 'active' OR b.status IS NULL)
      GROUP BY b.id
      ORDER BY b.is_featured DESC, b.created_at DESC;
    `;

    const bizRes = await query(bizSql, [town.id]);

    // 3. Fetch categories
    const categoriesRes = await query('SELECT name FROM public.categories ORDER BY name ASC');

    // 4. Targeted LGA query: Fetch sister towns within the same LGA (~15-25 rows instead of 172k)
    const sisterTownsRes = await query(
      `SELECT DISTINCT ON (LOWER(TRIM(name))) id, name, slug, lga, state 
       FROM public.towns 
       WHERE is_active = true 
         AND LOWER(state) = LOWER($1) 
         AND LOWER(lga) = LOWER($2)
       ORDER BY LOWER(TRIM(name)) ASC 
       LIMIT 25`,
      [town.state, town.lga]
    );

    return {
      town,
      businesses: bizRes ? bizRes.rows : [],
      categories: categoriesRes ? categoriesRes.rows : [],
      allTowns: sisterTownsRes ? sisterTownsRes.rows : [],
    };
  } catch (error) {
    console.error('[DB Query Error in getDirectoryData]:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const state = resolvedParams?.state || '';
  const town = resolvedParams?.town || '';

  const capitalizedTown = town ? town.charAt(0).toUpperCase() + town.slice(1) : 'Local';
  const capitalizedState = state ? state.charAt(0).toUpperCase() + state.slice(1) : '';

  return {
    title: `${capitalizedTown} Community Directory - Verified Local Shops & Services | CommunityShops`,
    description: `Find local village shops, merchants, and goods in ${capitalizedTown}, ${capitalizedState} State on CommunityShops.`,
  };
}

export default async function RegionalDirectoryPage({ params }) {
  const resolvedParams = await params;
  const stateParam = resolvedParams?.state;
  const townParam = resolvedParams?.town;

  const data = await getDirectoryData(stateParam, townParam);

  if (!data) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 max-w-sm shadow-xs">
          <span className="text-4xl">📍</span>
          <h2 className="text-base font-bold text-slate-900 capitalize">Town Directory Not Found</h2>
          <p className="text-xs text-slate-500">
            We couldn't find listings for <strong className="capitalize">{townParam}</strong> in {stateParam} State.
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

  const { town, businesses, categories, allTowns } = data;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition">
          <span className="text-xl">🏠</span>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none group-hover:text-emerald-600 transition">
              {town.name} Directory
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              ← Home / {town.lga} LGA, {town.state}
            </p>
          </div>
        </Link>

        <Link
          href="/register"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs transition"
        >
          + Add Shop
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* EMBEDDED ADVANCED SEARCH COMPONENT */}
        <AdvancedSearch
          towns={allTowns}
          categories={categories}
          initialParams={{ town: town.slug }}
        />

        {/* CATEGORY QUICK FILTERS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xs">
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

        {/* TOUCH-OPTIMIZED BUSINESS LISTINGS STACK WITH ADS */}
        <div className="space-y-3">
          {businesses.length > 0 ? (
            businesses.map((biz, index) => (
              <div key={biz.id}>
                <Link
                  href={`/biz/${biz.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:border-emerald-300 active:bg-slate-50 active:scale-[0.98] transition-all duration-150"
                >
                  <div className="flex gap-3">
                    {/* Zero-CLS Safe Image with Category Fallback */}
                    <SafeImage
                      src={biz.image_url}
                      alt={biz.name}
                      fallbackSrc={biz.category_icon_url || '/uploads/placeholder-shop.jpg'}
                      fill
                      className="h-20 w-20 rounded-xl shrink-0 border border-slate-100 object-cover"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h2>
                          {biz.is_verified && (
                            <span
                              className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0"
                              title="Verified Business"
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5">📍 {biz.address}</p>

                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {biz.products_sample?.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 text-[9px] font-medium px-2 py-0.5 rounded-md"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CLIENT COMPONENT FOR WHATSAPP INTERACTION */}
                      <WhatsAppButton
                        whatsappNumber={biz.whatsapp_number}
                        businessName={biz.name}
                      />
                    </div>
                  </div>
                </Link>

                {(index + 1) % 3 === 0 && (
                  <AdSenseBanner slot="DIR_INLINE_DISPLAY_SLOT" />
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2 shadow-xs">
              <span className="text-3xl">🏪</span>
              <h3 className="text-sm font-bold text-slate-800">No businesses listed in {town.name} yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Be the first shop owner in {town.name} to get a free business webpage!
              </p>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
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