import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const maxStateAgeMs = 10 * 60 * 1000;

function encryptionKey() {
  const secret = process.env.CANVA_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CANVA_SESSION_SECRET must contain at least 32 characters.');
  }
  return createHash('sha256').update(secret).digest();
}

export function createAuthorizationState(codeVerifier) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const plaintext = Buffer.from(
    JSON.stringify({ codeVerifier, createdAt: Date.now(), nonce: randomBytes(24).toString('base64url') }),
  );
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

export function readAuthorizationState(value) {
  if (!value) throw new Error('The OAuth state parameter is missing.');

  const packed = Buffer.from(value, 'base64url');
  if (packed.length < 29) throw new Error('The OAuth state parameter is invalid.');

  const iv = packed.subarray(0, 12);
  const authTag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const state = JSON.parse(decrypted.toString('utf8'));

  if (!state.codeVerifier || !state.createdAt || Date.now() - state.createdAt > maxStateAgeMs) {
    throw new Error('The OAuth authorization request expired. Start the connection again.');
  }

  return state;
}
