const crypto = require('node:crypto');
const { getRedis } = require('./redis');
const { buildPublicRpgSnapshot } = require('./rpg');

const SESSION_TTL = 60 * 60 * 24 * 30;
const SESSION_COOKIE = 'phuc_session';
const CSRF_COOKIE = 'phuc_csrf';
const USER_PREFIX = 'phuc:user:';
const SESSION_PREFIX = 'phuc:session:';

function jsonCookie(value, { httpOnly = false, maxAge = 0 } = {}) {
  const parts = [
    `${value ? '' : ''}`,
    'Path=/',
    'SameSite=Lax'
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (maxAge > 0) parts.push(`Max-Age=${maxAge}`);
  if (process.env.VERCEL === '1') parts.push('Secure');
  return parts.filter(Boolean).join('; ');
}

function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  for (const piece of raw.split(';')) {
    const i = piece.indexOf('=');
    if (i < 0) continue;
    const k = piece.slice(0, i).trim();
    const v = piece.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(res, name, value, options = {}) {
  const serialized = `${name}=${encodeURIComponent(value)}; ${jsonCookie(value, options).replace(/^;\s*/, '')}`;
  const previous = res.getHeader?.('Set-Cookie');
  const list = Array.isArray(previous) ? previous.slice() : previous ? [previous] : [];
  list.push(serialized);
  res.setHeader('Set-Cookie', list);
}

function clearCookie(res, name) {
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax'
  ];
  if (process.env.VERCEL === '1') parts.push('Secure');
  res.setHeader('Set-Cookie', [parts.join('; ')]);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isAdminUsername(username) {
  const defaults = ['admin', 'phuck9', 'thanhphuc', 'phuck9admin'];
  const raw = String(process.env.ADMIN_USERNAME || process.env.ADMINUSER || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
  const allAdmins = new Set([...defaults, ...raw]);
  return allAdmins.has(normalizeUsername(username));
}

function isAdminAccount(user) {
  if (!user) return false;
  return Boolean(user.is_admin || user.role === 'admin' || isAdminUsername(user.username));
}

function validUsername(username) {
  return /^[a-zA-Z0-9._-]{3,40}$/.test(username);
}

function hashPassword(password, saltHex = null) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

function verifyPassword(password, record) {
  try {
    const salt = Buffer.from(record.salt, 'hex');
    const expected = Buffer.from(record.password_hash, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function safeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password_hash;
  delete copy.salt;
  copy.rpg = buildPublicRpgSnapshot(copy);
  return copy;
}

async function createSession(res, username, csrfFromClient = '') {
  const redis = getRedis();
  const token = crypto.randomBytes(32).toString('hex');
  const csrf = csrfFromClient || crypto.randomBytes(24).toString('hex');
  const session = { username, csrf, created_at: new Date().toISOString() };
  await redis.set(`${SESSION_PREFIX}${token}`, session, { ex: SESSION_TTL });
  setCookie(res, SESSION_COOKIE, token, { httpOnly: true, maxAge: SESSION_TTL });
  setCookie(res, CSRF_COOKIE, csrf, { httpOnly: false, maxAge: SESSION_TTL });
  return { token, csrf };
}

async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const redis = getRedis();
  let session = await redis.get(`${SESSION_PREFIX}${token}`);
  if (!session) return null;
  if (typeof session === 'string') {
    try { session = JSON.parse(session); } catch { return null; }
  }
  if (!session?.username) return null;
  return { token, ...session };
}

async function getCsrf(req, res) {
  const cookies = parseCookies(req);
  if (cookies[CSRF_COOKIE]) return cookies[CSRF_COOKIE];
  const csrf = crypto.randomBytes(24).toString('hex');
  setCookie(res, CSRF_COOKIE, csrf, { httpOnly: false, maxAge: SESSION_TTL });
  return csrf;
}

function requireCsrf(req, sessionOrNull, allowAnonymousCsrf) {
  const header = String(req.headers?.['x-csrf-token'] || '');
  const cookies = parseCookies(req);
  const expected = sessionOrNull?.csrf || cookies[CSRF_COOKIE] || allowAnonymousCsrf || '';
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getUserByUsername(username) {
  const redis = getRedis();
  let user = await redis.get(`${USER_PREFIX}${normalizeUsername(username)}`);
  if (typeof user === 'string') {
    try { user = JSON.parse(user); } catch { return null; }
  }
  return user || null;
}

module.exports = {
  SESSION_TTL,
  SESSION_COOKIE,
  CSRF_COOKIE,
  USER_PREFIX,
  SESSION_PREFIX,
  parseCookies,
  setCookie,
  clearCookie,
  sendJson,
  normalizeUsername,
  validUsername,
  hashPassword,
  verifyPassword,
  safeUser,
  createSession,
  getSession,
  getCsrf,
  requireCsrf,
  getUserByUsername,
  isAdminUsername,
  isAdminAccount
};
