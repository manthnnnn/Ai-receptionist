import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const clinic = localStore.getClinicById(clinicId);
    const settings = localStore.getClinicSettings(clinicId);
    const stats = localStore.getStats(clinicId);

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, name, phone_number, address, ai_greeting, primary_handoff_number, backup_handoff_number, ai_enabled } = body;

    const clinicId = clinic_id || '00000000-0000-0000-0000-000000000001';

    // Update clinic details
    const clinicUpdates: any = {};
    if (name) clinicUpdates.name = name;
    if (phone_number) clinicUpdates.phone_number = phone_number;
    if (address) clinicUpdates.address = address;
    
    const updatedClinic = localStore.updateClinic(clinicId, clinicUpdates);

    // Update settings
    const settingsUpdates: any = {};
    if (ai_greeting !== undefined) settingsUpdates.ai_greeting = ai_greeting;
    if (primary_handoff_number !== undefined) settingsUpdates.primary_handoff_number = primary_handoff_number;
    if (backup_handoff_number !== undefined) settingsUpdates.backup_handoff_number = backup_handoff_number;
    if (ai_enabled !== undefined) settingsUpdates.ai_enabled = ai_enabled;

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

