'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link href="/" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Home</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <h1 className="text-sm font-extrabold tracking-tight">Events Moderation Hub</h1>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h2 className="text-xl font-black uppercase tracking-wider">Manage Community Events & Obituaries</h2>
            <p className="text-xs text-emerald-200 mt-1">Review, feature, or remove upcoming village celebrations and obituaries.</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Events ({events.length})</h3>
            <Link href="/events/register" className="bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm">+ Publish New Event</Link>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map(evt => (
                <div key={evt.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      {evt.is_sponsored && <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded">Featured</span>}
                    </div>
                    <p className="text-[11px] text-slate-500">📅 {new Date(evt.event_date).toLocaleDateString()} | 📍 {evt.venue} ({evt.time_label || 'All Day'})</p>
                  </div>
                  <button onClick={() => handleDelete(evt.id)} className="text-[11px] font-bold text-red-600 hover:text-red-800 px-3 py-1 bg-red-50 rounded-lg">Delete</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">No events found.</div>
          )}
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