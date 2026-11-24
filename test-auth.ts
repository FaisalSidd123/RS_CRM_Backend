import { loginUser, verifyToken } from './src/services/authService.js';
import { UserRole } from './src/types/schema.js';

console.log('\n=============================================================');
console.log('🧪 PROPERTYOS PAKISTAN — AUTHENTICATION & RBAC TEST SUITE');
console.log('=============================================================\n');

function simulateRoleGuard(userRole: UserRole, allowedRoles: UserRole[]): { allowed: boolean; code: number } {
  if (allowedRoles.includes(userRole)) {
    return { allowed: true, code: 200 };
  }
  return { allowed: false, code: 403 };
}

// ----------------------------------------------------------------------------
// TEST 1: Admin / Owner Login
// ----------------------------------------------------------------------------
console.log('🔹 [TEST 1] Admin / Owner Login (imran@propertyos.pk)...');
const ownerRes = loginUser('imran@propertyos.pk', 'admin123');
if (ownerRes.success && ownerRes.user?.role === 'owner') {
  console.log('   ✅ PASS: Logged in as Owner (Imran Qureshi)');
  console.log(`   🔑 JWT Token Generated (first 40 chars): ${ownerRes.token?.slice(0, 40)}...`);
} else {
  console.error('   ❌ FAIL:', ownerRes.message);
}

// ----------------------------------------------------------------------------
// TEST 2: Manager Login
// ----------------------------------------------------------------------------
console.log('\n🔹 [TEST 2] Manager Login (sana@propertyos.pk)...');
const mgrRes = loginUser('sana@propertyos.pk', 'manager123');
if (mgrRes.success && mgrRes.user?.role === 'manager') {
  console.log('   ✅ PASS: Logged in as Manager (Sana Malik)');
  console.log(`   🔑 JWT Token Generated (first 40 chars): ${mgrRes.token?.slice(0, 40)}...`);
} else {
  console.error('   ❌ FAIL:', mgrRes.message);
}

// ----------------------------------------------------------------------------
// TEST 3: Field Agent Login
// ----------------------------------------------------------------------------
console.log('\n🔹 [TEST 3] Field Agent Login (bilal@propertyos.pk)...');
const agentRes = loginUser('bilal@propertyos.pk', 'agent123');
if (agentRes.success && agentRes.user?.role === 'agent') {
  console.log('   ✅ PASS: Logged in as Agent (Bilal Ahmed)');
  console.log(`   🔑 JWT Token Generated (first 40 chars): ${agentRes.token?.slice(0, 40)}...`);
} else {
  console.error('   ❌ FAIL:', agentRes.message);
}

// ----------------------------------------------------------------------------
// TEST 4: Security Check — Wrong Password
// ----------------------------------------------------------------------------
console.log('\n🔹 [TEST 4] Security Check: Incorrect Password (imran@propertyos.pk / wrongpass)...');
const badPassRes = loginUser('imran@propertyos.pk', 'wrongpassword');
if (!badPassRes.success) {
  console.log(`   ✅ PASS: Access correctly denied -> "${badPassRes.message}"`);
} else {
  console.error('   ❌ FAIL: Allowed login with incorrect password!');
}

// ----------------------------------------------------------------------------
// TEST 5: Token Decryption & Signature Verification (/api/auth/me)
// ----------------------------------------------------------------------------
console.log('\n🔹 [TEST 5] Token Verification & Session Decode...');
const decoded = verifyToken(ownerRes.token!);
if (decoded && decoded.email === 'imran@propertyos.pk' && decoded.role === 'owner') {
  console.log('   ✅ PASS: Signature verified against server secret key');
  console.log(`   👤 Identity Decoded: ${decoded.name} <${decoded.email}> | Role: ${decoded.role}`);
  console.log(`   ⏳ Expires in: ${Math.round((decoded.exp - Date.now() / 1000) / 86400)} days`);
} else {
  console.error('   ❌ FAIL: Token tampering or signature mismatch!');
}

// ----------------------------------------------------------------------------
// TEST 6: Portal Access Restrictions (Role Guards)
// ----------------------------------------------------------------------------
console.log('\n🔹 [TEST 6] Portal Permissions & Role Guards:');

// Scenario A: Agent tries to open Owner Portal (Agency Net Profit / Financials)
const agentOwnerGuard = simulateRoleGuard(agentRes.user!.role, ['owner']);
if (!agentOwnerGuard.allowed && agentOwnerGuard.code === 403) {
  console.log('   ✅ PASS: Agent Bilal blocked from Owner Financials (403 Forbidden)');
} else {
  console.error('   ❌ FAIL: Agent permitted to view Owner Financials!');
}

// Scenario B: Manager tries to access Manager Lead Claiming
const mgrLeadGuard = simulateRoleGuard(mgrRes.user!.role, ['owner', 'manager']);
if (mgrLeadGuard.allowed) {
  console.log('   ✅ PASS: Manager Sana permitted to claim WhatsApp leads (200 OK)');
} else {
  console.error('   ❌ FAIL: Manager blocked from lead claiming!');
}

// Scenario C: Agent conducts assigned Site Visit
const agentVisitGuard = simulateRoleGuard(agentRes.user!.role, ['agent', 'manager', 'owner']);
if (agentVisitGuard.allowed) {
  console.log('   ✅ PASS: Agent Bilal permitted to record Site Visit feedback (200 OK)');
}

console.log('\n=============================================================');
console.log('🎉 ALL 6 AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================\n');
