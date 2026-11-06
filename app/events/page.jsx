export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';

async function getVillageEvents() {
  try {
    const res = await query(
      `SELECT e.id, e.title, e.event_type, e.organizer, e.event_date, e.time_label, e.venue, e.description, e.whatsapp_contact, e.is_sponsored, t.name as town_name, t.state
       FROM public.events e
       JOIN public.towns t ON e.town_id = t.id
       WHERE e.event_date >= CURRENT_DATE
       ORDER BY e.is_sponsored DESC, e.event_date ASC`
    );
    return res?.rows || [];
  } catch (error) {
    console.error('Error fetching village events:', error);
    return [];
  }
}

export async function generateMetadata() {
  return {
    title: 'Village Events & Community Announcements | CommunityShops',
    description: 'Find upcoming town hall meetings, age-grade ceremonies, market days, and festive events across villages in Nigeria.',
  };
}

export default async function EventsPage() {
  const events = await getVillageEvents();

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-32">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="text-xs font-bold text-slate-700 hover:text-emerald-600 transition flex items-center gap-1">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/events/register"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs transition"
          >
            + Publish Announcement
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Upcoming Community Gatherings & Obituaries</h2>
            <p className="text-xs text-slate-500">Stay updated on obituaries, weddings, meetings, and festivals this season.</p>
          </div>
        </div>

        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className={`block rounded-2xl border p-4 shadow-xs space-y-3 transition ${
                  evt.is_sponsored
                    ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                    evt.is_sponsored ? 'bg-amber-400 text-amber-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {evt.is_sponsored && (
                      <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
                        ⭐ Sponsored / Featured
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium">📍 {evt.town_name}, {evt.state}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{evt.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    VENUE: {evt.venue} {evt.time_label ? `(${evt.time_label})` : ''}
                  </p>
                </div>

                {evt.whatsapp_contact && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-lg ${
                      evt.is_sponsored ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <span>💬 Tap for Details & Contact</span>
                    </span>
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
              <span className="text-3xl">🎉</span>
              <h3 className="text-xs font-bold text-slate-800">No upcoming events listed right now</h3>
              <p className="text-xs text-slate-500">Be the first to publish a community meeting, wedding, or obituary announcement!</p>
              <div className="pt-2">
                <Link
                  href="/events/register"
                  className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                >
                  Publish Announcement
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}