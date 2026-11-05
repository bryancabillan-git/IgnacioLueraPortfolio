import { app } from '@azure/functions';
import { requireAuthenticated } from '../lib/auth.js';
import { createAuthorizationState, readAuthorizationState } from '../lib/auth-state.js';
import {
  buildAuthorizationUrl,
  createExport,
  createPkcePair,
  exchangeAuthorizationCode,
  getExport,
  listFolderItems,
} from '../lib/canva.js';
import { loadTokenBundle, tokenStorageType } from '../lib/token-store.js';
import { handleError, json } from '../lib/responses.js';

function redirectUri() {
  const value = process.env.CANVA_REDIRECT_URI;
  if (!value) throw new Error('CANVA_REDIRECT_URI must be configured.');
  return value;
}

async function status(request, context) {
  try {
    const principal = requireAuthenticated(request);
    const token = await loadTokenBundle();
    return json(200, {
      authenticatedAs: principal.userDetails || principal.userId || 'authenticated user',
      configured: Boolean(
        process.env.CANVA_CLIENT_ID &&
          process.env.CANVA_CLIENT_SECRET &&
          process.env.CANVA_SESSION_SECRET &&
          process.env.CANVA_REDIRECT_URI,
      ),
      connected: Boolean(token?.refresh_token),
      accessTokenActive: Boolean(token?.access_token && token.expires_at > Date.now()),
      accessTokenExpiresAt: token?.expires_at ? new Date(token.expires_at).toISOString() : null,
      redirectUri: process.env.CANVA_REDIRECT_URI || null,
      tokenStorage: tokenStorageType(),
    });
  } catch (error) {
    return handleError(error, context);
  }
}

async function authStart(request, context) {
  try {
    requireAuthenticated(request);
    const { codeVerifier, codeChallenge } = createPkcePair();
    const state = createAuthorizationState(codeVerifier);
    const location = buildAuthorizationUrl({ codeChallenge, state, redirectUri: redirectUri() });
    return { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } };
  } catch (error) {
    return handleError(error, context);
  }
}

async function authCallback(request, context) {
  try {
    requireAuthenticated(request);
    const oauthError = request.query.get('error');
    if (oauthError) throw new Error(`Canva declined authorization: ${oauthError}`);

    const code = request.query.get('code');
    if (!code) throw new Error('Canva did not return an authorization code.');
    const state = readAuthorizationState(request.query.get('state'));

    await exchangeAuthorizationCode({
      code,
      codeVerifier: state.codeVerifier,
      redirectUri: redirectUri(),
    });

    return {
      status: 302,
      headers: { Location: '/test/?canva=connected', 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error(error instanceof Error ? error.message : error);
    return {
      status: 302,
      headers: { Location: '/test/?canva=error', 'Cache-Control': 'no-store' },
    };
  }
}

async function folders(request, context) {
  try {
    requireAuthenticated(request);
    const parentId = request.query.get('parentId') || 'root';
    const items = await listFolderItems(parentId, 'folder');
    return json(
      200,
      items.map(({ folder }) => ({
        id: folder.id,
        name: folder.name,
        updatedAt: folder.updated_at,
        thumbnail: folder.thumbnail?.url || null,
      })),
    );
  } catch (error) {
    return handleError(error, context);
  }
}

async function designs(request, context) {
  try {
    requireAuthenticated(request);
    const folderId = request.query.get('folderId');
    if (!folderId) return json(400, { error: 'folderId is required.' });

    const items = await listFolderItems(folderId, 'design');
    return json(
      200,
      items.map(({ design }) => ({
        id: design.id,
        title: design.title || 'Untitled',
        updatedAt: design.updated_at,
        pageCount: design.page_count || 1,
        thumbnail: design.thumbnail?.url || null,
      })),
    );
  } catch (error) {
    return handleError(error, context);
  }
}

async function exportsCreate(request, context) {
  try {
    requireAuthenticated(request);
    const body = await request.json();
    if (!body?.designId) return json(400, { error: 'designId is required.' });
    const result = await createExport(body.designId);
    return json(202, result.job);
  } catch (error) {
    return handleError(error, context);
  }
}

async function exportsGet(request, context) {
  try {
    requireAuthenticated(request);
    const exportId = request.params.exportId;
    if (!exportId) return json(400, { error: 'exportId is required.' });
    const result = await getExport(exportId);
    return json(200, result.job);
  } catch (error) {
    return handleError(error, context);
  }
}

app.http('canvaStatus', {
  route: 'canva/status',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: status,
});

app.http('canvaAuthStart', {
  route: 'canva/auth/start',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: authStart,
});

app.http('canvaAuthCallback', {
  route: 'canva/callback',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: authCallback,
});

app.http('canvaFolders', {
  route: 'canva/folders',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: folders,
});

app.http('canvaDesigns', {
  route: 'canva/designs',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: designs,
});

app.http('canvaExportsCreate', {
  route: 'canva/exports',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: exportsCreate,
});

app.http('canvaExportsGet', {
  route: 'canva/exports/{exportId}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: exportsGet,
});
