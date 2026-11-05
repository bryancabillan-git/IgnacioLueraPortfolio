export class UnauthorizedError extends Error {
  constructor(message = 'Authentication is required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function getClientPrincipal(request) {
  const encoded = request.headers.get('x-ms-client-principal');
  if (!encoded) return null;

  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function requireAuthenticated(request) {
  const principal = getClientPrincipal(request);
  if (!principal?.userRoles?.includes('authenticated')) {
    throw new UnauthorizedError();
  }
  return principal;
}
