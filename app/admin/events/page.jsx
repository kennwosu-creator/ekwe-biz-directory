'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const json = await res.json();
      if (json.success) setEvents(json.data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (id, is_sponsored) => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_sponsored: !is_sponsored }),
      });
      const json = await res.json();
      if (json.success) {
        setEvents(events.map(ev => ev.id === id ? { ...ev, is_sponsored: !is_sponsored } : ev));
      }
    } catch (err) {
      alert('Failed to update event status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setEvents(events.filter(ev => ev.id !== id));
      }
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="bg-slate-900 text-white px-4 py-4 shadow-md sticky top-0 z-30 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🎉 Event & Obituary Administration</h1>
          <p className="text-[11px] text-slate-400">Moderate and feature community events</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/businesses" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">
            Merchants
          </Link>
          <Link href="/admin/agents" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">
            Agents
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No community events or obituaries currently submitted.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{evt.title}</h2>
                    {evt.is_sponsored && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📅 {new Date(evt.event_date).toLocaleDateString()} | 📍 {evt.venue} ({evt.town_name})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeature(evt.id, evt.is_sponsored)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      evt.is_sponsored
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {evt.is_sponsored ? 'Unfeature' : '⭐ Feature'}
                  </button>
                  <button onClick={() => handleDelete(evt.id)} className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}