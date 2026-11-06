'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AgentOnboardPage() {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const [statesList, setStatesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [lgasList, setLgasList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    town_id: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp_number: '',
    pin: '',
    agent_code: '',
    image_url: '',
    products: [{ name: '', price: '' }],
  });

  useEffect(() => {
    async function loadInitialOptions() {
      try {
        const res = await fetch('/api/directory/options');
        const data = await res.json();
        if (data.states) setStatesList(data.states);
        if (data.categories) setCategoriesList(data.categories);
      } catch (err) {
        console.error('Failed to load initial options', err);
      }
    }
    loadInitialOptions();
  }, []);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Acquiring satellite lock...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
        setGpsStatus('✓ GPS Coordinates Captured Successfully!');
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsLoading(false);
        setGpsStatus('❌ Unable to retrieve location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleStateChange = async (stateVal) => {
    setSelectedState(stateVal);
    setSelectedLga('');
    setSelectedDistrict('');
    setLgasList([]);
    setDistrictsList([]);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!stateVal) return;

    setLoadingLgas(true);
    try {
      const res = await fetch(`/api/directory/options?state=${encodeURIComponent(stateVal)}`);
      const data = await res.json();
      if (data.lgas) setLgasList(data.lgas);
    } catch (err) {
      console.error('Failed to load LGAs', err);
    } finally {
      setLoadingLgas(false);
    }
  };

  const handleLgaChange = async (lgaVal) => {
    setSelectedLga(lgaVal);
    setSelectedDistrict('');
    setDistrictsList([]);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!lgaVal) return;

    setLoadingDistricts(true);
    try {
      const res = await fetch(
        `/api/directory/options?state=${encodeURIComponent(selectedState)}&lga=${encodeURIComponent(lgaVal)}`
      );
      const data = await res.json();
      if (data.districts) setDistrictsList(data.districts);
    } catch (err) {
      console.error('Failed to load districts', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtVal) => {
    setSelectedDistrict(districtVal);
    setVillagesList([]);
    setFormData((prev) => ({ ...prev, town_id: '' }));

    if (!districtVal) return;

    setLoadingVillages(true);
    try {
      const res = await fetch(
        `/api/directory/options?state=${encodeURIComponent(selectedState)}&lga=${encodeURIComponent(selectedLga)}&district=${encodeURIComponent(districtVal)}`
      );
      const data = await res.json();
      if (data.villages) setVillagesList(data.villages);
    } catch (err) {
      console.error('Failed to load villages', err);
    } finally {
      setLoadingVillages(false);
    }
  };

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
    if (!formData.category_id || !formData.town_id) {
      alert('Please complete all required category and location fields.');
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
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg text-center space-y-4 border border-slate-200">
          <div className="text-4xl">🌟</div>
          <h2 className="text-lg font-bold text-slate-900">Agent Onboarding Successful!</h2>
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{formData.name}</span> registered successfully under agent code <span className="font-mono text-emerald-700">{formData.agent_code || 'N/A'}</span>.
          </p>
          <Link
            href="/agent/dashboard"
            className="block w-full bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl transition"
          >
            Return to Agent Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 pb-32 px-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">Agent Onboarding Portal</h1>
            <p className="text-[11px] text-slate-500">Register village merchants on-site.</p>
          </div>
          <Link href="/agents" className="text-xs font-bold text-emerald-700 underline">Agent Hub</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business / Shop Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Ada Palm Wine & Pepper Soup"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Village Business Category *</label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">-- Select Village Category --</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

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
              disabled={!selectedState || loadingLgas}
              value={selectedLga}
              onChange={(e) => handleLgaChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
            >
              <option value="">{loadingLgas ? 'Loading...' : '-- 2. Select LGA --'}</option>
              {lgasList.map((lga) => <option key={lga} value={lga}>{lga} LGA</option>)}
            </select>

            <select
              required
              disabled={!selectedLga || loadingDistricts}
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
            >
              <option value="">{loadingDistricts ? 'Loading...' : '-- 3. Select Town / District --'}</option>
              {districtsList.map((dist) => <option key={dist} value={dist}>{dist}</option>)}
            </select>

            <select
              required
              disabled={!selectedDistrict || loadingVillages}
              value={formData.town_id}
              onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-emerald-800 disabled:opacity-50"
            >
              <option value="">{loadingVillages ? 'Loading...' : '-- 4. Select Village / Settlement --'}</option>
              {villagesList.map((v) => <option key={v.id} value={v.id}>{v.name} {v.sub_locality ? `(${v.sub_locality})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address / Landmark *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., Beside Village Square Tree"
              className="w-full text-xs p-3 rounded-xl border border-slate-200"
            />
          </div>

          {/* GPS CAPTURE FOR AGENTS */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">📌 Kiosk GPS Capture</span>
              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={gpsLoading}
                className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg"
              >
                {gpsLoading ? 'Locating...' : 'Get GPS Pin'}
              </button>
            </div>
            {gpsStatus && <p className="text-[10px] text-emerald-800">{gpsStatus}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08030000000"
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp *</label>
              <input
                type="tel"
                required
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="2348030000000"
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit PIN *</label>
              <input
                type="password"
                maxLength={4}
                required
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="1234"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 text-center tracking-widest font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Agent Code *</label>
              <input
                type="text"
                required
                value={formData.agent_code}
                onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                placeholder="AG-101"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Submitting Registration...' : 'Complete Agent Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}