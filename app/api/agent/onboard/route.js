import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseAndSaveProducts } from '@/lib/productParser';
import crypto from 'crypto';

// Helper function to dispatch WhatsApp message
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[SIMULATED WHATSAPP RECEIPT to ${to}]:\n${text}`);
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error('Failed to send WhatsApp receipt:', err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_phone, trader_phone, business_name, address, town_id, raw_products } = body;

    if (!trader_phone || !business_name || !town_id) {
      return NextResponse.json(
        { success: false, error: 'Trader phone, shop name, and town selection required' },
        { status: 400 }
      );
    }

    // 1. Verify Field Agent
    const agentRes = await query(
      'SELECT id, full_name, wallet_balance FROM agents WHERE whatsapp_number = $1 OR phone = $1',
      [agent_phone || '2348012345678']
    );

    if (agentRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or unauthorized agent' }, { status: 401 });
    }

    const agent = agentRes.rows[0];

    // 2. Fetch Town details
    const townRes = await query('SELECT name, state FROM towns WHERE id = $1', [town_id]);
    const town = townRes.rows[0] || { name: 'Ekwe', state: 'Imo' };

    // 3. Generate Random 4-Digit PIN for Trader
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = crypto.createHash('sha256').update(generatedPin).digest('hex');

    // 4. Generate Business Slug & Insert Business
    const baseSlug = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${town.name.toLowerCase()}`;

    const insertBizSql = `
      INSERT INTO businesses (town_id, name, slug, address, phone, whatsapp_number, pin_hash, status, onboarded_by_agent_id)
      VALUES ($1, $2, $3, $4, $5, $5, $6, 'active', $7)
      RETURNING id, name, slug;
    `;

    const bizRes = await query(insertBizSql, [
      town_id,
      business_name,
      slug,
      address || `${town.name} Market`,
      trader_phone.replace(/[^0-9]/g, ''),
      pinHash,
      agent.id,
    ]);

    const business = bizRes.rows[0];

    // 5. Parse and save products if provided
    if (raw_products) {
      await parseAndSaveProducts(business.id, raw_products);
    }

    // 6. Record Agent Transaction & Generate Receipt Number
    const receiptNum = `RCP-${Date.now().toString().slice(-6)}`;
    const txSql = `
      INSERT INTO agent_transactions (agent_id, business_id, amount_collected, agent_commission, platform_fee, receipt_number, trader_phone)
      VALUES ($1, $2, 1000.00, 500.00, 500.00, $3, $4)
      RETURNING receipt_number, created_at;
    `;

    await query(txSql, [agent.id, business.id, receiptNum, trader_phone]);

    // 7. Send Digital WhatsApp Receipt to Trader
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const receiptMsg = `🧾 OFFICIAL PAYMENT RECEIPT & REGISTRATION CONFIRMATION\n\n` +
      `Business: ${business.name}\n` +
      `Amount Paid: ₦1,000.00\n` +
      `Receipt #: ${receiptNum}\n` +
      `Onboarded By Agent: ${agent.full_name}\n\n` +
      `🔑 Your Access PIN: ${generatedPin}\n` +
      `🌐 Your Live Page: ${appUrl}/biz/${business.slug}\n\n` +
      `Keep your 4-digit PIN safe to update your items or contact details anytime!`;

    await sendWhatsAppMessage(trader_phone, receiptMsg);

    return NextResponse.json({
      success: true,
      receipt: {
        receipt_number: receiptNum,
        business_name: business.name,
        trader_phone,
        generated_pin: generatedPin,
        page_url: `${appUrl}/biz/${business.slug}`,
      },
    });
  } catch (error) {
    console.error('Agent onboarding error:', error);
    return NextResponse.json({ success: false, error: 'Agent onboarding failed' }, { status: 500 });
  }
}