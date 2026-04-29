import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config.js';
import { generateToken, normaliseEmail } from '../crypto.js';

export interface GoogleOAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  authUrl: string;
}

export const buildGoogleAuthUrl = (): GoogleOAuthState => {
  const cfg = config();
  if (!cfg.GOOGLE_OAUTH_CLIENT_ID || !cfg.GOOGLE_OAUTH_REDIRECT) {
    throw new Error('Google OAuth is not configured');
  }
  const state = generateToken(24);
  const nonce = generateToken(16);
  const codeVerifier = randomBytes(64).toString('base64url').replace(/=+$/, '');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', cfg.GOOGLE_OAUTH_CLIENT_ID);
  u.searchParams.set('redirect_uri', cfg.GOOGLE_OAUTH_REDIRECT);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', state);
  u.searchParams.set('nonce', nonce);
  u.searchParams.set('code_challenge', codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  u.searchParams.set('access_type', 'online');
  return { state, nonce, codeVerifier, codeChallenge, authUrl: u.toString() };
};

export interface GoogleProfile {
  email: string;
  emailNormalized: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  sub: string;
}

export interface GoogleTokenSet {
  access_token: string;
  id_token: string;
  expires_in: number;
}

export const exchangeGoogleCode = async (
  code: string,
  codeVerifier: string,
): Promise<GoogleTokenSet> => {
  const cfg = config();
  const body = new URLSearchParams({
    code,
    client_id: cfg.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: cfg.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: cfg.GOOGLE_OAUTH_REDIRECT,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  return (await res.json()) as GoogleTokenSet;
};

const decodeIdToken = (idToken: string): Record<string, unknown> => {
  const [, payload] = idToken.split('.');
  if (!payload) throw new Error('malformed id_token');
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
};

export const profileFromIdToken = (idToken: string, expectedNonce: string): GoogleProfile => {
  const claims = decodeIdToken(idToken);
  if (typeof claims['nonce'] === 'string' && claims['nonce'] !== expectedNonce) {
    throw new Error('id_token nonce mismatch');
  }
  const email = String(claims['email'] ?? '');
  if (!email) throw new Error('id_token missing email');
  return {
    email,
    emailNormalized: normaliseEmail(email),
    emailVerified: claims['email_verified'] === true,
    name: claims['name'] as string | undefined,
    picture: claims['picture'] as string | undefined,
    sub: String(claims['sub']),
  };
};
