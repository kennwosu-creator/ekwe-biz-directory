'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Helper function to resize and compress images client-side before upload
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as lightweight compressed JPEG base64 string
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export default function RegisterShopPage() {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Image compression UI state
  const [imagePreview, setImagePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Dynamic dropdown lists loaded step-by-step
  const [statesList, setStatesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [lgasList, setLgasList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  // Cascading dropdown loading indicators
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Cascading location selection state
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

  // Fetch States & Categories on component mount
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

  // Capture GPS Location helper
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
        setGpsStatus('❌ Unable to retrieve location. Please check device permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle image upload with compression
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      // Automatically constrain dimensions to max 800x800 and compress to 70% quality JPEG
      const compressedBase64 = await compressImage(file, 800, 800, 0.7);
      setImagePreview(compressedBase64);
      setFormData((prev) => ({ ...prev, image_url: compressedBase64 }));
    } catch (err) {
      console.error('Image compression error:', err);
      alert('Failed to process image. Please try another photo.');
    } finally {
      setCompressing(false);
    }
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
    if (!formData.category_id) {
      alert('Please select a business category.');
      return;
    }
    if (!formData.town_id) {
      alert('Please complete all location selections (State, LGA, District, and Village/Kindred).');
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
            <span className="font-bold text-slate-800">{formData.name}</span> is live on CommunityShops with optimized image assets.
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
    <div className="min-h-screen bg-slate-100 py-8 pb-32 px-4 font-sans text-slate-800">
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
                placeholder="e.g., Chief Okeke Chemist & Provision"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Village Business Category *</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              >
                <option value="">-- Select Village Trade / Category --</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SHOP PHOTO UPLOAD & CLIENT-SIDE RESIZING SECTION */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800">Shop / Kiosk Photo (Optional)</label>
              <p className="text-[10px] text-slate-500">Photos are automatically optimized and compressed to ensure fast mobile loading.</p>
              
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <img src={imagePreview} alt="Shop preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-medium shrink-0">
                    📸 No Photo
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={compressing}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {compressing && <p className="text-[10px] text-emerald-600 font-medium mt-1">Compressing image...</p>}
                </div>
              </div>
            </div>

            {/* LOCATION CASCADING DROPDOWNS */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800">
                Select Location (State / LGA / District / Village) *
              </label>

              <select
                required
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">-- 1. Select State --</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>{st} State</option>
                ))}
              </select>

              <select
                required
                disabled={!selectedState || loadingLgas}
                value={selectedLga}
                onChange={(e) => handleLgaChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-medium disabled:opacity-50"
              >
                <option value="">{loadingLgas ? 'Loading LGAs...' : '-- 2. Select Local Govt (LGA) --'}</option>
                {lgasList.map((lga) => (
                  <option key={lga} value={lga}>{lga} LGA</option>
                ))}
              </select>

              <select
                required
                disabled={!selectedLga || loadingDistricts}
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 disabled:opacity-50"
              >
                <option value="">{loadingDistricts ? 'Loading Districts...' : '-- 3. Select Major Town / District --'}</option>
                {districtsList.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              <select
                required
                disabled={!selectedDistrict || loadingVillages}
                value={formData.town_id}
                onChange={(e) => setFormData({ ...formData, town_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-800 disabled:opacity-50"
              >
                <option value="">{loadingVillages ? 'Loading Villages...' : '-- 4. Select Village / Settlement --'}</option>
                {villagesList.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} {v.sub_locality ? `(${v.sub_locality})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address / Landmark *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Market Square, Opposite Eke Market Town Hall"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* GPS CAPTURE BUTTON FOR KIOSKS WITHOUT ADDRESSES */}
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900">📍 Kiosk GPS Coordinates</span>
                  <p className="text-[10px] text-emerald-700">Essential for kiosks without formal street addresses.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={gpsLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition shadow-xs disabled:opacity-50 whitespace-nowrap"
                >
                  {gpsLoading ? 'Locating...' : '📌 Capture GPS'}
                </button>
              </div>
              {gpsStatus && <p className="text-[11px] font-medium text-emerald-800">{gpsStatus}</p>}
              {formData.latitude && formData.longitude && (
                <div className="text-[10px] bg-white p-2 rounded-lg border border-emerald-200 font-mono text-slate-600">
                  Lat: {formData.latitude}, Lng: {formData.longitude}
                </div>
              )}
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
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Add Initial Products / Services</h3>
              <button
                type="button"
                onClick={addProductRow}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add Another Item
              </button>
            </div>

            {formData.products.map((prod, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder={`Item #${idx + 1} Name`}
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
            disabled={loading || compressing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-sm mt-4 disabled:opacity-50"
          >
            {loading ? 'Registering Store...' : compressing ? 'Optimizing Image...' : 'Complete Shop Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}