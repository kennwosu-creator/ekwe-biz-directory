import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const agentPhone = searchParams.get('phone') || '2348012345678';

  try {
    // 1. Fetch agent record
    const agentRes = await query(
      'SELECT id, full_name, phone, whatsapp_number, wallet_balance, created_at FROM agents WHERE phone = $1 OR whatsapp_number = $1',
      [agentPhone]
    );

    if (agentRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Agent profile not found' }, { status: 404 });
    }

    const agent = agentRes.rows[0];

    // 2. Fetch aggregate stats from agent_transactions
    const statsSql = `
      SELECT 
        COUNT(id)::int as total_onboarded,
        COALESCE(SUM(amount_collected), 0.00) as total_cash_collected,
        COALESCE(SUM(agent_commission), 0.00) as total_agent_commission,
        COALESCE(SUM(platform_fee), 0.00) as total_platform_fee
      FROM agent_transactions
      WHERE agent_id = $1 AND status = 'completed';
    `;
    const statsRes = await query(statsSql, [agent.id]);
    const stats = statsRes.rows[0];

    // 3. Fetch list of onboarded businesses & transaction receipts
    const ledgerSql = `
      SELECT 
        t.id as transaction_id,
        t.receipt_number,
        t.amount_collected,
        t.agent_commission,
        t.created_at as onboarded_at,
        b.id as business_id,
        b.name as business_name,
        b.slug as business_slug,
        b.phone as trader_phone,
        b.status as business_status,
        tw.name as town_name
      FROM agent_transactions t
      JOIN businesses b ON t.business_id = b.id
      JOIN towns tw ON b.town_id = tw.id
      WHERE t.agent_id = $1
      ORDER BY t.created_at DESC;
    `;
    const ledgerRes = await query(ledgerSql, [agent.id]);

    return NextResponse.json({
      success: true,
      data: {
        agent,
        stats,
        transactions: ledgerRes.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching agent dashboard data:', error);
    return NextResponse.json({ success: false, error: 'Failed to load agent dashboard' }, { status: 500 });
  }
}