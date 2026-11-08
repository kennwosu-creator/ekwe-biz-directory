'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPersonalPage() {
  const [profileType, setProfileType] = useState('Gentleman');
  const [age, setAge] = useState('35-45');
  const [religion, setReligion] = useState('Christian');
  const [religionPractice, setReligionPractice] = useState('Practising');
  const [bodyBuild, setBodyBuild] = useState('Athletic');
  const [interests, setInterests] = useState('');
  const [seeking, setSeeking] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper function to compress images down to under 500KB via canvas resizing
  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension constraints to keep file size small
        const MAX_DIM = 800;
        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality to ensure < 500KB
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoBase64(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formattedAd = `${bodyBuild} build, ${religionPractice} ${religion}, enjoys ${interests}. Seeking ${seeking}.`;

      const res = await fetch('/api/personals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_type: profileType,
          age,
          religion,
          religion_practice: religionPractice,
          body_build: bodyBuild,
          interests,
          seeking,
          contact_info: contactInfo,
          formatted_ad: formattedAd,
          photo_url: photoBase64
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Personal ad successfully published!');
        window.location.href = '/personals';
      } else {
        alert('Error publishing ad: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error submitting personal ad: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Link href="/personals" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Personals</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <span className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span>
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              Publish Personal Ad
            </h1>
            <p className="text-xs text-emerald-200">
              Select precise dropdown criteria for structured village classifieds.
            </p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Profile Type</label>
                <select
                  value={profileType}
                  onChange={e => setProfileType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Gentleman">Gentleman</option>
                  <option value="Lady">Lady</option>
                  <option value="Single Parent Gentleman">Single Parent Gentleman</option>
                  <option value="Single Parent Lady">Single Parent Lady</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Age Range</label>
                <select
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="20-25">20 - 25</option>
                  <option value="26-30">26 - 30</option>
                  <option value="31-35">31 - 35</option>
                  <option value="36-40">36 - 40</option>
                  <option value="41-45">41 - 45</option>
                  <option value="46-50">46 - 50</option>
                  <option value="50+">50+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Religion</label>
                <select
                  value={religion}
                  onChange={e => setReligion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Christian">Christian</option>
                  <option value="Catholic">Catholic</option>
                  <option value="Anglican">Anglican</option>
                  <option value="Methodist">Methodist</option>
                  <option value="Pentecostal">Pentecostal</option>
                  <option value="Islam">Islam</option>
                  <option value="Traditional">Traditional</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Practice Level</label>
                <select
                  value={religionPractice}
                  onChange={e => setReligionPractice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Practising">Practising</option>
                  <option value="Devoted">Devoted</option>
                  <option value="Moderate">Moderate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Body Build</label>
              <select
                value={bodyBuild}
                onChange={e => setBodyBuild(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Athletic">Athletic</option>
                <option value="Slim">Slim</option>
                <option value="Average">Average</option>
                <option value="Full Figured / Heavy">Full Figured / Heavy</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Interests & Hobbies</label>
              <input
                type="text"
                required
                value={interests}
                onChange={e => setInterests(e.target.value)}
                placeholder="e.g. community development, church fellowship, trading"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">What You Are Seeking</label>
              <input
                type="text"
                required
                value={seeking}
                onChange={e => setSeeking(e.target.value)}
                placeholder="e.g. sincere, family-oriented partner for marriage"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact Information (Phone / Gazette Box)</label>
              <input
                type="text"
                required
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                placeholder="e.g. Call 0803-555-1982 or Box 104"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Optional Photo (Auto-compressed &lt; 500KB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
              />
              {photoBase64 && <p className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Photo successfully compressed and attached.</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
            >
              {submitting ? 'Publishing Ad...' : 'Publish Classified Ad'}
            </button>
          </form>
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