# Ignacio Luera Portfolio

A static, image-first portfolio for visual artist and educator Ignacio Luera. The site uses Astro, deploys to Azure Static Web Apps, and includes an opt-in Canva synchronization utility.

Project and billing documentation: [`WORK-LOG.md`](WORK-LOG.md)

## Current status

The website is complete as a responsive working draft. Ignacio’s biography, education, email address, Instagram profile, and Facebook profile are included. It still uses placeholders for content that Ignacio must approve or supply:

- Original artwork files
- Artist statement
- Portrait or studio photograph
- Exhibition and additional teaching history
- Artwork medium, year, dimensions, and descriptions

The existing Canva portfolio remains linked from the Contact page and footer.

## Run locally

Requirements: Node.js 22 or newer.

```powershell
npm install
npm run dev
```

Open the local address printed by Astro. For a production check:

```powershell
npm run build
```

## Internal Canva OAuth test page

The protected `/test/` page tests Canva authorization, folder discovery, live design thumbnails, and asynchronous JPG exports before the customer account is connected. The browser never receives the Canva client secret or refresh token.

### 1. Configure the Canva test app

In Canva’s Developer Portal, create an **Outside Canva** REST API integration with these scopes:

- `folder:read`
- `design:content:read`

Add this exact local redirect URL:

```text
http://localhost:4280/api/canva/callback
```

Copy the Client ID and generate a Client Secret. Do not add the secret to Git or browser code.

### 2. Create local settings

Copy `api/local.settings.example.json` to `api/local.settings.json`:

```powershell
Copy-Item "api/local.settings.example.json" "api/local.settings.json"
```

Generate a random session-encryption secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Open the ignored `api/local.settings.json` and replace:

- `paste-client-id-here`
- `paste-client-secret-here`
- `replace-with-at-least-32-random-characters`

The local OAuth token is stored in ignored file `api/.data/canva-token.json`. Delete that file to disconnect the local test account.

### 3. Run the integrated local site

```powershell
npm install
npm --prefix api install
npm run dev:canva
```

Open <http://localhost:4280/test/>. Use the Static Web Apps emulator login, select **Connect test Canva account**, approve access in Canva, load the test folder, and pull its designs.

The **Refresh every 60 seconds** option retrieves current folder metadata and short-lived thumbnails from Canva. **Test JPG export** exercises Canva’s asynchronous export API. This validates the integration but does not publish test-account designs to the public Work page.

### 4. Production token storage

Local file storage is intentionally blocked in Azure. Before deploying the test API, configure `CANVA_KEY_VAULT_URL` and grant the Static Web App’s managed identity permission to read and write the Key Vault secret named `canva-oauth-token`.

The Test page and `/api/canva/*` routes are protected with the Static Web Apps `authenticated` role. Before customer launch, remove the Test navigation link and route or restrict it to a custom administrator role.

## Content locations

- Site details: `src/config.ts`
- Placeholder and synchronized artwork loader: `src/data/artworks.ts`
- Canva-generated catalog: `src/data/canva-artworks.json`
- Placeholder images: `public/art/`
- Biography: `src/pages/about.astro`
- Homepage artist statement: `src/pages/index.astro`

When `src/data/canva-artworks.json` contains artwork, the site automatically stops showing placeholder artwork.

## Artwork naming convention in Canva

Put each public artwork design in a dedicated Canva folder. A design title can provide basic metadata using this format:

```text
Artwork title | Medium | Year | Collection
```

Example:

```text
Blue Memory | Acrylic on canvas | 2025 | Memory Studies
```

The synchronizer preserves manually edited metadata already present in `canva-artworks.json` when a design is re-exported.

## Manual Canva synchronization

Create a Canva developer integration and request these scopes:

- `folder:read`
- `design:content:read`

After Ignacio authorizes the integration, set a temporary access token and the dedicated portfolio folder ID:

```powershell
$env:CANVA_ACCESS_TOKEN = "temporary-access-token"
$env:CANVA_FOLDER_ID = "portfolio-folder-id"
npm run sync:canva
```

The script lists the designs in that folder, exports changed designs as JPG files, saves permanent copies under `public/art/canva/`, and regenerates `src/data/canva-artworks.json`.

Never place tokens in browser code, Git, or `src/config.ts`. Canva's exported download URLs are temporary, so the synchronizer downloads each result instead of placing the temporary URL in the website.

## Automated Canva synchronization

`.github/workflows/sync-canva.yml` contains a manual workflow prepared for secure refresh-token rotation through Azure Key Vault. It is not scheduled by default, which prevents failed or unsafe runs before configuration is complete.

Configure these GitHub repository variables:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `CANVA_KEY_VAULT_NAME`
- `CANVA_CLIENT_ID`
- `CANVA_FOLDER_ID`

Configure this GitHub repository secret:

- `CANVA_CLIENT_SECRET`

Create a Key Vault secret named `canva-oauth-token`. Its value is the JSON token bundle created by the OAuth callback. Grant the GitHub OIDC identity permission to read and update that secret. Run the workflow manually once. After it succeeds, automation can be enabled by adding this trigger to the workflow:

```yaml
schedule:
  - cron: "17 */6 * * *"
```

The non-round minute reduces the likelihood of GitHub Actions schedule congestion.

## Azure Static Web Apps deployment

1. Create an Azure Static Web App connected to this repository.
2. Add its deployment token as the GitHub repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. Add the Canva settings and `CANVA_KEY_VAULT_URL` as Static Web App application settings.
4. Run **Deploy to Azure Static Web Apps** manually.
5. Set the `SITE_URL` build environment variable after assigning the production domain.
6. After one successful deployment, restore the workflow’s push trigger if continuous deployment is desired:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

The deployment workflow uses:

- App location: `/`
- API location: `api`
- Output location: `dist`

## API and platform references

- [Canva OAuth authentication](https://www.canva.dev/docs/connect/authentication/)
- [List Canva folder items](https://www.canva.dev/docs/connect/api-reference/folders/list-folder-items/)
- [Create a Canva design export job](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/)
- [Get a Canva design export job](https://www.canva.dev/docs/connect/api-reference/exports/get-design-export-job/)
- [Generate or refresh a Canva access token](https://www.canva.dev/docs/connect/api-reference/authentication/generate-access-token/)
- [Azure Static Web Apps API overview](https://learn.microsoft.com/azure/static-web-apps/apis-overview)
- [Azure Static Web Apps authentication](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization)
- [Azure Static Web Apps local development](https://learn.microsoft.com/azure/static-web-apps/local-development)

The integration notes above paraphrase the linked documentation for licensing compliance.
