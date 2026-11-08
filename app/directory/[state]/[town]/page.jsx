export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';
import AdSenseBanner from '@/components/AdSenseBanner';
import AdvancedSearch from '@/components/AdvancedSearch';
import SafeImage from '@/components/SafeImage';
import WhatsAppButton from '@/components/WhatsAppButton';
import DirectoryClientView from './DirectoryClientView';

// Fetch town details, sister towns in LGA, categories, and active local businesses safely (Server Side)
async function getDirectoryData(stateParam, townParam) {
  if (!stateParam || !townParam) return null;

  try {
    const cleanTownParam = townParam.trim().toLowerCase();

    let townSql = '';
    let townRes;

    if (cleanTownParam === 'ekwe') {
      townSql = `
        SELECT id, state, lga, name, slug, district, sub_locality 
        FROM public.towns 
        WHERE TRIM(LOWER(state)) = TRIM(LOWER($1)) 
          AND (TRIM(LOWER(slug)) = 'ekwe' OR TRIM(LOWER(name)) = 'ekwe')
          AND is_active = true
        ORDER BY CASE WHEN sub_locality IS NULL OR sub_locality = '' THEN 0 ELSE 1 END
        LIMIT 1;
      `;
      townRes = await query(townSql, [stateParam]);
    } else {
      townSql = `
        SELECT id, state, lga, name, slug, district, sub_locality 
        FROM public.towns 
        WHERE TRIM(LOWER(state)) = TRIM(LOWER($1)) 
          AND (
            TRIM(LOWER(slug)) = TRIM(LOWER($2)) 
            OR TRIM(LOWER(name)) = TRIM(LOWER($2)) 
            OR TRIM(LOWER(slug)) LIKE '%' || TRIM(LOWER($2))
          )
          AND is_active = true
        LIMIT 1;
      `;
      townRes = await query(townSql, [stateParam, townParam]);
    }

    if (!townRes || !townRes.rows || townRes.rows.length === 0) {
      console.warn(`[Directory Lookup Failed] State: "${stateParam}", Town: "${townParam}"`);
      return null;
    }

    const town = townRes.rows[0];

    // Fetch all active businesses registered under this town
    const bizSql = `
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
        COALESCE(
          json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]'
        ) as products_sample
      FROM public.businesses b
      LEFT JOIN public.products p ON b.id = p.business_id
      WHERE (b.town_id = $1 OR b.town_id IN (SELECT id FROM public.towns WHERE LOWER(name) LIKE '%ekwe%' OR LOWER(slug) LIKE '%ekwe%')) 
        AND (b.status::text ILIKE 'active' OR b.status IS NULL)
      GROUP BY b.id
      ORDER BY b.is_featured DESC, b.created_at DESC;
    `;

    const bizRes = await query(bizSql, [town.id]);
    const categoriesRes = await query('SELECT name FROM public.categories ORDER BY name ASC');

    const sisterTownsRes = await query(
      `SELECT DISTINCT ON (LOWER(TRIM(name))) id, name, slug, lga, state 
       FROM public.towns 
       WHERE is_active = true 
         AND LOWER(state) = LOWER($1) 
         AND LOWER(lga) = LOWER($2)
       ORDER BY LOWER(TRIM(name)) ASC 
       LIMIT 25`,
      [town.state, town.lga]
    );

    return {
      town,
      businesses: bizRes ? bizRes.rows : [],
      categories: categoriesRes ? categoriesRes.rows : [],
      allTowns: sisterTownsRes ? sisterTownsRes.rows : [],
    };
  } catch (error) {
    console.error('[DB Query Error in getDirectoryData]:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const state = resolvedParams?.state || '';
  const town = resolvedParams?.town || '';

  const capitalizedTown = town ? town.charAt(0).toUpperCase() + town.slice(1) : 'Local';
  const capitalizedState = state ? state.charAt(0).toUpperCase() + state.slice(1) : '';

  return {
    title: `${capitalizedTown} Community Directory - Verified Local Shops & Services | CommunityShops`,
    description: `Find local village shops, merchants, and goods in ${capitalizedTown}, ${capitalizedState} State on CommunityShops.`,
  };
}

export default async function RegionalDirectoryPage({ params }) {
  const resolvedParams = await params;
  const stateParam = resolvedParams?.state;
  const townParam = resolvedParams?.town;

  const data = await getDirectoryData(stateParam, townParam);

  if (!data) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 max-w-sm shadow-xs">
          <span className="text-4xl">📍</span>
          <h2 className="text-base font-bold text-slate-900 capitalize">Town Directory Not Found</h2>
          <p className="text-xs text-slate-500">
            We couldn't find listings for <strong className="capitalize">{townParam}</strong> in {stateParam} State.
          </p>
          <Link
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition mt-2"
          >
            ← Back to All Towns
          </Link>
        </div>
      </div>
    );
  }

  const { town, businesses, categories, allTowns } = data;

  return (
    <DirectoryClientView
      town={town}
      businesses={businesses}
      categories={categories}
      allTowns={allTowns}
    />
  );
}