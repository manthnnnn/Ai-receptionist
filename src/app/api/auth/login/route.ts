import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, magic_link, clinic_id } = body;

    const targetRole: UserRole = role || 'CLINIC_ADMIN';
    const targetClinicId = clinic_id || '00000000-0000-0000-0000-000000000001';

    const supabase = getSupabaseServerClient();

    // 1. If Supabase is configured and valid password or magic link requested
    if (supabase && email && password && !password.includes('••••')) {
      try {
        if (magic_link) {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              emailRedirectTo: `${req.nextUrl.origin}/clinic/dashboard`,
            },
          });
          if (otpError) {
            return NextResponse.json({ success: false, error: otpError.message }, { status: 400 });
          }
          return NextResponse.json({
            success: true,
            magic_link_sent: true,
            message: `Magic login link sent to ${email}. Check your email inbox.`,
          });
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!authError && authData?.session) {
          const profile = await db.getProfileById(authData.user.id);
          const userRole: UserRole = profile?.role || (targetRole as UserRole);
          const userClinicId = profile?.clinic_id || targetClinicId;
          const redirectUrl = userRole === 'SUPER_ADMIN' ? '/admin' : '/clinic/dashboard';

          const response = NextResponse.json({
            success: true,
            user: {
              id: authData.user.id,
              email: authData.user.email,
              role: userRole,
              clinic_id: userClinicId,
            },
            role: userRole,
            redirect_url: redirectUrl,
          });

          // Set Supabase session cookies
          response.cookies.set('sb-access-token', authData.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400 * 7,
          });
          response.cookies.set('demo_role', userRole, { path: '/', maxAge: 86400 * 7 });
          response.cookies.set('demo_clinic_id', userClinicId, { path: '/', maxAge: 86400 * 7 });

          return response;
        }
      } catch (authErr: any) {
        console.warn('Supabase auth login exception, using role preset fallback:', authErr.message);
      }
    }

    // 2. Demo role authentication / instant preset login
    const userRole: UserRole = targetRole;
    const redirectUrl = userRole === 'SUPER_ADMIN' ? '/admin' : '/clinic/dashboard';

    const response = NextResponse.json({
      success: true,
      user: {
        id: `usr-${userRole.toLowerCase()}`,
        email: email || `${userRole.toLowerCase()}@clinicai.com`,
        role: userRole,
        clinic_id: targetClinicId,
      },
      role: userRole,
      redirect_url: redirectUrl,
      message: `Signed in successfully as ${userRole}`,
    });

    // Set demo cookies
    response.cookies.set('demo_role', userRole, { path: '/', maxAge: 86400 * 7 });
    response.cookies.set('demo_clinic_id', targetClinicId, { path: '/', maxAge: 86400 * 7 });

    return response;
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
