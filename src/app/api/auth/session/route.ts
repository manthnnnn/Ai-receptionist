import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req);
    return NextResponse.json({
      success: true,
      session,
      is_super_admin: session.role === 'SUPER_ADMIN',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
