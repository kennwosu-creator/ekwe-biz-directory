export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';

async function getEventDetails(eventId) {
  try {
    const res = await query(
      `SELECT e.*, t.name AS town_name, t.state, t.lga 
       FROM public.events e
       JOIN public.towns t ON e.town_id = t.id
       WHERE e.id = $1`,
      [eventId]
    );
    return res?.rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching event details:', error);
    return null;
  }
}

export async function generateMetadata(props) {
  const params = await props.params;
  const event = await getEventDetails(params.id);
  return {
    title: event ? `${event.title} | CommunityShops Events` : 'Event Details | CommunityShops',
    description: event?.description || 'Community event details and schedule.',
  };
}

export default async function EventDetailPage(props) {
  const params = await props.params;
  const event = await getEventDetails(params.id);

  if (!event) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-sm text-center space-y-3 border border-slate-200">
          <span className="text-4xl">📅</span>
          <h2 className="text-base font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500">This event may have passed or been removed.</p>
          <Link href="/events" className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
            ← Back to Events Hub
          </Link>
        </div>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Hello! I am contacting you regarding the event "${event.title}" listed on CommunityShops.`
  );

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/events" className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1">
          <span>←</span> <span>All Events</span>
        </Link>
        <h1 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{event.title}</h1>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full">
              {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs font-medium text-slate-500">📍 {event.town_name}, {event.state}</span>
          </div>

          <div>
            <h1 className="text-base font-extrabold text-slate-900">{event.title}</h1>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              🕒 Time: {event.time_label || 'Time not specified'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
            <p className="font-bold text-slate-700">Venue / Location:</p>
            <p className="text-slate-600">{event.venue}</p>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-700">About This Event:</p>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.description || 'No additional description provided.'}</p>
          </div>

          {event.organizer && (
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-700">Organizer:</span> {event.organizer}
            </div>
          )}

          {event.whatsapp_contact && (
            <div className="pt-2">
              <a
                href={`https://wa.me/${event.whatsapp_contact}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-sm"
              >
                💬 Contact Organizer on WhatsApp
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}