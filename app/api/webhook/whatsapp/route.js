import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { parseAndSaveProducts } from '@/lib/productParser';
import { processAndSaveWhatsAppImage } from '@/lib/imagePipeline';

// 1. Meta Webhook Verification (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'ekwe_local_dev_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// 2. Incoming Messages & State Machine (POST)
export async function POST(request) {
  try {
    const body = await request.json();

    // Extract message payload from Meta Cloud API payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const fromPhone = message.from; // Sender WhatsApp ID / Phone
    const msgType = message.type;
    const textBody = message.text?.body?.trim();

    // Fetch or create user session from PostgreSQL
    let session = await getOrCreateSession(fromPhone);

    // Global Reset Keyword
    if (textBody?.toUpperCase() === 'JOIN' || textBody?.toUpperCase() === 'START') {
      session = await updateSession(fromPhone, 'AWAITING_NAME', {});
      await sendWhatsAppTextMessage(
        fromPhone,
        '🌟 *Welcome to Ekwe Business Directory!*\n\nGet your free business website in 2 minutes.\n\n*Step 1 of 3:* What is the *Name of your Business* and *Town*?\n_(Example: Mazi Kalu Tech & Provisions, Ekwe)_'
      );
      return NextResponse.json({ status: 'success' }, { status: 200 });
    }

    // STATE MACHINE ROUTER
    switch (session.step) {
      case 'AWAITING_NAME': {
        const parts = textBody.split(',');
        const name = parts[0]?.trim();
        const town = parts[1]?.trim() || 'Ekwe';

        const updatedData = { ...session.session_data, name, town };
        await updateSession(fromPhone, 'AWAITING_PHOTO', updatedData);

        await sendWhatsAppTextMessage(
          fromPhone,
          `Great! *${name}* (${town}).\n\n*Step 2 of 3:* Send us *1 Photo* of your shop front, signpost, or products. 📸\n\n_(Or reply *SKIP* to add it later)_`
        );
        break;
      }

case 'AWAITING_PHOTO': {
  let imageUrl = '/uploads/placeholder-shop.jpg';

  if (msgType === 'image' && message.image?.id) {
    // Process, compress, and save image automatically
    imageUrl = await processAndSaveWhatsAppImage(message.image.id);
  }

  const updatedData = { ...session.session_data, image_url: imageUrl };
  await updateSession(fromPhone, 'AWAITING_PRODUCTS', updatedData);

  await sendWhatsAppTextMessage(
    fromPhone,
    'Photo saved! 📸\n\n*Step 3 of 3:* List the main products or services you offer, separated by commas.\n\n_(Example: beer, rice, garri, chairs, torches, books, food, vitamins, water)_'
  );
  break;
}

      case 'AWAITING_PRODUCTS': {
  const rawProducts = textBody;
  const sessionData = { ...session.session_data, raw_products: rawProducts };

  // Generate 4-Digit Edit PIN & Create Business
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  const business = await createBusinessFromSession(fromPhone, sessionData, pinHash);

  // Parse and link products automatically!
  await parseAndSaveProducts(business.id, rawProducts);

  // Reset session state back to IDLE
  await updateSession(fromPhone, 'IDLE', {});

  const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const pageUrl = `${domain}/biz/${business.slug}`;

  await sendWhatsAppTextMessage(
    fromPhone,
    `🎉 *Your Business Page is LIVE!*\n\n🔗 *Your Page Link:*\n${pageUrl}\n\n🔑 *Your Edit PIN:* \`${pin}\` _(Save this to make changes later)_\n\nTap the link above to view your website!`
  );
  break;
}

      default: {
        await sendWhatsAppTextMessage(
          fromPhone,
          'Welcome to *Ekwe Business Directory*!\n\nReply with *JOIN* to create or update your business page.'
        );
        break;
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}

// === HELPER FUNCTIONS ===

async function getOrCreateSession(phone) {
  const res = await query('SELECT * FROM whatsapp_sessions WHERE phone = $1', [phone]);
  if (res.rows.length > 0) return res.rows[0];

  const insert = await query(
    'INSERT INTO whatsapp_sessions (phone, step, session_data) VALUES ($1, $2, $3) RETURNING *',
    [phone, 'IDLE', '{}']
  );
  return insert.rows[0];
}

async function updateSession(phone, step, data) {
  const res = await query(
    'UPDATE whatsapp_sessions SET step = $1, session_data = $2, updated_at = NOW() WHERE phone = $3 RETURNING *',
    [step, JSON.stringify(data), phone]
  );
  return res.rows[0];
}

async function createBusinessFromSession(phone, data, pinHash) {
  const townRes = await query('SELECT id FROM towns WHERE name ILIKE $1 LIMIT 1', [data.town || 'Ekwe']);
  const townId = townRes.rows[0]?.id;

  const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

  const res = await query(
    `INSERT INTO businesses (town_id, name, slug, address, phone, whatsapp_number, image_url, pin_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, slug`,
    [townId, data.name, slug, `${data.town || 'Ekwe'}, Imo State`, phone, phone, data.image_url, pinHash]
  );

  return res.rows[0];
}

async function sendWhatsAppTextMessage(toPhone, messageText) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[LOCAL DEV OUTBOUND WHATSAPP to ${toPhone}]:\n${messageText}\n`);
    return;
  }

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: messageText },
    }),
  });
}