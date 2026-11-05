const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'Work55Horse',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'local_directory_db',
});

const villageCategories = [
  { name: 'Chop House & Bukka', icon_name: 'utensils' },
  { name: 'Foodstuff & Grains', icon_name: 'wheat-awn' },
  { name: 'Kiosk & Provisions', icon_name: 'store' },
  { name: 'Drinks & Cold Room', icon_name: 'wine-glass' },
  { name: 'Chemist & Medicine', icon_name: 'pills' },
  { name: 'Barbing & Beauty Salon', icon_name: 'scissors' },
  { name: 'Tailor & Fashion', icon_name: 'shirt' },
  { name: 'Mechanic & Vulcanizer', icon_name: 'wrench' },
  { name: 'Building Materials', icon_name: 'hammer' },
  { name: 'Solar & Electronics', icon_name: 'bolt' },
  { name: 'POS & Money Agent', icon_name: 'credit-card' },
];

async function seedCategories() {
  console.log('🌱 Seeding village-friendly categories into local_directory_db...');

  try {
    let seededCount = 0;

    for (const cat of villageCategories) {
      const res = await pool.query(
        `INSERT INTO public.categories (id, name, icon_name)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [cat.name, cat.icon_name]
      );

      if (res.rowCount > 0) {
        seededCount++;
        console.log(`  ➕ Added: ${cat.name}`);
      } else {
        console.log(`  ℹ️ Skipped (already exists): ${cat.name}`);
      }
    }

    console.log(`\n🎉 Seeding complete! ${seededCount} new categories inserted.`);
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await pool.end();
  }
}

seedCategories();