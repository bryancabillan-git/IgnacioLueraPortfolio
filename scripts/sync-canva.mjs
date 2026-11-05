import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const API_BASE = 'https://api.canva.com/rest/v1';
const folderId = process.env.CANVA_FOLDER_ID;
const outputDirectory = process.env.CANVA_OUTPUT_DIR || 'public/art/canva';
const manifestPath = process.env.CANVA_MANIFEST_PATH || 'src/data/canva-artworks.json';
const pollDelayMs = 2_000;
const maxPollAttempts = 45;

if (!folderId) {
  throw new Error('CANVA_FOLDER_ID is required. Set it to Ignacio’s dedicated Canva portfolio folder ID.');
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'untitled';
}

async function parseResponse(response, operation) {
  const rawBody = await response.text();
  let body;

  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    body = { message: rawBody };
  }

  if (!response.ok) {
    const message = body.message || `${response.status} ${response.statusText}`;
    throw new Error(`${operation} failed: ${message}`);
  }

  return body;
}

async function getAccessToken() {
  if (process.env.CANVA_ACCESS_TOKEN) {
    return process.env.CANVA_ACCESS_TOKEN;
  }

  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const refreshToken = process.env.CANVA_REFRESH_TOKEN;
  const refreshTokenOutput = process.env.CANVA_REFRESH_TOKEN_OUT;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Set CANVA_ACCESS_TOKEN, or set CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, and CANVA_REFRESH_TOKEN.',
    );
  }

  if (!refreshTokenOutput) {
    throw new Error(
      'CANVA_REFRESH_TOKEN_OUT is required when refreshing. Canva rotates refresh tokens, so the new token must be stored securely.',
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const token = await parseResponse(response, 'Canva token refresh');

  if (!token.access_token || !token.refresh_token) {
    throw new Error('Canva token refresh returned an incomplete response.');
  }

  await mkdir(dirname(refreshTokenOutput), { recursive: true });
  await writeFile(refreshTokenOutput, token.refresh_token, { encoding: 'utf8', mode: 0o600 });
  return token.access_token;
}

async function canvaRequest(path, accessToken, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  return parseResponse(response, `${init.method || 'GET'} ${path}`);
}

async function listDesigns(accessToken) {
  const designs = [];
  let continuation;

  do {
    const query = new URLSearchParams({
      item_types: 'design',
      limit: '100',
      sort_by: 'modified_descending',
    });
    if (continuation) query.set('continuation', continuation);

    const body = await canvaRequest(
      `/folders/${encodeURIComponent(folderId)}/items?${query.toString()}`,
      accessToken,
    );

    for (const item of body.items || []) {
      if (item.type === 'design' && item.design) designs.push(item.design);
    }
    continuation = body.continuation;
  } while (continuation);

  return designs;
}

async function exportDesign(designId, accessToken) {
  const started = await canvaRequest('/exports', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      design_id: designId,
      format: {
        type: 'jpg',
        quality: 92,
        width: 2_000,
        export_quality: 'regular',
      },
    }),
  });

  let job = started.job;
  for (let attempt = 0; attempt < maxPollAttempts && job?.status === 'in_progress'; attempt += 1) {
    await sleep(pollDelayMs);
    const result = await canvaRequest(`/exports/${encodeURIComponent(job.id)}`, accessToken);
    job = result.job;
  }

  if (job?.status === 'failed') {
    throw new Error(`Canva export ${job.id} failed: ${job.error?.message || job.error?.code || 'unknown error'}`);
  }
  if (job?.status !== 'success' || !Array.isArray(job.urls) || job.urls.length === 0) {
    throw new Error(`Canva export for design ${designId} did not finish in time.`);
  }

  return job.urls;
}

async function downloadImage(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Artwork download failed: ${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
}

async function readExistingManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function metadataFromTitle(rawTitle) {
  const parts = (rawTitle || 'Untitled').split('|').map((part) => part.trim());
  return {
    title: parts[0] || 'Untitled',
    medium: parts[1] || 'Details to be provided',
    year: parts[2] || 'Year',
    collection: parts[3] || 'Portfolio',
  };
}

async function main() {
  const accessToken = await getAccessToken();
  const designs = await listDesigns(accessToken);
  const existing = await readExistingManifest();
  const existingByPage = new Map(
    existing.map((artwork) => [`${artwork.canvaDesignId}:${artwork.canvaPage || 1}`, artwork]),
  );
  const nextManifest = [];

  await mkdir(outputDirectory, { recursive: true });

  for (const [designIndex, design] of designs.entries()) {
    const pageCount = design.page_count || 1;
    const existingPages = Array.from({ length: pageCount }, (_, index) =>
      existingByPage.get(`${design.id}:${index + 1}`),
    );
    const unchanged =
      existingPages.every(Boolean) &&
      existingPages.every(
        (artwork) =>
          artwork.canvaUpdatedAt === design.updated_at &&
          existsSync(join(outputDirectory, basename(artwork.image))),
      );

    if (unchanged) {
      nextManifest.push(...existingPages);
      console.log(`Unchanged: ${design.title || design.id}`);
      continue;
    }

    console.log(`Exporting: ${design.title || design.id}`);
    const urls = await exportDesign(design.id, accessToken);
    const parsedTitle = metadataFromTitle(design.title);
    const idSuffix = design.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase();
    const baseSlug = `${slugify(parsedTitle.title)}-${idSuffix}`;

    for (const [pageIndex, url] of urls.entries()) {
      const pageNumber = pageIndex + 1;
      const pageSuffix = urls.length > 1 ? `-page-${pageNumber}` : '';
      const slug = `${baseSlug}${pageSuffix}`;
      const filename = `${slug}.jpg`;
      const oldArtwork = existingByPage.get(`${design.id}:${pageNumber}`);

      await downloadImage(url, join(outputDirectory, filename));

      nextManifest.push({
        slug,
        title: oldArtwork?.title || `${parsedTitle.title}${urls.length > 1 ? ` — Page ${pageNumber}` : ''}`,
        image: `/art/canva/${filename}`,
        alt: oldArtwork?.alt || `${parsedTitle.title} by Ignacio Luera`,
        medium: oldArtwork?.medium || parsedTitle.medium,
        year: oldArtwork?.year || parsedTitle.year,
        dimensions: oldArtwork?.dimensions || '',
        collection: oldArtwork?.collection || parsedTitle.collection,
        description: oldArtwork?.description || 'Artwork description to be provided.',
        featured: oldArtwork?.featured ?? designIndex < 3,
        canvaDesignId: design.id,
        canvaPage: pageNumber,
        canvaUpdatedAt: design.updated_at,
      });
    }
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
  console.log(`Synchronized ${nextManifest.length} artwork page(s) from ${designs.length} Canva design(s).`);
}

await main();
