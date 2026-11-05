'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function RegisterShopPage() {
  const [allTowns, setAllTowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // 4-Tier Cascading location state
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    town_id: '',
    address: '',
    phone: '',
    whatsapp_number: '',
    pin: '',
    agent_code: '',
    image_url: '',
    products: [{ name: '', price: '' }],
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch('/api/directory/options');
        const data = await res.json();
        if (data.towns) setAllTowns(data.towns);
        if (data.categories) setCategories(data.categories);
      } catch (err) {
        console.error('Failed to load options', err);
      }
    }
    loadOptions();
  }, []);

  // 1. Compute unique States
  const statesList = useMemo(() => {
    const set = new Set(allTowns.map((t) => t.state).filter(Boolean));
    return Array.from(set).sort();
  }, [allTowns]);

  // 2. Compute unique LGAs for chosen State
  const lgasList = useMemo(() => {
    if (!selectedState) return [];
    const set = new Set(
      allTowns
        .filter((t) => t.state === selectedState)
        .map((t) => t.lga)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [allTowns, selectedState]);

  // 3. Compute unique Major Towns / Districts for chosen State & LGA
  const districtsList = useMemo(() => {
    if (!selectedState || !selectedLga) return [];
    const set = new Set(
      allTowns
        .filter((t) => t.state === selectedState && t.lga === selectedLga)
        .map((t) => t.district || t.name)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [allTowns, selectedState, selectedLga]);

  // 4. Compute Villages / Settlements for chosen District
  const villagesList = useMemo(() => {
    if (!selectedState || !selectedLga || !selectedDistrict) return [];
    return allTowns.filter(
      (t) =>
        t.state === selectedState &&
        t.lga === selectedLga &&
        (t.district === selectedDistrict || (!t.district && t.name === selectedDistrict))
    );
  }, [allTowns, selectedState, selectedLga, selectedDistrict]);

  const handleProductChange = (index, field, value) => {
    const updated = [...formData.products];
    updated[index][field] = value;
    setFormData({ ...formData, products: updated });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { name: '', price: '' }],
    });
  };

  const removeProductRow = (index) => {
    if (formData.products.length === 1) return;
    const updated = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.town_id) {
      alert('Please complete all location selections (State, LGA, District, and Village).');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessData(result);
      } else {
        alert(result.error || 'Failed to register shop.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const waText = encodeURIComponent(
      `Hello! I just registered my business "${formData.name}" on CommunityShops.\nStore Link: /biz/${successData.slug}`
    );

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg text-center space-y-4 border border-slate-200">
          <div className="text-4xl">🎉</div>
          <h2 className="text-lg font-bold text-slate-900">Shop Registered Successfully!</h2>
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{formData.name}</span> is live on CommunityShops.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
            <p><span className="font-semibold text-slate-500">Store URL:</span> /biz/{successData.slug}</p>
            <p><span className="font-semibold text-slate-500">Security PIN:</span> {formData.pin}</p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`https://wa.me/14165261826?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition"
            >
              💬 Send Confirmation via WhatsApp
            </a>

            <Link
              href={`/biz/${successData.slug}`}
              className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition"
            >
              View Shop Live
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Register Your Business</h1>
          <p className="text-xs text-slate-500">Join CommunityShops directory in under 2 minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Shop Information</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business / Shop Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chief Okeke Cassava & Grain Store"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 4-TIER LOCATION CASCADING DROPDOWNS */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800">
                Select Location (State / LGA / District / Village) *
              </label>

              {/* 1. State Select */}
              <select
                required
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedLga('');
                  setSelectedDistrict('');
                  setFormData({ ...formData, town_id: '' });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">-- 1. Select State --</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st} State
                  </option>
                ))}
              </select>

              {/* 2. LGA Select */}
              <select
                required
                disabled={!selectedState}
                value={selectedLga}
                onChange={(e) => {
                  setSelectedLga(e.target.value);
                  setSelectedDistrict('');
                  setFormData({ ...formData, town_id: '' });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium disabled:opacity-50"
              >
                <option value="">-- 2. Select Local Govt (LGA) --</option>
                {lgasList.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga} LGA
                  </option>
                ))}
              </select>

              {/* 3. Major District / Town Select */}
              <select
                required
                disabled={!selectedLga}
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setFormData({ ...formData, town_id: '' });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 disabled:opacity-50"
              >
                <option value="">-- 3. Select Major Town / District --</option>
                {districtsList.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>

              {/* 4. Village / Settlement Select */}
              <select
                required
                disabled={!selectedDistrict}
                value={formData.town_id}
                onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-800 disabled:opacity-50"
              >
                <option value="">-- 4. Select Village / Settlement --</option>
                {villagesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Market Road, Opposite Civic Center"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08030000000"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp No. *</label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="2348030000000"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit Security PIN *</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="1234"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-center tracking-widest font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agent Code (Optional)</label>
                <input
                  type="text"
                  value={formData.agent_code}
                  onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                  placeholder="AG-101"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Add Initial Products</h3>
              <button
                type="button"
                onClick={addProductRow}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add Another Product
              </button>
            </div>

            {formData.products.map((prod, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder={`Product #${idx + 1} Name`}
                  value={prod.name}
                  onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Price (₦)"
                  value={prod.price}
                  onChange={(e) => handleProductChange(idx, 'price', e.target.value)}
                  className="w-24 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                {formData.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductRow(idx)}
                    className="text-red-500 text-xs px-1 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-sm mt-4"
          >
            {loading ? 'Registering Store...' : 'Complete Shop Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}