import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { UserRole, Profile } from '@/types';

export interface AuthSession {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  clinic_id: string;
  is_authenticated: boolean;
}

/**
 * Server-side session & role validator.
 * Reads Supabase Auth session or demo session cookie/headers.
 */
export async function getCurrentSession(req?: NextRequest): Promise<AuthSession> {
  const supabase = getSupabaseServerClient();

  // 1. Try Supabase Auth session if token exists in header or cookie
  if (supabase && req) {
    try {
      const authHeader = req.headers.get('authorization') || '';
      const cookieToken = req.cookies.get('sb-access-token')?.value;
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : cookieToken;
      
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          const profile = await db.getProfileById(user.id);
          return {
            user_id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.user_metadata?.full_name || 'Clinic User',
            role: (profile?.role || user.user_metadata?.role || 'CLINIC_ADMIN') as UserRole,
            clinic_id: profile?.clinic_id || user.user_metadata?.clinic_id || '00000000-0000-0000-0000-000000000001',
            is_authenticated: true,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase session inspection warning:', err);
    }
  }

  // 2. Demo role switcher (via Cookie or Query Param for local/demo mode)
  if (req) {
    const demoRoleCookie = req.cookies.get('demo_role')?.value as UserRole | undefined;
    const demoClinicCookie = req.cookies.get('demo_clinic_id')?.value;
    const roleQuery = req.nextUrl.searchParams.get('role') as UserRole | null;
    const clinicQuery = req.nextUrl.searchParams.get('clinic_id');

    const activeRole: UserRole = roleQuery || demoRoleCookie || 'SUPER_ADMIN';
    const activeClinicId = clinicQuery || demoClinicCookie || '00000000-0000-0000-0000-000000000001';

    return {
      user_id: `user-${activeRole.toLowerCase()}`,
      email: `${activeRole.toLowerCase()}@clinicai.com`,
      full_name: activeRole === 'SUPER_ADMIN' ? 'Platform Super Admin' : 'Dr. Ashish Verma',
      role: activeRole,
      clinic_id: activeClinicId,
      is_authenticated: true,
    };
  }

  // Default fallback
  return {
    user_id: 'user-super-admin',
    email: 'superadmin@clinicai.com',
    full_name: 'Platform Super Admin',
    role: 'SUPER_ADMIN',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    is_authenticated: true,
  };
}

/**
 * Validates if session role satisfies required roles
 */
export function hasRequiredRole(session: AuthSession, allowedRoles: UserRole[]): boolean {
  if (session.role === 'SUPER_ADMIN') return true; // Super Admin has universal bypass
  return allowedRoles.includes(session.role);
}

/**
 * Checks if session is authorized to access resources for a specific clinic
 */
export function isAuthorizedForClinic(session: AuthSession, clinicId: string): boolean {
  if (session.role === 'SUPER_ADMIN') return true;
  return session.clinic_id === clinicId;
}
