import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';

// Fetch business data & categorized products server-side
async function getBusinessData(slug) {
  const sql = `
    SELECT 
      b.id,
      b.name,
      b.slug,
      b.address,
      b.phone,
      b.whatsapp_number,
      b.image_url,
      b.is_featured,
      b.is_verified,
      t.name as town_name,
      t.state,
      t.lga as town_lga,
      t.district as town_district,
      t.sub_locality as town_sub_locality,
      t.slug as town_slug
    FROM businesses b
    JOIN towns t ON b.town_id = t.id
    WHERE b.slug = $1 AND (b.status::text ILIKE 'active' OR b.status IS NULL);
  `;

  const businessRes = await query(sql, [slug]);
  if (businessRes.rows.length === 0) return null;

  const business = businessRes.rows[0];

  // Fetch categorized products
  const productsSql = `
    SELECT 
      p.id,
      p.name,
      p.price,
      p.in_stock,
      c.name as category_name,
      c.icon_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.business_id = $1
    ORDER BY c.name ASC, p.name ASC;
  `;

  const productsRes = await query(productsSql, [business.id]);

  // Group products by category
  const groupedProducts = {};
  productsRes.rows.forEach((product) => {
    const category = product.category_name || 'General Goods & Services';
    if (!groupedProducts[category]) {
      groupedProducts[category] = [];
    }
    groupedProducts[category].push(product);
  });

  return { business, groupedProducts };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getBusinessData(slug);
  if (!data) return { title: 'Business Not Found' };

  const locationLabel = data.business.town_sub_locality
    ? `${data.business.town_sub_locality}, ${data.business.town_name}`
    : data.business.town_name;

  return {
    title: `${data.business.name} - ${locationLabel} Directory`,
    description: `View products, location, and contact information for ${data.business.name} in ${locationLabel}, ${data.business.state}.`,
  };
}

export default async function BusinessPage({ params }) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  if (!data) {
    notFound();
  }

  const { business, groupedProducts } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const adminWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '14165261826';

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link
          href={`/directory/${business.state.toLowerCase()}/${business.town_name.toLowerCase()}`}
          className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full hover:bg-emerald-100 transition"
        >
          ← {business.town_name} Directory
        </Link>
        <span className="text-xs text-slate-500 font-medium">Verified Local Business</span>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* HERO CARD */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="relative h-48 w-full bg-slate-200">
            <Image
              src={
                business.image_url && business.image_url.trim() !== ''
                  ? business.image_url
                  : '/uploads/placeholder-shop.jpg'
              }
              alt={business.name}
              fill
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
              priority
            />
            {business.is_verified && (
              <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                ✓ Verified Shop
              </div>
            )}
          </div>

          <div className="p-5">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{business.name}</h1>

            {/* FULL 5-TIER LOCATION DISPLAY */}
            <div className="mt-2 text-slate-600 text-xs space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="shrink-0 text-sm">📍</span>
                <div>
                  <p className="font-semibold text-slate-800">{business.address}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {business.town_sub_locality && (
                      <span className="font-bold text-emerald-700">{business.town_sub_locality} • </span>
                    )}
                    <span>{business.town_name}</span>
                    {business.town_district && ` (${business.town_district} District)`}
                    {business.town_lga && `, ${business.town_lga} LGA`}
                  </p>
                </div>
              </div>
            </div>

            {/* CALL & WHATSAPP BUTTONS */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <a
                href={`tel:${business.phone}`}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl text-sm transition active:scale-[0.98]"
              >
                📞 Call Now
              </a>

              <a
                href={`https://wa.me/${business.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${business.name}, I found your page on the CommunityShops Directory.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl text-sm transition active:scale-[0.98]"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* PRODUCTS INVENTORY CARD */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📦 Available Items & Services
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
              In Stock
            </span>
          </div>

          <div className="space-y-5">
            {Object.keys(groupedProducts).length > 0 ? (
              Object.entries(groupedProducts).map(([categoryName, items]) => (
                <div key={categoryName}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    {categoryName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span
                        key={item.id}
                        className="bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5"
                      >
                        <span>{item.name}</span>
                        {item.price && (
                          <span className="font-extrabold text-emerald-700">
                            ₦{Number(item.price).toLocaleString()}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No inventory listed yet.</p>
            )}
          </div>
        </section>

        {/* OWNER EDIT NOTE - FREE WHATSAPP DEEP-LINK */}
        <a
          href={`https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(
            `Hello, I am the owner of ${business.name} in ${business.town_name}. I want to update my shop listing.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-amber-50 border border-amber-200/80 hover:bg-amber-100 rounded-xl p-3.5 text-center text-xs text-amber-900 block transition shadow-2xs"
        >
          Own this shop? <strong className="text-emerald-800 underline">Click here to message us on WhatsApp</strong> to update your list.
        </a>
      </main>

      {/* SINGLE STICKY BOTTOM SHARE BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-40">
        <div className="max-w-md mx-auto">
          <ShareButton
            businessName={business.name}
            townName={business.town_name}
            pageUrl={`${baseUrl}/biz/${business.slug}`}
          />
        </div>
      </div>
    </div>
  );
}