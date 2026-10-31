import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

async function getSearchResults(searchQuery, townSlug) {
  if (!searchQuery && !townSlug) {
    return { businesses: [], town: null };
  }

  let town = null;
  if (townSlug) {
    const townRes = await query(
      'SELECT id, name, state, lga FROM towns WHERE slug = $1',
      [townSlug]
    );
    town = townRes.rows[0] || null;
  }

  const sql = `
    SELECT 
      b.id,
      b.name,
      b.slug,
      b.address,
      b.phone,
      b.whatsapp_number,
      b.image_url,
      b.is_verified,
      t.name as town_name,
      COALESCE(
        json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]'
      ) as products_sample
    FROM businesses b
    JOIN towns t ON b.town_id = t.id
    LEFT JOIN products p ON b.id = p.business_id
    WHERE b.status = 'active'
      ${town ? 'AND b.town_id = $2' : ''}
      AND (
        b.name ILIKE $1 
        OR b.address ILIKE $1 
        OR p.name ILIKE $1
      )
    GROUP BY b.id, t.name
    ORDER BY b.is_featured DESC, b.created_at DESC;
  `;

  const searchParam = `%${searchQuery}%`;
  const queryParams = town ? [searchParam, town.id] : [searchParam];

  const res = await query(sql, queryParams);

  return { businesses: res.rows, town };
}

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  return {
    title: q ? `Search results for "${q}" - Ekwe Biz Directory` : 'Search Shops & Goods',
  };
}

export default async function SearchPage(props) {
  const searchParams = await props.searchParams;
  const searchQuery = searchParams?.q || '';
  const townSlug = searchParams?.town || '';

  const { businesses, town } = await getSearchResults(searchQuery, townSlug);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="text-xs font-bold text-slate-700">
          ← Home
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          {town ? `Searching in ${town.name}` : 'All Regions Search'}
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* SEARCH INPUT FORM */}
        <form action="/search" method="GET" className="relative">
          {townSlug && <input type="hidden" name="town" value={townSlug} />}
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search rice, garri, beer, mechanics..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
          <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs">🔍</span>
        </form>

        {/* RESULTS SUMMARY */}
        <div className="text-xs text-slate-500">
          {searchQuery ? (
            <p>Found <strong>{businesses.length}</strong> matching shop(s) for &quot;{searchQuery}&quot;</p>
          ) : (
            <p>Enter a keyword above to search verified local inventory.</p>
          )}
        </div>

        {/* RESULTS LIST */}
        <div className="space-y-3">
          {businesses.length > 0 ? (
            businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/biz/${biz.slug}`}
                className="block bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-emerald-300 transition"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                   <Image
  src={biz.image_url || '/uploads/placeholder-shop.jpg'}
  alt={biz.name}
  fill
  sizes="64px"
  className="object-cover"
/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h2>
                      {biz.is_verified && <span className="text-emerald-600 text-[10px]">✓</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">📍 {biz.address} ({biz.town_name})</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {biz.products_sample?.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            searchQuery && (
              <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                No local shops found matching &quot;{searchQuery}&quot;.
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}