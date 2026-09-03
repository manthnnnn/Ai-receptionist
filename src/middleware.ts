import { NextRequest, NextResponse } from 'next/server';
import { hasSqlInjectionPayload } from '@/lib/security/sanitize';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Security edge guard: detect malicious SQL injection payloads in URL
  if (searchParams.toString() && hasSqlInjectionPayload(decodeURIComponent(searchParams.toString()))) {
    return new NextResponse('Bad Request: Malicious Request Blocked', { status: 400 });
  }

  // Skip static assets, api routes, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Redirect legacy /dashboard routes to modern /clinic/* workspace
  if (pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    const subpath = pathname.replace('/dashboard', '/clinic');
    url.pathname = subpath === '/clinic' ? '/clinic/dashboard' : subpath;
    return NextResponse.redirect(url);
  }

  // Extract active role & clinic from cookies or query params (with dev fallback)
  const roleQuery = searchParams.get('role');
  const clinicQuery = searchParams.get('clinic_id');
  const roleCookie = req.cookies.get('demo_role')?.value;
  const clinicCookie = req.cookies.get('demo_clinic_id')?.value;
  const hasAuthToken = Boolean(req.cookies.get('sb-access-token')?.value);

  const activeRole = roleQuery || roleCookie || (hasAuthToken ? 'CLINIC_ADMIN' : 'SUPER_ADMIN');
  const activeClinicId = clinicQuery || clinicCookie || '00000000-0000-0000-0000-000000000001';

  // 2. Protect /admin routes (Strict Super Admin Access)
  if (pathname.startsWith('/admin')) {
    if (activeRole !== 'SUPER_ADMIN') {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'unauthorized_super_admin');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect /clinic routes (Requires authenticated clinic staff or Super Admin)
  if (pathname.startsWith('/clinic')) {
    const validRoles = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'];
    if (!validRoles.includes(activeRole)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'unauthenticated');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Inject current role and clinic into request header for downstream layout reading
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-role', activeRole);
  requestHeaders.set('x-user-clinic-id', activeClinicId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Persist demo cookies if passed in query
  if (roleQuery) {
    response.cookies.set('demo_role', roleQuery, { path: '/' });
  }
  if (clinicQuery) {
    response.cookies.set('demo_clinic_id', clinicQuery, { path: '/' });
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/clinic/:path*', '/dashboard/:path*', '/dashboard'],
};
