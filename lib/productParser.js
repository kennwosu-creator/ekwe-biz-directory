import { query } from '@/lib/db';

// Keyword dictionary mapping items to default category names
const CATEGORY_DICTIONARY = {
  'Food & Grocery': [
    'rice', 'garri', 'gari', 'food', 'beans', 'yam', 'bread', 'palm oil', 'groundnut oil',
    'cassava', 'plantain', 'indomie', 'noodles', 'semovita', 'wheat', 'egusi', 'soup', 'salt', 'sugar'
  ],
  'Beverages & Drinks': [
    'beer', 'alcohol', 'water', 'sachet water', 'bottled water', 'soft drink', 'coke',
    'fanta', 'sprite', 'malt', 'wine', 'juices', 'stout', 'drink', 'drinks', 'gin', 'whiskey'
  ],
  'Health & Personal Care': [
    'vitamins', 'paracetamol', 'soap', 'cream', 'medicine', 'toothpaste', 'sanitizer',
    'pomade', 'detergent', 'pads', 'tissue', 'drugs', 'body wash', 'shampoo'
  ],
  'Household & Hardware': [
    'chairs', 'chair', 'torches', 'torch', 'books', 'book', 'kerosene', 'generator',
    'bulb', 'batteries', 'battery', 'cement', 'nails', 'wire', 'cable', 'fan', 'stove'
  ]
};

// Helper: Capitalize words cleanly
function capitalizeWord(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses raw comma-separated string, categorizes items, and saves them to PostgreSQL
 * @param {string} businessId - UUID of the target business
 * @param {string} rawInput - e.g. "beer, rice, garri, chairs, torches, books"
 */
export async function parseAndSaveProducts(businessId, rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return [];

  // 1. Fetch category map from local PostgreSQL (or fallback to dictionary)
  const categoriesRes = await query('SELECT id, name FROM categories');
  const categoryMap = {};
  categoriesRes.rows.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Default fallback category ID for uncategorized items
  const fallbackCatId = categoryMap['General Goods & Services'] || null;

  // 2. Clean, split, and deduplicate items
  const rawItems = rawInput
    .split(/[,;\n]+/) // Split by commas, semicolons, or line breaks
    .map(item => item.trim())
    .filter(item => item.length > 0);

  const uniqueItems = Array.from(new Set(rawItems));
  const processedProducts = [];

  // 3. Process and match each item
  for (const item of uniqueItems) {
    const lowerItem = item.toLowerCase();
    let matchedCategoryId = fallbackCatId;

    for (const [catName, keywords] of Object.entries(CATEGORY_DICTIONARY)) {
      if (keywords.some(keyword => lowerItem.includes(keyword) || keyword.includes(lowerItem))) {
        if (categoryMap[catName]) {
          matchedCategoryId = categoryMap[catName];
          break;
        }
      }
    }

    const cleanName = capitalizeWord(item);

    // Insert into PostgreSQL
    const insertRes = await query(
      `INSERT INTO products (business_id, category_id, name, raw_input_string, in_stock)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name, category_id`,
      [businessId, matchedCategoryId, cleanName, rawInput]
    );

    processedProducts.push(insertRes.rows[0]);
  }

  return processedProducts;
}