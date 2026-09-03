import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id');
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const clinics = await db.getClinics();
    const clinicMap = new Map(clinics.map((c) => [c.id, c.name]));

    const supabase = getSupabaseServerClient();
    let calls: any[] = [];

    if (supabase) {
      try {
        let query = supabase.from('call_logs').select('*').order('started_at', { ascending: false }).limit(limit);
        if (clinicId) query = query.eq('clinic_id', clinicId);
        if (outcome) query = query.eq('outcome', outcome);

        const { data, error } = await query;
        if (!error && data) {
          calls = data;
        }
      } catch (err) {
        console.warn('Supabase admin calls query warning, fallback:', err);
      }
    }

    if (calls.length === 0) {
      // Gather calls from localStore across clinics
      const allClinics = localStore.getClinics();
      let localCalls: any[] = [];
      for (const cl of allClinics) {
        localCalls.push(...localStore.getCallLogs(cl.id));
      }
      if (clinicId) {
        localCalls = localCalls.filter((c) => c.clinic_id === clinicId);
      }
      if (outcome) {
        localCalls = localCalls.filter((c) => c.outcome === outcome);
      }
      calls = localCalls.sort((a, b) => new Date(b.started_at || b.created_at).getTime() - new Date(a.started_at || a.created_at).getTime()).slice(0, limit);
    }

    // Enrich calls with clinic name
    const enriched = calls.map((c) => ({
      ...c,
      clinic_name: clinicMap.get(c.clinic_id) || 'Apollo Dental Clinic',
    }));

    return NextResponse.json({
      success: true,
      count: enriched.length,
      calls: enriched,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
