'use client';

export default function WhatsAppButton({ whatsappNumber, businessName }) {
  if (!whatsappNumber) return null;

  const handleChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hello ${businessName}, I found your shop on Ekwe Business Directory.`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
      <span className="text-[10px] text-slate-400 font-medium">Verified Merchant</span>
      <button
        type="button"
        onClick={handleChat}
        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-emerald-200/60 transition active:scale-95 cursor-pointer"
      >
        <span>💬 Chat on WhatsApp</span>
      </button>
    </div>
  );
}