export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import GpsShareWidget from '@/components/GpsShareWidget';

async function getHomePageData() {
  try {
    const activeTownsRes = await query(
      `SELECT 
         t.id, 
         t.name, 
         t.slug, 
         t.lga, 
         t.state, 
         t.district, 
         t.sub_locality,
         COUNT(b.id)::int AS shop_count
       FROM public.towns t
       JOIN public.businesses b ON b.town_id = t.id
       WHERE t.is_active = true 
         AND (b.status::text ILIKE 'active' OR b.status IS NULL)
       GROUP BY t.id, t.name, t.slug, t.lga, t.state, t.district, t.sub_locality
       ORDER BY 
         CASE WHEN LOWER(t.district) = 'ekwe' OR LOWER(t.name) = 'ekwe' THEN 0 ELSE 1 END,
         shop_count DESC, 
         t.name ASC
       LIMIT 12`
    );

    let towns = [];
    if (activeTownsRes.rows.length > 0) {
      towns = activeTownsRes.rows;
    } else {
      const fallbackRes = await query(
        `SELECT id, name, slug, lga, state, district, sub_locality, 0 AS shop_count
         FROM public.towns
         WHERE is_active = true 
           AND (
             LOWER(name) = 'ekwe' 
             OR LOWER(district) = 'ekwe' 
             OR LOWER(name) IN ('umudibi', 'owerri', 'orlu', 'okigwe')
           )
           AND (sub_locality IS NULL OR sub_locality = '' OR LOWER(sub_locality) LIKE '%central%')
         ORDER BY 
           CASE WHEN LOWER(name) = 'ekwe' OR LOWER(district) = 'ekwe' THEN 0 ELSE 1 END,
           name ASC
         LIMIT 12`
      );
      towns = fallbackRes.rows;
    }

    const categoriesRes = await query(
      'SELECT id, name, icon_name FROM public.categories ORDER BY name ASC'
    );

    // Prioritize sponsored events to the top
    const eventsRes = await query(
      `SELECT e.id, e.title, e.event_type, e.event_date, e.venue, e.time_label, e.whatsapp_contact, e.is_sponsored, t.name AS town_name
       FROM public.events e
       JOIN public.towns t ON e.town_id = t.id
       WHERE e.event_date >= CURRENT_DATE
       ORDER BY e.is_sponsored DESC, e.event_date ASC
       LIMIT 2`
    );

    return {
      towns,
      categories: categoriesRes?.rows || [],
      events: eventsRes?.rows || [],
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return { towns: [], categories: [], events: [] };
  }
}

export async function generateMetadata() {
  return {
    title: 'CommunityShops - Local Village & Market Directory Across Nigeria',
    description:
      'Find verified local shops, markets, and services across Ekwe, Owerri, Imo State, and communities across Nigeria.',
  };
}

export default async function HomePage() {
  const { towns, categories, events } = await getHomePageData();

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-32">
      {/* BRAND BANNER HEADER */}
      <section className="bg-emerald-950 text-white shadow-md">
        <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2">
            <span className="text-xl">🏪</span>
            <h1 className="text-base font-extrabold tracking-tight">
              Community<span className="text-emerald-400">Shops</span>
            </h1>
          </div>
          <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold mt-0.5">
            YOUR VILLAGE & LOCAL MARKET DIRECTORY
          </p>
        </div>

        <div className="relative w-full h-56 md:h-64 bg-emerald-950 overflow-hidden">
          <Image
            src="/images/village-kiosk.jpg"
            alt="Vibrant village market kiosk"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />
        </div>

        {/* FLOATING TAGLINE & SEARCH CARD */}
        <div className="max-w-md mx-auto px-4 -mt-10 relative z-10 pb-6 text-center space-y-3">
          <div className="bg-emerald-900/95 backdrop-blur-md border border-emerald-800 rounded-2xl p-4 shadow-lg space-y-3">
            <p className="text-xs text-emerald-100 leading-relaxed font-medium">
              Find verified shops, markets, and service providers directly in your village. Contact traders directly on WhatsApp!
            </p>

            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search chemist, garri, bukka, POS in your community..."
                className="w-full bg-white text-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
              />
              <span className="absolute left-3 top-3.5 text-slate-400 text-xs">🔍</span>
            </form>
          </div>

          <GpsShareWidget />
        </div>
      </section>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* VILLAGE CATEGORIES QUICK-BROWSE BAR */}
        {categories.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              BROWSE VILLAGE TRADES
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  className="bg-white border border-slate-200/90 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold px-3.5 py-2 rounded-xl whitespace-nowrap shadow-2xs transition active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <span>🛍️</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 1. ACTIVE COMMUNITIES & TOWNS (DIRECTORIES FIRST) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              ACTIVE COMMUNITIES & TOWNS
            </h2>
            <Link
              href="/register"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              + Register Shop
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {towns.length > 0 ? (
              towns.map((town) => (
                <Link
                  key={town.id}
                  href={`/directory/${town.state.toLowerCase()}/${town.slug}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-emerald-500 transition active:scale-95 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">📍</span>
                    {town.shop_count > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {town.shop_count} {town.shop_count === 1 ? 'Shop' : 'Shops'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {town.sub_locality ? `${town.sub_locality} (${town.name})` : `${town.name} Directory`}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {town.lga} LGA, {town.state}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                Loading active communities...
              </div>
            )}
          </div>
        </section>

        {/* 2. SIDE-BY-SIDE 2-COLUMN EVENTS & OBITUARIES SECTION */}
        {events.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                🎉 UPCOMING EVENTS & OBITUARIES
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/events/register" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">
                  + Publish
                </Link>
                <Link href="/events" className="text-[11px] font-bold text-slate-400 hover:underline">
                  View All →
                </Link>
              </div>
            </div>

            {/* SIDE-BY-SIDE GRID LAYOUT */}
            <div className="grid grid-cols-2 gap-2">
              {events.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/events/${evt.id}`}
                  className={`rounded-2xl p-3 shadow-xs space-y-1.5 transition border flex flex-col justify-between ${
                    evt.is_sponsored 
                      ? 'bg-amber-950 text-amber-100 border-amber-500/80 hover:border-amber-400 shadow-sm' 
                      : 'bg-emerald-900 text-white border-emerald-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      evt.is_sponsored ? 'bg-amber-400 text-amber-950' : 'bg-emerald-700 text-emerald-100'
                    }`}>
                      {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {evt.is_sponsored ? (
                      <span className="bg-amber-500/30 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded">⭐ Featured</span>
                    ) : (
                      <span className="text-[9px] text-emerald-300 font-medium truncate max-w-[70px]">📍 {evt.town_name}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold truncate">{evt.title}</h3>
                    <p className={`text-[10px] truncate mt-0.5 ${evt.is_sponsored ? 'text-amber-200' : 'text-emerald-200'}`}>
                      {evt.venue}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PORTALS & TOOLS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              PORTALS & TOOLS
            </h2>
            <Link
              href="/agents"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              Field Agent Hub →
            </Link>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/manage"
              className="block bg-white border border-slate-200/90 text-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-400 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🔑</span> Shop Owner Web Portal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Edit shop profile & inventory with 4-digit PIN
                  </p>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            </Link>

            <Link
              href="/admin/businesses"
              className="block bg-white border border-slate-200/90 text-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-400 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🛡️</span> Admin Moderation Portal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Approve, verify, feature, or suspend shops
                  </p>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}