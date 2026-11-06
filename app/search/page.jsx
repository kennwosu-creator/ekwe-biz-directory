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
// 🔹 SCHEMA-COMPLIANT UNIFIED SEARCH BACKEND (GROUP BY ORDER BY FIXED)
// =========================================================================
async function getSearchResults(params) {
  const { q, town: townSlug, category: categoryId } = params;

  try {
    // 1. Resolve selected town by slug if provided
    let selectedTown = null;
    if (townSlug && townSlug.trim()) {
      const townRes = await query(
        'SELECT id, name, slug, state, lga FROM public.towns WHERE LOWER(TRIM(slug)) = LOWER(TRIM($1)) LIMIT 1',
        [townSlug.trim()]
      );
      selectedTown = townRes?.rows?.[0] || null;
    }

    // 2. SEARCH MATCHING PRODUCTS
    let productSql = `
      SELECT 
        p.id,
        p.name AS product_name,
        p.price,
        p.in_stock,
        b.id AS business_id,
        b.name AS shop_name,
        b.slug AS shop_slug,
        b.address,
        b.phone,
        b.whatsapp_number,
        b.image_url,
        b.is_verified,
        t.name AS town_name,
        t.district AS town_district,
        t.sub_locality AS town_sub_locality
      FROM public.products p
      JOIN public.businesses b ON p.business_id = b.id
      JOIN public.towns t ON b.town_id = t.id
      WHERE (b.status::text ILIKE 'active' OR b.status IS NULL)
    `;

    const productParams = [];
    let pIdx = 1;

    if (q && q.trim()) {
      productSql += ` AND (p.name ILIKE $${pIdx} OR b.name ILIKE $${pIdx} OR b.address ILIKE $${pIdx})`;
      productParams.push(`%${q.trim()}%`);
      pIdx++;
    }

    if (selectedTown) {
      productSql += ` AND b.town_id = $${pIdx}`;
      productParams.push(selectedTown.id);
      pIdx++;
    }

    if (categoryId && categoryId.trim()) {
      productSql += ` AND p.category_id = $${pIdx}::uuid`;
      productParams.push(categoryId.trim());
      pIdx++;
    }

    productSql += ` ORDER BY p.created_at DESC LIMIT 30;`;
    let productRes = await query(productSql, productParams);
    let products = productRes?.rows || [];
    let isFallbackSearch = false;

    // 3. SMART FALLBACK: If zero matches in selected town, search across ALL towns
    if (products.length === 0 && selectedTown && (q || categoryId)) {
      let fallbackSql = `
        SELECT 
          p.id,
          p.name AS product_name,
          p.price,
          p.in_stock,
          b.id AS business_id,
          b.name AS shop_name,
          b.slug AS shop_slug,
          b.address,
          b.phone,
          b.whatsapp_number,
          b.image_url,
          b.is_verified,
          t.name AS town_name,
          t.sub_locality AS town_sub_locality
        FROM public.products p
        JOIN public.businesses b ON p.business_id = b.id
        JOIN public.towns t ON b.town_id = t.id
        WHERE (b.status::text ILIKE 'active' OR b.status IS NULL)
      `;
      let fallbackParams = [];
      let fIdx = 1;

      if (q && q.trim()) {
        fallbackSql += ` AND (p.name ILIKE $${fIdx} OR b.name ILIKE $${fIdx} OR b.address ILIKE $${fIdx})`;
        fallbackParams.push(`%${q.trim()}%`);
        fIdx++;
      }

      if (categoryId && categoryId.trim()) {
        fallbackSql += ` AND p.category_id = $${fIdx}::uuid`;
        fallbackParams.push(categoryId.trim());
        fIdx++;
      }

      fallbackSql += ` ORDER BY p.created_at DESC LIMIT 30;`;
      let fallbackRes = await query(fallbackSql, fallbackParams);
      if (fallbackRes && fallbackRes.rows.length > 0) {
        products = fallbackRes.rows;
        isFallbackSearch = true;
      }
    }

    // 4. SEARCH MATCHING SHOPS DIRECTLY (GROUP BY instead of DISTINCT)
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
        t.name AS town_name,
        t.district AS town_district,
        t.sub_locality AS town_sub_locality
      FROM public.businesses b
      JOIN public.towns t ON b.town_id = t.id
    `;

    if (categoryId && categoryId.trim()) {
      bizSql += ` JOIN public.products p ON p.business_id = b.id `;
    }

    bizSql += ` WHERE (b.status::text ILIKE 'active' OR b.status IS NULL) `;

    const bizParams = [];
    let bIdx = 1;

    if (q && q.trim()) {
      bizSql += ` AND (b.name ILIKE $${bIdx} OR b.address ILIKE $${bIdx})`;
      bizParams.push(`%${q.trim()}%`);
      bIdx++;
    }

    if (selectedTown && !isFallbackSearch) {
      bizSql += ` AND b.town_id = $${bIdx}`;
      bizParams.push(selectedTown.id);
      bIdx++;
    }

    if (categoryId && categoryId.trim()) {
      bizSql += ` AND p.category_id = $${bIdx}::uuid`;
      bizParams.push(categoryId.trim());
      bIdx++;
    }

    bizSql += ` 
      GROUP BY b.id, t.name, t.district, t.sub_locality
      ORDER BY MAX(b.is_featured::int) DESC, MAX(b.created_at) DESC 
      LIMIT 20;
    `;
    const bizRes = await query(bizSql, bizParams);

    // 5. SEARCH UPCOMING EVENTS
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

    return {
      products,
      businesses: bizRes?.rows || [],
      events: eventRes?.rows || [],
      selectedTown,
      isFallbackSearch,
    };
  } catch (error) {
    console.error('[Search Query Error]:', error);
    return { products: [], businesses: [], events: [], selectedTown: null, isFallbackSearch: false };
  }
}

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  return {
    title: q ? `Search "${q}" | CommunityShops` : 'Search Products & Shops | CommunityShops',
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
  };

  const [{ towns, categories }, { products, businesses, events, selectedTown, isFallbackSearch }] =
    await Promise.all([getFilterOptions(), getSearchResults(initialParams)]);

  const hasSearched = Boolean(initialParams.q || initialParams.town || initialParams.category);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-32">
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
              Showing matching items from nearby communities across Nigeria instead:
            </p>
          </div>
        )}

        {/* 1. UPCOMING EVENTS SECTION */}
        {events.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
              <span>🎉</span> UPCOMING EVENTS ({events.length})
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
                    <span className="text-[10px] text-emerald-300 font-medium">{evt.town_name}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{evt.title}</h3>
                    <p className="text-[11px] text-emerald-200 mt-0.5">
                      📍 {evt.venue} {evt.time_label ? `(${evt.time_label})` : ''}
                    </p>
                  </div>

                  {evt.whatsapp_contact && (
                    <div className="pt-2 border-t border-emerald-800/80 flex justify-end">
                      <a
                        href={`https://wa.me/${evt.whatsapp_contact}?text=${encodeURIComponent(
                          `Hello, I am inquiring about ${evt.title} listed on CommunityShops.`
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

        {/* 2. MATCHING PRODUCTS SECTION */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center justify-between">
            <span>🛒 MATCHING PRODUCTS ({products.length})</span>
          </h2>

          <div className="space-y-3">
            {products.length > 0 ? (
              products.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex gap-3 hover:border-emerald-300 transition"
                >
                  <SafeImage
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-20 w-20 rounded-xl shrink-0 border border-slate-100 object-cover"
                    fill
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h3>
                        {item.price && (
                          <span className="text-xs font-extrabold text-emerald-700">₦{Number(item.price).toLocaleString()}</span>
                        )}
                      </div>

                      {/* Product Card Location Line */}
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Sold by{' '}
                        <Link href={`/biz/${item.shop_slug}`} className="font-semibold text-slate-700 underline">
                          {item.shop_name}
                        </Link>{' '}
                        ({item.town_sub_locality ? `${item.town_sub_locality}, ` : ''}{item.town_name})
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <Link
                        href={`/biz/${item.shop_slug}`}
                        className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                      >
                        View Shop
                      </Link>

                      {item.whatsapp_number && (
                        <a
                          href={`https://wa.me/${item.whatsapp_number}?text=${encodeURIComponent(
                            `Hello! I want to buy ${item.product_name} listed on CommunityShops.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition"
                        >
                          <span>💬 Buy on WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              businesses.length === 0 &&
              hasSearched && (
                <div className="bg-white rounded-2xl p-6 text-center space-y-2 border border-slate-200/80 shadow-xs">
                  <span className="text-3xl">🔍</span>
                  <h3 className="text-xs font-bold text-slate-800">No matching products or shops found</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Try searching for items like &quot;Cassava&quot;, &quot;Garri&quot;, or selecting &quot;All Communities & Towns&quot;.
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* 3. MATCHING SHOPS SECTION */}
        {businesses.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              <span>🏪 LOCAL SHOPS ({businesses.length})</span>
            </h2>

            <div className="space-y-2.5">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/biz/${biz.slug}`}
                  className="block bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900">{biz.name}</h4>
                        {biz.is_verified && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        📍 {biz.address} ({biz.town_sub_locality ? `${biz.town_sub_locality}, ` : ''}{biz.town_name})
                      </p>
                    </div>
                    <WhatsAppButton whatsappNumber={biz.whatsapp_number} businessName={biz.name} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}