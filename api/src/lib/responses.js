import { UnauthorizedError } from './auth.js';

export function json(status, body) {
  return {
    status,
    jsonBody: body,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  };
}

export function handleError(error, context) {
  if (error instanceof UnauthorizedError) return json(401, { error: error.message });
  context.error(error instanceof Error ? error.message : error);
  return json(500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
}
