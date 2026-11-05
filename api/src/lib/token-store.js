import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const tokenSecretName = 'canva-oauth-token';
const localTokenPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../.data/canva-token.json');
let secretClient;

function getSecretClient() {
  const vaultUrl = process.env.CANVA_KEY_VAULT_URL;
  if (!vaultUrl) return null;
  secretClient ??= new SecretClient(vaultUrl, new DefaultAzureCredential());
  return secretClient;
}

export function tokenStorageType() {
  return process.env.CANVA_KEY_VAULT_URL ? 'Azure Key Vault' : 'ignored local test file';
}

export async function loadTokenBundle() {
  const client = getSecretClient();
  if (client) {
    try {
      const secret = await client.getSecret(tokenSecretName);
      return JSON.parse(secret.value);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  try {
    return JSON.parse(await readFile(localTokenPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveTokenBundle(bundle) {
  const serialized = JSON.stringify(bundle);
  const client = getSecretClient();

  if (client) {
    await client.setSecret(tokenSecretName, serialized);
    return;
  }

  if (process.env.WEBSITE_INSTANCE_ID) {
    throw new Error('CANVA_KEY_VAULT_URL is required for durable token storage in Azure.');
  }

  await mkdir(dirname(localTokenPath), { recursive: true });
  await writeFile(localTokenPath, serialized, { encoding: 'utf8', mode: 0o600 });
}
