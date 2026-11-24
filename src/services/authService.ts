import crypto from 'crypto';
import { User, UserRole } from '../types/schema.js';
import { store } from './storeService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'propertyos_pakistan_jwt_secret_key_2026';

// Extend store user with password hash
interface UserWithAuth extends User {
  passwordHash: string;
  salt: string;
}

// Map user IDs to their password credentials
const credentialsMap = new Map<string, { hash: string; salt: string }>();

/**
 * Hash password using PBKDF2 (NIST approved, standard in Node.js crypto)
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
}

// Seed default passwords on startup
function initSeedCredentials() {
  const defaultAccounts = [
    { id: 'usr-owner-1', password: 'admin123' },
    { id: 'usr-owner-2', password: 'admin123' },
    { id: 'usr-mgr-1', password: 'manager123' },
    { id: 'usr-mgr-2', password: 'manager123' },
    { id: 'usr-mgr-3', password: 'manager123' },
    { id: 'usr-agent-1', password: 'agent123' },
    { id: 'usr-agent-2', password: 'agent123' },
    { id: 'usr-agent-3', password: 'agent123' },
    { id: 'usr-agent-4', password: 'agent123' },
  ];

  for (const acc of defaultAccounts) {
    if (!credentialsMap.has(acc.id)) {
      const { hash, salt } = hashPassword(acc.password);
      credentialsMap.set(acc.id, { hash, salt });
    }
  }
}

initSeedCredentials();

/**
 * Sign standard JWT (HMAC-SHA256) without external packages
 */
export function generateToken(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verify JWT
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Payload, signature] = parts;
    const data = `${b64Header}.${b64Payload}`;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');

    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Login user
 */
export function loginUser(email: string, password: string): { success: boolean; token?: string; user?: User; message: string } {
  const cleanEmail = email.toLowerCase().trim();
  const user = store.users.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      u.email.split('@')[0] === cleanEmail.split('@')[0]
  );
  if (!user || !user.isActive) {
    return { success: false, message: 'Invalid email or password' };
  }

  const creds = credentialsMap.get(user.id);
  if (!creds || !verifyPassword(password, creds.hash, creds.salt)) {
    return { success: false, message: 'Invalid email or password' };
  }

  const token = generateToken(user);
  return {
    success: true,
    token,
    user,
    message: `Logged in successfully as ${user.role}`,
  };
}

/**
 * Register / Create a new team account
 */
export function registerUser(params: {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
}): { success: boolean; user?: User; token?: string; message: string } {
  const { name, email, phone, role, password } = params;

  if (!name || !email || !password || !role) {
    return { success: false, message: 'Name, email, role, and password are required' };
  }

  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { success: false, message: 'An account with this email already exists' };
  }

  const userId = `usr-${role}-${Date.now()}`;
  const { hash, salt } = hashPassword(password);
  credentialsMap.set(userId, { hash, salt });

  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    phone: phone || '0300-0000000',
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.addUser(newUser);
  const token = generateToken(newUser);

  return {
    success: true,
    user: newUser,
    token,
    message: `Account created successfully for ${name} (${role})`,
  };
}
