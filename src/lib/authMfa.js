import { appParams } from '@/lib/app-params';
import { base44 } from '@/api/base44Client';

function getAppId() {
  const appId = appParams.appId;
  if (typeof appId !== 'string' || !/^[a-f0-9]{24}$/i.test(appId)) throw new Error('Invalid app ID');
  return appId;
}

function authPath(/** @type {string} */ suffix) {
  return `/api/apps/${getAppId()}/auth/${suffix}`;
}

async function post(
  /** @type {string} */ suffix,
  /** @type {Record<string, unknown>} */ body,
  /** @type {string | undefined} */ token
) {
  const response = await fetch(authPath(suffix), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || result.detail || 'Unable to sign in');
  return result;
}

export async function loginWithMfa(/** @type {string} */ email, /** @type {string} */ password) {
  const result = await post('login', { email, password }, undefined);
  if (result.access_token) base44.auth.setToken(result.access_token);
  return result;
}

export async function continueMfa(/** @type {{ mfa_session_token?: string }} */ result, /** @type {string | undefined} */ returnTo) {
  const encode = (/** @type {Uint8Array} */ bytes) =>
    btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const { code } = await post('mfa/handoff', { code_challenge: challenge }, result.mfa_session_token);
  sessionStorage.setItem(`app-mfa-pkce:${getAppId()}`, verifier);
  const url = new URL('/auth/mfa', window.location.origin);
  const params = new URLSearchParams({ app_id: getAppId(), mfa_code: code, from_url: returnTo ?? '' });
  url.search = params.toString();
  window.location.assign(url.href);
}

// provider: 'google' | 'microsoft' | 'facebook' | 'apple'
export async function loginWithSocial(/** @type {'google' | 'microsoft' | 'facebook' | 'apple'} */ provider, /** @type {string | undefined} */ returnTo) {
  const appId = getAppId();
  const response = await fetch(`/api/apps/public/login-info/by-id/${appId}`);
  if (!response.ok) throw new Error('Unable to load sign-in options');
  const info = await response.json();
  if (info.auth_config?.mfa_policy !== 'required') return base44.auth.loginWithProvider(provider, returnTo);
  const url = new URL('/auth/mfa', window.location.origin);
  const params = new URLSearchParams({ app_id: appId, oauth_start: provider, from_url: returnTo ?? '' });
  url.search = params.toString();
  window.location.assign(url.href);
}

export function loginWithGoogle(/** @type {string | undefined} */ returnTo) {
  return loginWithSocial('google', returnTo);
}
