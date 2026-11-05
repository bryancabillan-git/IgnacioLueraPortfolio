# Ignacio Luera Portfolio

A static, image-first portfolio for visual artist and educator Ignacio Luera. The site is built with Astro and prepared for deployment to Azure Static Web Apps.

Project and billing documentation: [`WORK-LOG.md`](WORK-LOG.md)

## Project approach

The portfolio is intentionally static. Artwork files and metadata are managed directly in this repository. The earlier Canva API experiment was removed to reduce authentication, secret-storage, runtime, and maintenance requirements.

The existing Canva portfolio remains linked from the Contact page and footer, but this site does not call Canva APIs or retrieve Canva content automatically.

## Current status

The website includes:

- Responsive Home, Work, About, Contact, and 404 pages
- Ignacio’s biography and education history
- Email, Instagram, and Facebook links
- Filterable artwork gallery
- Accessible full-screen artwork viewer
- Azure Static Web Apps configuration and deployment workflow

Content still needed before launch:

- Original artwork files
- Artist statement
- Portrait or studio photograph
- Exhibition and additional teaching history
- Artwork titles, media, years, dimensions, descriptions, and collections

## Run locally

Requirements: Node.js 22 or newer.

```powershell
Set-Location "C:\Users\Bryan Skyline\Documents\Kiro\IgnacioLueraPortfolio"
npm install
npm run dev
```

Open the local address printed by Astro, normally <http://localhost:4321>.

For a production check:

```powershell
npm run build
```

The production output is generated in `dist/`.

## Add or update artwork

### 1. Add the image

Copy the approved image into:

```text
public/art/
```

Use a lowercase, descriptive filename without spaces, for example:

```text
blue-memory.jpg
```

WebP or AVIF is preferred for large artwork photographs when an optimized copy is available. Keep a separate archival original outside the website repository.

### 2. Add the artwork record

Open:

```text
src/data/artworks.ts
```

Add an object to the `artworks` array:

```typescript
{
  slug: 'blue-memory',
  title: 'Blue Memory',
  image: '/art/blue-memory.jpg',
  alt: 'Description of the visible artwork for screen-reader users',
  medium: 'Acrylic on canvas',
  year: '2026',
  dimensions: '24 × 36 in.',
  collection: 'Memory Studies',
  description: 'Ignacio’s approved description of the artwork.',
  featured: true,
},
```

Set `featured: true` to make a piece eligible for the homepage. The homepage displays the first three featured records.

### 3. Validate the site

```powershell
npm run build
```

Review the Home and Work pages before committing the changes.

## Content locations

- Site details and contact links: `src/config.ts`
- Artwork catalog: `src/data/artworks.ts`
- Artwork images: `public/art/`
- Biography and education: `src/pages/about.astro`
- Homepage and artist-statement placeholder: `src/pages/index.astro`
- Contact page: `src/pages/contact.astro`
- Shared visual styles: `src/styles/global.css`

## Azure Static Web Apps deployment

The deployment workflow is located at:

```text
.github/workflows/azure-static-web-apps.yml
```

To deploy:

1. Create an Azure Static Web App connected to this GitHub repository.
2. Add its deployment token as the GitHub repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. Set the `SITE_URL` build environment variable to the final production URL.
4. Run **Deploy to Azure Static Web Apps** from the repository’s Actions page.

The workflow currently runs manually to avoid failed deployments before the Azure resource and token are configured. After one successful deployment, continuous deployment can be enabled with:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

Build settings:

- App location: `/`
- API location: empty
- Output location: `dist`

## GitHub repository

<https://github.com/bryancabillan-git/IgnacioLueraPortfolio>
