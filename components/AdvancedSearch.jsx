'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdvancedSearch({ towns = [], categories = [], initialParams = {} }) {
  const router = useRouter();

  // Auto-open filter drawer if active filters exist in initialParams
  const hasInitialFilters = Boolean(
    initialParams.town || initialParams.category || (initialParams.lat && initialParams.lng)
  );

  const [isOpen, setIsOpen] = useState(hasInitialFilters);
  const [useGps, setUseGps] = useState(Boolean(initialParams.lat && initialParams.lng));
  const [userLocation, setUserLocation] = useState(
    initialParams.lat && initialParams.lng
      ? { lat: parseFloat(initialParams.lat), lng: parseFloat(initialParams.lng) }
      : null
  );
  const [locating, setLocating] = useState(false);

  // Form State
  const [queryStr, setQueryStr] = useState(initialParams.q || '');
  const [selectedTown, setSelectedTown] = useState(initialParams.town || '');
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category || '');
  const [radiusKm, setRadiusKm] = useState(initialParams.radius || 5);

  // Handle browser GPS geolocation capture
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setUseGps(true);
        setLocating(false);
      },
      (err) => {
        console.error(err);
        alert('Unable to retrieve location. Please enable location permissions.');
        setLocating(false);
      }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (queryStr.trim()) params.set('q', queryStr.trim());
    if (selectedTown) params.set('town', selectedTown);
    if (selectedCategory) params.set('category', selectedCategory);

    if (useGps && userLocation) {
      params.set('lat', userLocation.lat);
      params.set('lng', userLocation.lng);
      params.set('radius', radiusKm);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 text-xs font-sans">
      {/* BASIC SEARCH BAR */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={queryStr}
            onChange={(e) => setQueryStr(e.target.value)}
            placeholder="Search items or shops (e.g., beer, cold drinks, mechanic)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-24 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
          <span className="absolute left-3 text-slate-400">🔍</span>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <span>⚙️ Filters</span>
            <span>{isOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* EXPANDABLE ADVANCED FILTER DRAWER */}
        {isOpen && (
          <div className="pt-3 border-t border-slate-100 space-y-4 animate-fadeIn">
            {/* VILLAGE / TOWN / MARKET SELECTION DROPDOWN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                📍 Filter by Village / Community / Market
              </label>
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Communities & Towns</option>
                {towns.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name} ({t.lga} LGA)
                  </option>
                ))}
              </select>
            </div>

            {/* PRODUCT CATEGORY DROPDOWN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                🏷️ Product Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PROXIMITY RADIUS SEARCH (GPS) */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  📡 Search Nearby Shops (Radius)
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {locating ? 'Locating...' : useGps ? '✓ Location Active' : 'Use My GPS'}
                </button>
              </div>

              {useGps && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] text-emerald-800 font-medium">
                    <span>Distance Range:</span>
                    <span className="font-bold">{radiusKm} KM</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15"
                    step="0.5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-emerald-600">
                    <span>500m (Walking)</span>
                    <span>5 KM</span>
                    <span>15 KM (Community Boundary)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs text-xs cursor-pointer"
        >
          Apply Filters & Search
        </button>
      </form>
    </div>
  );
}