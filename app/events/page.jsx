export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';

async function getEvents() {
  try {
    const res = await query(`
      SELECT e.*, t.name AS town_name 
      FROM public.events e 
      JOIN public.towns t ON e.town_id = t.id 
      WHERE e.event_date >= CURRENT_DATE 
      ORDER BY e.is_sponsored DESC, e.event_date ASC
    `);
    return res.rows;
  } catch (err) {
    console.error('Error fetching events:', err);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Link href="/" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Home</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <span className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span>
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-3">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              Community Events & Obituaries
            </h1>
            <p className="text-xs text-emerald-200 font-medium">
              Upcoming village celebrations, meetings, and memorials across communities.
            </p>
            <div className="pt-2">
              <Link
                href="/events/register"
                className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                + Publish New Event
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              UPCOMING EVENTS ({events.length})
            </h2>
          </div>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/events/${evt.id}`}
                  className={`block rounded-2xl p-4 shadow-xs space-y-2 transition border ${
                    evt.is_sponsored 
                      ? 'bg-amber-950 text-amber-100 border-amber-500/80 hover:border-amber-400' 
                      : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      evt.is_sponsored ? 'bg-amber-400 text-amber-950' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      📅 {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {evt.is_sponsored && <span className="text-[10px] bg-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded">⭐ Featured</span>}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{evt.title}</h3>
                    <p className={`text-xs mt-1 ${evt.is_sponsored ? 'text-amber-200' : 'text-slate-500'}`}>
                      📍 {evt.venue} ({evt.town_name}) {evt.time_label ? `| ⏰ ${evt.time_label}` : ''}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No upcoming events published at this time.
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 space-y-3">
        <p>© {new Date().getFullYear()} CommunityShops. Connecting local village trade.</p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-slate-600">
          <Link href="/agents/portal" className="hover:text-emerald-600 transition">🎯 Field Agent Portal</Link>
          <span>•</span>
          <Link href="/admin/businesses" className="hover:text-emerald-600 transition">🛡️ Merchants Admin</Link>
          <span>•</span>
          <Link href="/admin/agents" className="hover:text-emerald-600 transition">🎯 Agents Admin</Link>
          <span>•</span>
          <Link href="/admin/events" className="hover:text-emerald-600 transition">🎉 Events Admin</Link>
          <span>•</span>
          <Link href="/personals" className="hover:text-emerald-600 transition">📜 Personals</Link>
        </div>
      </footer>
    </div>
  );
}