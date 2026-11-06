'use client';

import { useState } from 'react';
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

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export default function OwnerManagePage() {
  const [step, setStep] = useState('LOGIN'); // 'LOGIN' | 'EDIT'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Business state
  const [business, setBusiness] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [rawProducts, setRawProducts] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Handle PIN Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: phone, pin }),
      });
      const json = await res.json();

      if (json.success) {
        setBusiness(json.business);
        setName(json.business.name);
        setAddress(json.business.address || '');
        setImageUrl(json.business.image_url || '');
        setImagePreview(json.business.image_url || '');
        setStep('EDIT');
      } else {
        setError(json.error || 'Invalid phone number or 4-digit PIN');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Upload & Compression
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressedBase64 = await compressImage(file, 800, 800, 0.7);
      setImagePreview(compressedBase64);
      setImageUrl(compressedBase64);
    } catch (err) {
      console.error('Image compression error:', err);
      alert('Failed to process image. Please try another photo.');
    } finally {
      setCompressing(false);
    }
  };

  // Handle Profile & Inventory Update
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateSuccess(false);

    try {
      const res = await fetch('/api/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          name,
          address,
          image_url: imageUrl,
          raw_products: rawProducts,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        alert('Failed to update shop details');
      }
    } catch (err) {
      alert('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full">
          ← Directory
        </Link>
        <span className="text-xs font-bold text-slate-700">Shop Owner Portal</span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        {step === 'LOGIN' ? (
          /* LOGIN FORM */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔑</span>
              <h1 className="text-base font-bold text-slate-900">Manage Your Business Page</h1>
              <p className="text-xs text-slate-500">Enter your WhatsApp phone number and 4-digit PIN.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 08031234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="****"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-center font-bold tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
              >
                {loading ? 'Verifying...' : 'Access My Shop'}
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-400">
              Forgot your PIN? Text <strong className="text-slate-600">JOIN</strong> on WhatsApp to retrieve it.
            </p>
          </div>
        ) : (
          /* EDITING PORTAL */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h1 className="text-sm font-bold text-slate-900">{business.name}</h1>
                <p className="text-[11px] text-slate-400">Editing Live Storefront</p>
              </div>
              <button
                onClick={() => setStep('LOGIN')}
                className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg"
              >
                Log Out
              </button>
            </div>

            {updateSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl text-center font-semibold">
                ✓ Shop details updated successfully!
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              {/* SHOP PHOTO UPLOAD & COMPRESSION SECTION */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600">Shop / Kiosk Photo</label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Shop preview" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                      No Photo
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={compressing}
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {compressing && <p className="text-[10px] text-emerald-600 font-medium mt-1">Optimizing image...</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Add / Replace Products & Items
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Type new items separated by commas. Our system will organize them automatically.
                </p>
                <textarea
                  rows={4}
                  placeholder="e.g. beer, rice, garri, chairs, torches, books, food, vitamins, water"
                  value={rawProducts}
                  onChange={(e) => setRawProducts(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || compressing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving Changes...' : compressing ? 'Optimizing Image...' : 'Save & Publish Page'}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-3 text-center">
              <Link
                href={`/biz/${business.slug}`}
                target="_blank"
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                👁️ View Live Business Page →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}