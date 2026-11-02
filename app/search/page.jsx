export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import AdvancedSearch from '@/components/AdvancedSearch';
import SafeImage from '@/components/SafeImage';

async function getFilterOptions() {
  try {
    const townsRes = await query(
      'SELECT id, name, slug, lga, state FROM public.towns WHERE is_active = true ORDER BY name ASC'
    );
    const categoriesRes = await query(
      'SELECT id, name FROM public.categories ORDER BY name ASC'
    );

    return {
      towns: townsRes.rows || [],
      categories: categoriesRes.rows || [],
    };
  } catch (error) {
    console.error('Error fetching search filter options:', error);
    return { towns: [], categories: [] };
  }
}

async function getSearchResults(params) {
  const { q, town: townSlug, category, lat, lng, radius } = params;

  // Don't query if no search filters or keywords are provided
  if (!q && !townSlug && !category && (!lat || !lng)) {
    return { businesses: [], selectedTown: null };
  }

  try {
    let selectedTown = null;
    if (townSlug) {
      const townRes = await query(
        'SELECT id, name, slug, state, lga FROM public.towns WHERE TRIM(LOWER(slug)) = TRIM(LOWER($1)) LIMIT 1',
        [townSlug]
      );
      selectedTown = townRes.rows[0] || null;
    }

    let sql = `
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.address,
        b.phone,
        b.whatsapp_number,
        b.image_url,
        b.is_verified,
        b.latitude,
        b.longitude,
        t.name as town_name
    `;

    const queryParams = [];
    let paramIdx = 1;

    // 1. Calculate distance in KM using Haversine formula if GPS coordinates are present
    const hasGps = lat && lng;
    if (hasGps) {
      sql += `,
        (6371 * acos(
          cos(radians($${paramIdx})) * cos(radians(b.latitude)) * 
          cos(radians(b.longitude) - radians($${paramIdx + 1})) + 
          sin(radians($${paramIdx})) * sin(radians(b.latitude))
        )) AS distance_km
      `;
      queryParams.push(parseFloat(lat), parseFloat(lng));
      paramIdx += 2;
    }

    sql += `
      FROM public.businesses b
      JOIN public.towns t ON b.town_id = t.id
      LEFT JOIN public.products p ON b.id = p.business_id
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE b.status = 'active'
    `;

    // 2. Filter by Search Query Keyword
    if (q) {
      sql += ` AND (b.name ILIKE $${paramIdx} OR b.address ILIKE $${paramIdx} OR p.name ILIKE $${paramIdx})`;
      queryParams.push(`%${q}%`);
      paramIdx++;
    }

    // 3. Filter by Specific Town
    if (selectedTown) {
      sql += ` AND b.town_id = $${paramIdx}`;
      queryParams.push(selectedTown.id);
      paramIdx++;
    }

    // 4. Filter by Category Name
    if (category) {
      sql += ` AND LOWER(c.name) = LOWER($${paramIdx})`;
      queryParams.push(category);
      paramIdx++;
    }

    // 5. Filter by Radius KM Distance
    if (hasGps && radius) {
      const latIdx = 1;
      const lngIdx = 2;
      sql += ` AND (6371 * acos(
        cos(radians($${latIdx})) * cos(radians(b.latitude)) * 
        cos(radians(b.longitude) - radians($${lngIdx})) + 
        sin(radians($${latIdx})) * sin(radians(b.latitude))
      )) <= $${paramIdx}`;
      queryParams.push(parseFloat(radius));
      paramIdx++;
    }

    sql += ` GROUP BY b.id, t.name `;

    if (hasGps) {
      sql += ` ORDER BY distance_km ASC, b.is_featured DESC `;
    } else {
      sql += ` ORDER BY b.is_featured DESC, b.created_at DESC `;
    }

    const res = await query(sql, queryParams);
    return { businesses: res.rows || [], selectedTown };
  } catch (error) {
    console.error('Error executing search query:', error);
    return { businesses: [], selectedTown: null };
  }
}

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  return {
    title: q ? `Search results for "${q}" - Ekwe Biz Directory` : 'Advanced Shop Search',
  };
}

export default async function SearchPage(props) {
  const searchParams = await props.searchParams;

  const initialParams = {
    q: searchParams?.q || '',
    town: searchParams?.town || '',
    category: searchParams?.category || '',
    lat: searchParams?.lat || '',
    lng: searchParams?.lng || '',
    radius: searchParams?.radius || '5',
  };

  const [{ towns, categories }, { businesses, selectedTown }] = await Promise.all([
    getFilterOptions(),
    getSearchResults(initialParams),
  ]);

  const hasSearched = Boolean(
    initialParams.q || initialParams.town || initialParams.category || (initialParams.lat && initialParams.lng)
  );

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="text-xs font-bold text-slate-700 hover:text-emerald-600 transition flex items-center gap-1">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
          {selectedTown ? `Searching in ${selectedTown.name}` : 'Advanced Search'}
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ADVANCED FILTER FORM COMPONENT */}
        <AdvancedSearch
          towns={towns}
          categories={categories}
          initialParams={initialParams}
        />

        {/* RESULTS SUMMARY */}
        <div className="text-xs text-slate-500 px-1">
          {hasSearched ? (
            <p>
              Found <strong className="text-slate-900">{businesses.length}</strong> matching shop(s)
              {initialParams.q && <span> for &quot;{initialParams.q}&quot;</span>}
              {selectedTown && <span> in {selectedTown.name}</span>}
              {initialParams.lat && initialParams.lng && (
                <span> (within {initialParams.radius} KM)</span>
              )}
            </p>
          ) : (
            <p>Use the search bar and filter drawers above to find verified local products or nearby services.</p>
          )}
        </div>

        {/* TOUCH-OPTIMIZED RESULTS LIST */}
        <div className="space-y-3">
          {businesses.length > 0 ? (
            businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/biz/${biz.slug}`}
                className="block bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:border-emerald-300 active:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                <div className="flex gap-3">
                  {/* Zero-CLS Safe Image with Skeleton Pulse */}
                  <SafeImage
                    src={biz.image_url}
                    alt={biz.name}
                    className="h-20 w-20 rounded-xl shrink-0 border border-slate-100"
                    fill
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 truncate">
                          <h2 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h2>
                          {biz.is_verified && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0" title="Verified Shop">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Distance Badge if GPS distance was calculated */}
                        {biz.distance_km !== undefined && (
                          <span className="bg-emerald-50 text-emerald-700 font-semibold text-[10px] px-2 py-0.5 rounded-full shrink-0 border border-emerald-200/60">
                            {parseFloat(biz.distance_km).toFixed(1)} km
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {biz.address} ({biz.town_name})
                      </p>

                      {/* Sample Goods Tags */}
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

                    {/* QUICK TOUCH ACTION: DIRECT WHATSAPP CHAT BUTTON */}
                    {biz.whatsapp_number && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Verified Merchant</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(
                              `https://wa.me/${biz.whatsapp_number}?text=${encodeURIComponent(
                                `Hello ${biz.name}, I found your shop on Ekwe Business Directory.`
                              )}`,
                              '_blank'
                            );
                          }}
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-emerald-200/60 transition active:scale-95"
                        >
                          <span>💬 Chat on WhatsApp</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            hasSearched && (
              <div className="bg-white rounded-2xl p-8 text-center space-y-2 border border-slate-200/80 shadow-xs">
                <span className="text-3xl">🔍</span>
                <h3 className="text-xs font-bold text-slate-800">No shops found</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Try broadening your search keywords, adjusting the distance slider, or selecting &quot;All Towns&quot;.
                </p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}