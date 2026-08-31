import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const clinicsOverview = localStore.getClinicsOverview();
      return NextResponse.json({
        success: true,
        clinics: clinicsOverview,
      });
    }

    const activeId = clinicId || '00000000-0000-0000-0000-000000000001';
    const clinic = localStore.getClinicById(activeId);
    const settings = localStore.getClinicSettings(activeId);
    const stats = localStore.getStats(activeId);

    return NextResponse.json({
      success: true,
      clinic,
      settings,
      stats,
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
      message: `Clinic "${newClinic.name}" created and provisioned successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      clinic_id, 
      name, 
      phone_number, 
      address, 
      ai_greeting, 
      primary_handoff_number, 
      backup_handoff_number, 
      ai_enabled,
      agent_enabled,
      agent_name,
      primary_language,
      plan_tier,
      monthly_minute_limit,
    } = body;

    const clinicId = clinic_id || '00000000-0000-0000-0000-000000000001';

    // Update clinic details
    const clinicUpdates: any = {};
    if (name !== undefined) clinicUpdates.name = name;
    if (phone_number !== undefined) clinicUpdates.phone_number = phone_number;
    if (address !== undefined) clinicUpdates.address = address;
    if (agent_name !== undefined) clinicUpdates.agent_name = agent_name;
    if (primary_language !== undefined) clinicUpdates.primary_language = primary_language;
    if (plan_tier !== undefined) clinicUpdates.plan_tier = plan_tier;
    if (monthly_minute_limit !== undefined) clinicUpdates.monthly_minute_limit = Number(monthly_minute_limit);
    if (agent_enabled !== undefined) clinicUpdates.agent_enabled = Boolean(agent_enabled);
    if (ai_enabled !== undefined) clinicUpdates.agent_enabled = Boolean(ai_enabled);
    if (primary_handoff_number !== undefined) clinicUpdates.primary_handoff_number = primary_handoff_number;
    if (backup_handoff_number !== undefined) clinicUpdates.backup_handoff_number = backup_handoff_number;
    if (ai_greeting !== undefined) clinicUpdates.ai_greeting = ai_greeting;
    
    const updatedClinic = localStore.updateClinic(clinicId, clinicUpdates);

    // Update settings
    const settingsUpdates: any = {};
    if (ai_greeting !== undefined) settingsUpdates.ai_greeting = ai_greeting;
    if (primary_handoff_number !== undefined) settingsUpdates.primary_handoff_number = primary_handoff_number;
    if (backup_handoff_number !== undefined) settingsUpdates.backup_handoff_number = backup_handoff_number;
    if (agent_enabled !== undefined) settingsUpdates.ai_enabled = Boolean(agent_enabled);
    if (ai_enabled !== undefined) settingsUpdates.ai_enabled = Boolean(ai_enabled);
    if (agent_name !== undefined) settingsUpdates.agent_name = agent_name;
    if (primary_language !== undefined) settingsUpdates.primary_language = primary_language;

    const updatedSettings = localStore.updateClinicSettings(clinicId, settingsUpdates);

    return NextResponse.json({
      success: true,
      clinic: updatedClinic,
      settings: updatedSettings,
      message: 'Clinic details and telephony routing updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating clinic settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id');

    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Clinic ID is required' }, { status: 400 });
    }

    const success = localStore.deleteClinic(clinicId);
    return NextResponse.json({
      success,
      message: success ? 'Clinic deleted successfully' : 'Clinic not found',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
