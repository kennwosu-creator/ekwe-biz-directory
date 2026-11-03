export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

async function getActiveTowns() {
  try {
    const res = await query(
      'SELECT id, name, slug, lga, state FROM public.towns WHERE is_active = true ORDER BY name ASC'
    );
    return res ? res.rows : [];
  } catch (error) {
    console.error('Error fetching towns on home page:', error);
    return [];
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
  const towns = await getActiveTowns();

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* BRAND BANNER HEADER */}
      <section className="bg-emerald-950 text-white shadow-md">
        {/* BRAND TITLE BAR */}
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

        {/* HERO IMAGE CONTAINER */}
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
        <div className="max-w-md mx-auto px-4 -mt-10 relative z-10 pb-6 text-center">
          <div className="bg-emerald-900/95 backdrop-blur-md border border-emerald-800 rounded-2xl p-4 shadow-lg space-y-3">
            <p className="text-xs text-emerald-100 leading-relaxed font-medium">
              Find verified shops, markets, and service providers directly in your village. Contact traders directly on WhatsApp!
            </p>

            {/* GLOBAL SEARCH FORM */}
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search rice, beer, garri, mechanics in your community..."
                className="w-full bg-white text-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
              />
              <span className="absolute left-3 top-3.5 text-slate-400 text-xs">🔍</span>
            </form>
          </div>
        </div>
      </section>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* EXPLORE COMMUNITIES & TOWNS */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            EXPLORE COMMUNITIES & TOWNS
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {towns.length > 0 ? (
              towns.map((town) => (
                <Link
                  key={town.id}
                  href={`/directory/${town.state.toLowerCase()}/${town.slug}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-emerald-500 transition active:scale-95 flex flex-col justify-between"
                >
                  <span className="text-xl mb-2">📍</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{town.name} Directory</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {town.lga} LGA, {town.state}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                Loading communities...
              </div>
            )}
          </div>
        </section>

        {/* PORTALS & TOOLS - CLEANED FOR GENERAL PUBLIC */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            PORTALS & TOOLS
          </h2>

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

        {/* DISCRETE FOOTER LINK FOR AGENTS */}
        <div className="text-center pt-2">
          <Link
            href="/agents"
            className="text-[11px] font-semibold text-slate-400 hover:text-emerald-700 transition"
          >
            Field Agent Hub →
          </Link>
        </div>
      </main>
    </div>
  );
}