import { createHash, randomBytes } from 'node:crypto';
import { loadTokenBundle, saveTokenBundle } from './token-store.js';

const apiBase = 'https://api.canva.com/rest/v1';
const authorizeUrl = 'https://www.canva.com/api/oauth/authorize';
const scopes = ['folder:read', 'design:content:read'];

function credentials() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('CANVA_CLIENT_ID and CANVA_CLIENT_SECRET must be configured.');
  }
  return { clientId, clientSecret };
}

async function parseResponse(response, operation) {
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = { message: raw };
  }

  if (!response.ok) {
    throw new Error(`${operation} failed: ${body.message || `${response.status} ${response.statusText}`}`);
  }
  return body;
}

async function requestToken(parameters) {
  const { clientId, clientSecret } = credentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${apiBase}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(parameters),
  });
  return parseResponse(response, 'Canva token request');
}

function normalizeToken(token) {
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + Number(token.expires_in || 0) * 1000,
    scope: token.scope || scopes.join(' '),
  };
}

export function createPkcePair() {
  const codeVerifier = randomBytes(96).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl({ codeChallenge, state, redirectUri }) {
  const { clientId } = credentials();
  const url = new URL(authorizeUrl);
  url.search = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 's256',
    scope: scopes.join(' '),
    response_type: 'code',
    client_id: clientId,
    state,
    redirect_uri: redirectUri,
  }).toString();
  return url.toString();
}

export async function exchangeAuthorizationCode({ code, codeVerifier, redirectUri }) {
  const token = await requestToken({
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
    code,
    redirect_uri: redirectUri,
  });
  const bundle = normalizeToken(token);
  await saveTokenBundle(bundle);
  return bundle;
}

export async function getAccessToken() {
  const bundle = await loadTokenBundle();
  if (!bundle) throw new Error('No Canva account is connected.');

  if (bundle.access_token && bundle.expires_at > Date.now() + 60_000) {
    return bundle.access_token;
  }
  if (!bundle.refresh_token) throw new Error('The stored Canva refresh token is missing.');

  const refreshed = normalizeToken(
    await requestToken({ grant_type: 'refresh_token', refresh_token: bundle.refresh_token }),
  );
  await saveTokenBundle(refreshed);
  return refreshed.access_token;
}

async function apiRequest(path, init = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  return parseResponse(response, `${init.method || 'GET'} ${path}`);
}

export async function listFolderItems(folderId = 'root', itemTypes = 'folder') {
  const items = [];
  let continuation;

  do {
    const query = new URLSearchParams({ item_types: itemTypes, limit: '100', sort_by: 'modified_descending' });
    if (continuation) query.set('continuation', continuation);
    const body = await apiRequest(
      `/folders/${encodeURIComponent(folderId)}/items?${query.toString()}`,
    );
    items.push(...(body.items || []));
    continuation = body.continuation;
  } while (continuation);

  return items;
}

export async function createExport(designId) {
  return apiRequest('/exports', {
    method: 'POST',
    body: JSON.stringify({
      design_id: designId,
      format: { type: 'jpg', quality: 92, width: 2000, export_quality: 'regular' },
    }),
  });
}

export async function getExport(exportId) {
  return apiRequest(`/exports/${encodeURIComponent(exportId)}`);
}
