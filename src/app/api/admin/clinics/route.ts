import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const clinics = await db.getClinicsOverview();
    return NextResponse.json({
      success: true,
      count: clinics.length,
      clinics,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, phone_number, agent_name, primary_language, voice_id, plan_tier, primary_handoff_number, ai_greeting } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Clinic name is required' }, { status: 400 });
    }

    const newClinic = localStore.createClinic({
      name: name.trim(),
      address: address?.trim(),
      phone_number: phone_number?.trim(),
      agent_name: agent_name?.trim(),
      primary_language: primary_language || 'mr',
      voice_id,
      plan_tier: plan_tier || 'growth',
      primary_handoff_number: primary_handoff_number?.trim(),
      ai_greeting: ai_greeting?.trim(),
    });

    return NextResponse.json({
      success: true,
      clinic: newClinic,
      message: `Clinic "${newClinic.name}" provisioned successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
