export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import AdvancedSearch from '@/components/AdvancedSearch';
import SafeImage from '@/components/SafeImage';
import WhatsAppButton from '@/components/WhatsAppButton';

// Helper function to fetch dropdown options for towns & categories
async function getFilterOptions() {
  try {
    const townsRes = await query(
      'SELECT id, name, slug, lga, state FROM public.towns WHERE is_active = true ORDER BY name ASC'
    );
    const categoriesRes = await query(
      'SELECT id, name FROM public.categories ORDER BY name ASC'
    );
    return { towns: townsRes?.rows || [], categories: categoriesRes?.rows || [] };
  } catch (error) {
    console.error('[Search Filter DB Error]:', error);
    return { towns: [], categories: [] };
  }
}

// =========================================================================
// 🔹 UNIFIED SEARCH BACKEND WITH SMART COMMUNITY FALLBACK
// =========================================================================
async function getUnifiedSearchResults(params) {
  const { q, town: townSlug, category, lat, lng, radius } = params;

  try {
    let selectedTown = null;
    if (townSlug && townSlug.trim()) {
      const townRes = await query(
        'SELECT id, name, slug, state, lga FROM public.towns WHERE LOWER(TRIM(slug)) = LOWER(TRIM($1)) LIMIT 1',
        [townSlug.trim()]
      );
      selectedTown = townRes?.rows?.[0] || null;
    }

    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;
    const parsedRadius = radius ? parseFloat(radius) : 5;
    const hasGps = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== null && parsedLng !== null;

    // Dynamic SQL Builder
    const buildQuery = (filterByTown) => {
      let bizSql = `
        SELECT 
          b.id,
          b.name,
          b.slug,
          b.address,
          b.phone,
          b.whatsapp_number,
          b.image_url,
          b.is_verified,
          b.is_featured,
          b.created_at,
          t.name as town_name,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT p.name), NULL) as products_sample
      `;

      const bizParams = [];
      let idx = 1;

      if (hasGps) {
        bizSql += `,
          (6371 * acos(
            cos(radians($${idx})) * cos(radians(b.latitude)) * 
            cos(radians(b.longitude) - radians($${idx + 1})) + 
            sin(radians($${idx})) * sin(radians(b.latitude))
          )) AS distance_km
        `;
        bizParams.push(parsedLat, parsedLng);
        idx += 2;
      }

      bizSql += `
        FROM public.businesses b
        JOIN public.towns t ON b.town_id = t.id
        LEFT JOIN public.products p ON b.id = p.business_id
        LEFT JOIN public.categories c ON p.category_id = c.id
        WHERE LOWER(b.status) = 'active'
      `;

      if (q && q.trim()) {
        bizSql += ` AND (b.name ILIKE $${idx} OR b.address ILIKE $${idx} OR p.name ILIKE $${idx} OR p.description ILIKE $${idx})`;
        bizParams.push(`%${q.trim()}%`);
        idx++;
      }

      if (filterByTown && selectedTown) {
        bizSql += ` AND b.town_id = $${idx}`;
        bizParams.push(selectedTown.id);
        idx++;
      }

      if (category && category.trim()) {
        bizSql += ` AND LOWER(c.name) = LOWER($${idx})`;
        bizParams.push(category.trim());
        idx++;
      }

      if (hasGps && parsedRadius) {
        const latIdx = 1;
        const lngIdx = 2;
        bizSql += ` AND (6371 * acos(
          cos(radians($${latIdx})) * cos(radians(b.latitude)) * 
          cos(radians(b.longitude) - radians($${lngIdx})) + 
          sin(radians($${latIdx})) * sin(radians(b.latitude))
        )) <= $${idx}`;
        bizParams.push(parsedRadius);
        idx++;
      }

      bizSql += ` 
        GROUP BY 
          b.id, b.name, b.slug, b.address, b.phone, b.whatsapp_number, 
          b.image_url, b.is_verified, b.is_featured, b.created_at, t.name 
      `;

      if (hasGps) {
        bizSql += ` ORDER BY distance_km ASC, b.is_featured DESC;`;
      } else {
        bizSql += ` ORDER BY b.is_featured DESC, b.created_at DESC;`;
      }

      return { bizSql, bizParams };
    };

    // 1. First execution restricted to selected town
    let { bizSql, bizParams } = buildQuery(true);
    let bizRes = await query(bizSql, bizParams);
    let isFallbackSearch = false;

    // 2. SMART FALLBACK: If 0 results match in selected town, search ALL communities!
    if ((!bizRes || bizRes.rows.length === 0) && selectedTown && q && q.trim()) {
      const fallback = buildQuery(false);
      bizRes = await query(fallback.bizSql, fallback.bizParams);
      if (bizRes && bizRes.rows.length > 0) {
        isFallbackSearch = true;
      }
    }

    // Telemetry counter update for trending recommendations
    if (q && q.trim()) {
      query(
        `UPDATE public.products SET search_count = COALESCE(search_count, 0) + 1 WHERE LOWER(name) ILIKE $1`,
        [`%${q.trim().toLowerCase()}%`]
      ).catch(() => {});
    }

    // Query Upcoming Community Events
    let eventSql = `
      SELECT e.id, e.title, e.organizer, e.event_date, e.time_label, e.venue, e.description, e.whatsapp_contact, t.name as town_name
      FROM public.events e
      JOIN public.towns t ON e.town_id = t.id
      WHERE e.event_date >= CURRENT_DATE
    `;
    const eventParams = [];
    let eIdx = 1;

    if (q && q.trim()) {
      eventSql += ` AND (e.title ILIKE $${eIdx} OR e.venue ILIKE $${eIdx} OR e.description ILIKE $${eIdx})`;
      eventParams.push(`%${q.trim()}%`);
      eIdx++;
    }

    if (selectedTown && !isFallbackSearch) {
      eventSql += ` AND e.town_id = $${eIdx}`;
      eventParams.push(selectedTown.id);
      eIdx++;
    }

    eventSql += ` ORDER BY e.event_date ASC;`;
    const eventRes = await query(eventSql, eventParams);

    // Query Viral Trending Products
    const recSql = `
      SELECT p.name, p.price, b.name as shop_name, b.slug as shop_slug, b.whatsapp_number
      FROM public.products p
      JOIN public.businesses b ON p.business_id = b.id
      WHERE LOWER(b.status) = 'active'
      ORDER BY COALESCE(p.search_count, 0) DESC, p.created_at DESC
      LIMIT 4;
    `;
    const recRes = await query(recSql, []);

    return {
      businesses: bizRes?.rows || [],
      events: eventRes?.rows || [],
      recommendations: recRes?.rows || [],
      selectedTown,
      isFallbackSearch,
    };
  } catch (error) {
    console.error('[Unified Search Error]:', error);
    return { businesses: [], events: [], recommendations: [], selectedTown: null, isFallbackSearch: false };
  }
}

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  return {
    title: q ? `Search "${q}" | CommunityShops` : 'Search Shops & Events | CommunityShops',
  };
}

// =========================================================================
// 🔹 UI PAGE COMPONENT
// =========================================================================
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

  const [{ towns, categories }, { businesses, events, recommendations, selectedTown, isFallbackSearch }] =
    await Promise.all([getFilterOptions(), getUnifiedSearchResults(initialParams)]);

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
          {selectedTown ? `Searching in ${selectedTown.name}` : 'Search CommunityShops'}
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* ADVANCED FILTER DRAWER COMPONENT */}
        <AdvancedSearch towns={towns} categories={categories} initialParams={initialParams} />

        {/* SMART FALLBACK NOTIFICATION BANNER */}
        {isFallbackSearch && selectedTown && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span>📍</span>
              <span>No direct match in {selectedTown.name}</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Showing matching shops from nearby communities across Nigeria instead:
            </p>
          </div>
        )}

        {/* 1. UPCOMING EVENTS SECTION */}
        {events.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
              <span>🎉</span> UPCOMING EVENTS & GATHERINGS ({events.length})
            </h2>

            <div className="space-y-2.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-emerald-900 text-white rounded-2xl p-4 shadow-xs space-y-2.5 border border-emerald-800"
                >
                  <div className="flex items-start justify-between">
                    <span className="bg-emerald-700 text-emerald-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-medium">{evt.town_name} Community</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{evt.title}</h3>
                    <p className="text-[11px] text-emerald-200 mt-0.5">
                      📍 {evt.venue} {evt.time_label ? `(${evt.time_label})` : ''}
                    </p>
                    {evt.organizer && (
                      <p className="text-[10px] text-emerald-300/80 mt-1">Organized by {evt.organizer}</p>
                    )}
                  </div>

                  {evt.whatsapp_contact && (
                    <div className="pt-2 border-t border-emerald-800/80 flex justify-end">
                      <a
                        href={`https://wa.me/${evt.whatsapp_contact}?text=${encodeURIComponent(
                          `Hello, I am inquiring about the ${evt.title} listed on CommunityShops.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition"
                      >
                        <span>💬 Contact Organizer</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. MATCHING SHOPS LIST */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center justify-between">
            <span>🏪 LOCAL SHOPS ({businesses.length})</span>
          </h2>

          <div className="space-y-3">
            {businesses.length > 0 ? (
              businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/biz/${biz.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:border-emerald-300 active:bg-slate-50 active:scale-[0.98] transition-all duration-150"
                >
                  <div className="flex gap-3">
                    <SafeImage
                      src={biz.image_url}
                      alt={biz.name}
                      className="h-20 w-20 rounded-xl shrink-0 border border-slate-100"
                      fill
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h3>
                          {biz.is_verified && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                              ✓
                            </span>
                          )}
                          {biz.distance_km !== undefined && (
                            <span className="bg-emerald-50 text-emerald-700 font-semibold text-[10px] px-2 py-0.5 rounded-full shrink-0 border border-emerald-200/60 ml-auto">
                              {parseFloat(biz.distance_km).toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          📍 {biz.address} ({biz.town_name})
                        </p>
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

                      <WhatsAppButton whatsappNumber={biz.whatsapp_number} businessName={biz.name} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              hasSearched && (
                <div className="bg-white rounded-2xl p-6 text-center space-y-2 border border-slate-200/80 shadow-xs">
                  <span className="text-3xl">🔍</span>
                  <h3 className="text-xs font-bold text-slate-800">No matching shops found</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Try broadening your search keywords or selecting &quot;All Communities & Towns&quot;.
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* 3. VIRAL TRENDING PRODUCT RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
              <span>🔥</span> POPULAR IN DEMAND ACROSS COMMUNITIES
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      Trending Item
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{rec.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">Sold by {rec.shop_name}</p>
                    {rec.price && <p className="text-xs font-extrabold text-emerald-700 mt-1">₦{rec.price}</p>}
                  </div>

                  {rec.whatsapp_number && (
                    <a
                      href={`https://wa.me/${rec.whatsapp_number}?text=${encodeURIComponent(
                        `Hello! I saw ${rec.name} recommended on CommunityShops and would like to buy.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] py-1 rounded-lg border border-emerald-200/60 transition"
                    >
                      Buy on WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}