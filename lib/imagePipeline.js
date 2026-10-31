import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Downloads image from Meta Cloud API, compresses it to WebP, and saves locally
 * @param {string} mediaId - Meta WhatsApp Media ID
 * @returns {Promise<string>} Public relative URL of the saved image
 */
export async function processAndSaveWhatsAppImage(mediaId) {
  const token = process.env.WHATSAPP_TOKEN;

  if (!mediaId || !token) {
    // Local fallback/placeholder image if running in dev without live Meta credentials
    return '/uploads/placeholder-shop.jpg';
  }

  try {
    // 1. Fetch Media URL from Meta API
    const mediaMetaRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const mediaMetaData = await mediaMetaRes.json();

    if (!mediaMetaData.url) {
      throw new Error('Failed to retrieve media URL from Meta');
    }

    // 2. Download raw image buffer
    const imageBinaryRes = await fetch(mediaMetaData.url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rawBuffer = Buffer.from(await imageBinaryRes.arrayBuffer());

    // 3. Compress & Resize using Sharp (Target: < 150KB, max width 800px)
    const compressedBuffer = await sharp(rawBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 75 }) // Converts to lightweight WebP format
      .toBuffer();

    // 4. Save to public/uploads directory for local dev
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `shop-${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, compressedBuffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Image Processing Pipeline Error:', error);
    return '/uploads/placeholder-shop.jpg';
  }
}