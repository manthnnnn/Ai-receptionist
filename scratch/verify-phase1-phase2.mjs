// Automated Verification Suite for Phase 1 (Auth & RBAC) & Phase 2 (Admin vs Clinic Suites)
import * as fs from 'fs';
import * as path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// Load env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

async function runVerification() {
  console.log('======================================================================');
  console.log('🚀 RUNNING PHASE 1 & PHASE 2 VERIFICATION SUITE');
  console.log('======================================================================\n');

  // ══════════════════════════════════════════════════════════════════
  // PART 1: Phase 1 — Authentication, RBAC & Role Routing
  // ══════════════════════════════════════════════════════════════════
  console.log('📌 [PHASE 1] AUTHENTICATION & RBAC LOGIC');
  const { getCurrentSession, hasRequiredRole, isAuthorizedForClinic } = await import('../src/lib/auth/session.ts');

  // 1.1 Super Admin permissions
  const superAdminSession = {
    user_id: 'usr-super',
    email: 'superadmin@clinicai.com',
    full_name: 'Platform Super Admin',
    role: 'SUPER_ADMIN',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    is_authenticated: true,
  };
  assert(hasRequiredRole(superAdminSession, ['SUPER_ADMIN']) === true, 'Super Admin role grants access to /admin');
  assert(hasRequiredRole(superAdminSession, ['CLINIC_ADMIN']) === true, 'Super Admin role grants bypass to /clinic');
  assert(isAuthorizedForClinic(superAdminSession, '00000000-0000-0000-0000-000000000002') === true, 'Super Admin has cross-tenant bypass to any clinic');

  // 1.2 Clinic Admin permissions
  const clinicAdminSession = {
    user_id: 'usr-clinic',
    email: 'ashish.verma@apollodental.com',
    full_name: 'Dr. Ashish Verma',
    role: 'CLINIC_ADMIN',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    is_authenticated: true,
  };
  assert(hasRequiredRole(clinicAdminSession, ['SUPER_ADMIN']) === false, 'Clinic Admin is strictly denied /admin access');
  assert(hasRequiredRole(clinicAdminSession, ['CLINIC_ADMIN', 'DOCTOR']) === true, 'Clinic Admin satisfies /clinic route access');
  assert(isAuthorizedForClinic(clinicAdminSession, '00000000-0000-0000-0000-000000000001') === true, 'Clinic Admin authorized for own clinic');
  assert(isAuthorizedForClinic(clinicAdminSession, '00000000-0000-0000-0000-000000000002') === false, 'Clinic Admin blocked from other clinic tenant');

  // 1.3 Doctor & Receptionist roles
  const doctorSession = {
    user_id: 'usr-doc',
    email: 'doc@apollodental.com',
    full_name: 'Dr. Neha Kulkarni',
    role: 'DOCTOR',
    clinic_id: '00000000-0000-0000-0000-000000000001',
    is_authenticated: true,
  };
  assert(hasRequiredRole(doctorSession, ['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST']) === true, 'Doctor role satisfies clinic staff routes');

  // ══════════════════════════════════════════════════════════════════
  // PART 2: Phase 2 — Platform Super Admin Suite & Dedicated APIs
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 2] PLATFORM SUPER ADMIN SUITE & APIS');
  const { db } = await import('../src/lib/db/index.ts');

  // 2.1 Multi-tenant catalog
  const adminClinics = await db.getClinicsOverview();
  assert(Array.isArray(adminClinics) && adminClinics.length >= 2, `Admin retrieved ${adminClinics.length} subscribed clinic tenants`);
  assert(adminClinics[0].doctors_count !== undefined, 'Admin clinic overview includes live doctors count');
  assert(adminClinics[0].monthly_minutes_used !== undefined, 'Admin clinic overview includes telephony usage metrics');

  // 2.2 Provision new clinic tenant test
  const { localStore } = await import('../src/lib/store/local-store.ts');
  const testClinic = localStore.createClinic({
    name: 'Bangalore Smiles Orthodontics',
    address: 'Indiranagar 100ft Road, Bangalore',
    phone_number: '+91-80-4567-9911',
    primary_language: 'en',
    plan_tier: 'enterprise',
  });
  assert(testClinic && testClinic.id.startsWith('clinic-'), `Super admin provisioned new clinic: "${testClinic.name}" (${testClinic.id})`);

  // 2.3 Global call telemetry stream
  const allCalls = await db.getCallLogs('00000000-0000-0000-0000-000000000001');
  assert(Array.isArray(allCalls) && allCalls.length > 0, `Global call stream aggregated ${allCalls.length} logs`);

  // ══════════════════════════════════════════════════════════════════
  // PART 3: Phase 2 — Tenant-Scoped Clinic Suite & Isolation
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 2] TENANT-SCOPED CLINIC SUITE & ISOLATION');

  // 3.1 Strict Tenant Isolation Check: Clinic 1 vs Clinic 2
  const clinic1Id = '00000000-0000-0000-0000-000000000001';
  const clinic2Id = '00000000-0000-0000-0000-000000000002';

  const [c1Doctors, c2Doctors] = await Promise.all([
    db.getDoctors(clinic1Id),
    db.getDoctors(clinic2Id),
  ]);
  assert(c1Doctors.length > 0, `Clinic 1 has ${c1Doctors.length} doctors`);
  assert(c1Doctors.every((d) => d.clinic_id === clinic1Id), 'Strict tenant isolation: Clinic 1 doctors belong exclusively to Clinic 1');

  const [c1Apps, c2Apps] = await Promise.all([
    db.getAppointments(clinic1Id),
    db.getAppointments(clinic2Id),
  ]);
  assert(c1Apps.every((a) => a.clinic_id === clinic1Id), 'Strict tenant isolation: Clinic 1 appointments belong exclusively to Clinic 1');

  // 3.2 Tenant Stats Calculation
  const c1Stats = await db.getAnalytics(clinic1Id);
  assert(c1Stats && c1Stats.direct_cogs_breakdown?.total_rate_per_min === 3.23, 'Tenant stats compute exact direct COGS (₹3.23/min)');

  // ══════════════════════════════════════════════════════════════════
  // PART 4: Architecture File Tree Verification
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 1 & 2] ARCHITECTURE FILE TREE VERIFICATION');

  const requiredFiles = [
    // Phase 1: Auth & RBAC
    'src/middleware.ts',
    'src/lib/auth/session.ts',
    'src/app/login/page.tsx',
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/logout/route.ts',
    'src/app/api/auth/session/route.ts',

    // Phase 2: Admin Suite
    'src/app/admin/layout.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/clinics/page.tsx',
    'src/app/admin/calls/page.tsx',
    'src/app/api/admin/clinics/route.ts',
    'src/app/api/admin/calls/route.ts',

    // Phase 2: Clinic Suite
    'src/app/clinic/layout.tsx',
    'src/app/clinic/dashboard/page.tsx',
    'src/app/clinic/appointments/page.tsx',
    'src/app/clinic/doctors/page.tsx',
    'src/app/clinic/patients/page.tsx',
    'src/app/clinic/patients/[id]/page.tsx',
    'src/app/clinic/calls/page.tsx',
    'src/app/clinic/recordings/page.tsx',
    'src/app/clinic/settings/page.tsx',
    'src/app/clinic/faqs/page.tsx',
    'src/app/clinic/voice-engine/page.tsx',
    'src/app/api/clinic/stats/route.ts',
  ];

  for (const f of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), f);
    assert(fs.existsSync(fullPath), `File exists: ${f}`);
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================================\n');

  if (failCount > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error('Verification failed with exception:', err);
  process.exit(1);
});
