'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RegisterEventPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [statesList, setStatesList] = useState([]);
  const [lgasList, setLgasList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'obituary',
    organizer: '',
    event_date: '',
    time_label: '',
    town_id: '',
    venue: '',
    description: '',
    whatsapp_contact: '',
    is_sponsored: false,
  });

  useEffect(() => {
    async function loadStates() {
      try {
        const res = await fetch('/api/directory/options');
        const data = await res.json();
        if (data.states) setStatesList(data.states);
      } catch (err) {
        console.error('Failed to load states', err);
      }
    }
    loadStates();
  }, []);

  const handleStateChange = async (st) => {
    setSelectedState(st);
    setSelectedLga('');
    setSelectedDistrict('');
    setLgasList([]);
    setDistrictsList([]);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!st) return;
    const res = await fetch(`/api/directory/options?state=${encodeURIComponent(st)}`);
    const data = await res.json();
    if (data.lgas) setLgasList(data.lgas);
  };

  const handleLgaChange = async (lga) => {
    setSelectedLga(lga);
    setSelectedDistrict('');
    setDistrictsList([]);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!lga) return;
    const res = await fetch(`/api/directory/options?state=${encodeURIComponent(selectedState)}&lga=${encodeURIComponent(lga)}`);
    const data = await res.json();
    if (data.districts) setDistrictsList(data.districts);
  };

  const handleDistrictChange = async (dist) => {
    setSelectedDistrict(dist);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!dist) return;
    const res = await fetch(`/api/directory/options?state=${encodeURIComponent(selectedState)}&lga=${encodeURIComponent(selectedLga)}&district=${encodeURIComponent(dist)}`);
    const data = await res.json();
    if (data.villages) setVillagesList(data.villages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.town_id) {
      alert('Please complete location selection.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(true);
      } else {
        alert(result.error || 'Failed to publish event.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800 pb-32">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg text-center space-y-4 border border-slate-200">
          <div className="text-4xl">🎉</div>
          <h2 className="text-lg font-bold text-slate-900">Event Published Successfully!</h2>
          <p className="text-xs text-slate-600">
            {formData.is_sponsored 
              ? 'Your sponsored announcement is submitted! Please complete your promotional sponsorship via WhatsApp to pin it to the very top.'
              : 'Your event is now live on CommunityShops for the community to see.'}
          </p>
          <Link href="/events" className="block w-full bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl transition">
            View Events Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800 pb-32">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">Publish Village Announcement</h1>
            <p className="text-[11px] text-slate-500">Post obituaries, weddings, meetings & festivals.</p>
          </div>
          <Link href="/events" className="text-xs font-bold text-emerald-700 underline">Events Hub</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event / Announcement Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Funeral Service of Late Chief Okeke or Ekwe Day"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Category *</label>
            <select
              required
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="obituary">🕊️ Obituary & Funeral Service</option>
              <option value="wedding">💍 Traditional Wedding / Celebration</option>
              <option value="meeting">🤝 Town Hall / Age-Grade Meeting</option>
              <option value="festival">🎉 Festival / Annual Celebration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Organizer / Family Name *</label>
            <input
              type="text"
              required
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              placeholder="e.g., Okeke Family of Umuduru Ekwe"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Label</label>
              <input
                type="text"
                value={formData.time_label}
                onChange={(e) => setFormData({ ...formData, time_label: e.target.value })}
                placeholder="10:00 AM Prompt"
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* LOCATION CASCADING DROPDOWNS */}
          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-800">Select Location *</label>
            <select
              required
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">-- 1. Select State --</option>
              {statesList.map((st) => <option key={st} value={st}>{st} State</option>)}
            </select>

            <select
              required
              disabled={!selectedState}
              value={selectedLga}
              onChange={(e) => handleLgaChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
            >
              <option value="">-- 2. Select LGA --</option>
              {lgasList.map((lga) => <option key={lga} value={lga}>{lga} LGA</option>)}
            </select>

            <select
              required
              disabled={!selectedLga}
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
            >
              <option value="">-- 3. Select Town / District --</option>
              {districtsList.map((dist) => <option key={dist} value={dist}>{dist}</option>)}
            </select>

            <select
              required
              disabled={!selectedDistrict}
              value={formData.town_id}
              onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-emerald-800 disabled:opacity-50"
            >
              <option value="">-- 4. Select Village / Settlement --</option>
              {villagesList.map((v) => <option key={v.id} value={v.id}>{v.name} {v.sub_locality ? `(${v.sub_locality})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Venue Description *</label>
            <input
              type="text"
              required
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g., St. Mary's Catholic Church Compound, Ekwe"
              className="w-full text-xs p-3 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Announcement / Obituary Details</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Share details about funeral rites, reception venue, visiting hours, or program schedule..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact WhatsApp Number *</label>
            <input
              type="tel"
              required
              value={formData.whatsapp_contact}
              onChange={(e) => setFormData({ ...formData, whatsapp_contact: e.target.value })}
              placeholder="2348030000000"
              className="w-full text-xs p-3 rounded-xl border border-slate-200"
            />
          </div>

          {/* SPONSORED BANNER CHECKBOX */}
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_sponsored}
                onChange={(e) => setFormData({ ...formData, is_sponsored: e.target.checked })}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold text-amber-900">⭐ Pin to Top (Sponsored Announcement)</span>
                <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">
                  Post for free, or pay a small promotional fee to pin your obituary or celebration banner to the very front of the homepage and events feed.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition mt-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Publishing Announcement...' : 'Publish Announcement Now'}
          </button>
        </form>
      </div>
    </div>
  );
}