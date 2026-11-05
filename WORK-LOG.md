# Ignacio Luera Portfolio — Work Log

This file records completed work, client inputs, project decisions, verification, and outstanding items. It can support billing and project documentation. Add actual hours, rates, invoice numbers, and payment status separately; those values were not recorded during development and are not estimated here.

## Billing record

| Field | Value |
|---|---|
| Project | Ignacio Luera Portfolio |
| Work date | November 5, 2026 |
| Client | Ignacio Luera |
| Developer | Bryan Skyline |
| Invoice/reference number | To be assigned |
| Start time | Not recorded |
| End time | Not recorded |
| Billable hours | Enter actual tracked time |
| Hourly or project rate | Enter agreed rate |
| Payment status | Not invoiced / update as needed |

## Scope requested

Build an independent, static artist portfolio based on Ignacio Luera’s existing Canva website and prepare a method for synchronizing separately maintained Canva artwork designs into the new website. The site is intended for Azure Static Web Apps. Artwork prices are excluded from the initial version but may be added later.

## Client-provided material

- Existing Canva portfolio: <https://ignacioluera.my.canva.site>
- Artist name: Ignacio Luera
- Visual direction: Chicano style
- Artwork organization: each artwork is a separate Canva design
- Hosting target: Azure Static Web Apps
- Biography and education history
- Email: `Luera36@gmail.com`
- Instagram: <https://www.instagram.com/zer0logic/>
- Facebook: <https://www.facebook.com/zer0logic>

## Work completed on November 5, 2026

### Discovery and technical planning

- Reviewed the public Canva portfolio preview and identified its primary visual characteristics.
- Evaluated static-site options for displaying and updating artwork.
- Chose Astro for static generation and Azure Static Web Apps for hosting.
- Designed a build-time Canva synchronization approach so Canva secrets never reach browser code.
- Reviewed Canva’s folder-listing, design-export, asynchronous export-job, and OAuth refresh-token documentation.
- Identified that Canva export URLs are temporary and designed the synchronizer to save permanent local copies.

**Status:** Completed

### Visual design

- Produced an initial homepage design concept.
- Established a warm paper, black, cobalt blue, and brick-red color system.
- Used blackletter display typography with readable serif and sans-serif supporting type.
- Created an editorial, image-first layout influenced by the supplied Canva preview.
- Added responsive behavior for desktop, tablet, and mobile displays.
- Created six original placeholder graphics that are clearly labeled and can be replaced with Ignacio’s artwork.

**Status:** Completed as a working draft; pending artist review and original artwork.

### Website implementation

- Created the Astro project under `IgnacioLueraPortfolio`.
- Built Home, Work, About, Contact, and 404 pages.
- Created shared header, footer, artwork-card, artwork-lightbox, and social-link components.
- Added a responsive artwork gallery with collection filters.
- Added an accessible full-screen artwork viewer.
- Added page titles, descriptions, canonical URLs, social-sharing metadata, a favicon, and a social card.
- Added keyboard focus styles, reduced-motion handling, descriptive alternative text, and accessible social-link labels.
- Kept artwork pricing out of the initial data model presentation.

**Status:** Completed as a working draft.

### Biography and contact content

- Lightly edited the supplied biography for grammar and readability while preserving its facts and meaning.
- Added birth information, educational history, current MFA studies, artistic influences, media, and cultural focus to the About page.
- Added a structured education section.
- Replaced placeholder practice copy with themes based on the supplied biography: Memory, Identity, and Celebration.
- Added Ignacio’s approved email address.
- Added Instagram and Facebook links as icon buttons, without displaying profile URLs in the interface.
- Added accessible names and hover titles to the social icons.
- Replaced the visible Canva URL on the Contact page with descriptive link text.

**Status:** Completed.

### Canva synchronization foundation

- Added `scripts/sync-canva.mjs`.
- Added support for listing designs in a dedicated Canva folder.
- Added paginated folder retrieval.
- Added asynchronous JPG export creation and polling.
- Added change detection using Canva design update timestamps.
- Added permanent image downloads under `public/art/canva/`.
- Added automatic generation of `src/data/canva-artworks.json`.
- Added support for multi-page Canva designs.
- Added a Canva title convention for title, medium, year, and collection metadata.
- Preserved manually edited artwork metadata during later synchronization runs.
- Added direct access-token support for manual synchronization.
- Added refresh-token support with mandatory secure output for Canva’s rotated token.
- Added a GitHub Actions workflow prepared to store rotated refresh tokens in Azure Key Vault.
- Left automated scheduling disabled until the credentials and Key Vault integration are verified manually.

**Status:** Implementation completed; activation blocked by Canva authorization, folder ID, and Azure configuration.

### Azure deployment foundation

- Added Azure Static Web Apps configuration.
- Added a custom 404 response override.
- Added basic security and permissions headers.
- Added a GitHub Actions deployment workflow.
- Documented the required Azure deployment-token secret and build settings.

**Status:** Configuration completed; deployment blocked by Azure resource creation and deployment credentials.

### Documentation

- Created and expanded `README.md`.
- Documented local development commands.
- Documented content locations and replacement points.
- Documented the Canva artwork naming convention.
- Documented manual and automated synchronization setup.
- Documented Azure Static Web Apps deployment.
- Added official Canva API references.
- Created this billing and project work log.

**Status:** Completed.

## Primary deliverables

| Deliverable | Location | Status |
|---|---|---|
| Astro application | Project root | Complete working draft |
| Home page | `src/pages/index.astro` | Complete working draft |
| Artwork gallery | `src/pages/work.astro` | Complete working draft |
| Biography and education | `src/pages/about.astro` | Content added |
| Contact and social links | `src/pages/contact.astro` | Content added |
| Shared visual system | `src/styles/global.css` | Complete working draft |
| Reusable components | `src/components/` | Complete |
| Artwork data model | `src/data/artworks.ts` | Complete for current scope |
| Canva-generated catalog | `src/data/canva-artworks.json` | Ready; awaiting first sync |
| Canva synchronization script | `scripts/sync-canva.mjs` | Implemented; awaiting credentials |
| Azure deployment workflow | `.github/workflows/azure-static-web-apps.yml` | Implemented; awaiting Azure token |
| Canva synchronization workflow | `.github/workflows/sync-canva.yml` | Implemented; manual activation only |
| Azure configuration | `public/staticwebapp.config.json` | Complete |
| Technical documentation | `README.md` | Complete for current phase |

## Verification record

The following checks were completed after implementation:

- Installed 265 package dependencies.
- `npm audit` reported 0 vulnerabilities at installation time.
- Ran `npm run build` after the initial implementation.
- Ran `npm run build` after correcting the Azure 404 configuration.
- Ran `npm run build` after adding the biography.
- Ran `npm run build` after adding contact information and social icons.
- Final recorded build generated 5 static pages.
- Final recorded Astro diagnostics: 0 errors, 0 warnings, and 0 hints.
- Checked `scripts/sync-canva.mjs` syntax with Node.js.
- Parsed the project JSON files successfully.

## Decisions and constraints

- No artwork was copied from the published Canva preview because the original or API-exported files should be used.
- The current gallery uses labeled placeholders.
- No prices appear in the initial version.
- No artist statement, exhibition history, or teaching history was invented.
- Social profile URLs are linked through icons rather than displayed.
- The Canva sync does not expose tokens or temporary export URLs to website visitors.
- The automated Canva schedule remains disabled until one manual end-to-end synchronization succeeds.
- The site has not been deployed because no Azure Static Web Apps resource or deployment token was supplied.

## Outstanding client inputs and dependencies

- Ignacio’s original artwork or completed Canva API authorization
- Dedicated Canva Portfolio folder ID
- Approved artist statement
- Portrait or studio photograph
- Exhibition history
- Additional teaching background
- Artwork titles, media, years, dimensions, descriptions, and collections
- Canva developer client ID and client secret
- Canva OAuth refresh token
- Azure Static Web Apps resource and deployment token
- Azure Key Vault and GitHub OIDC configuration for scheduled synchronization
- Final domain name
- Ignacio’s final review and approval

## Future work log template

Copy this section for each later work session.

```markdown
## Work session — YYYY-MM-DD

### Billing record
- Start time:
- End time:
- Billable hours:
- Rate:
- Invoice/reference:

### Requested work
-

### Work completed
-

### Files or services changed
-

### Verification
-

### Decisions or blockers
-

### Next steps
-
```

## Additional work — Internal Canva integration testing

### Requested work

- Add an internal Test page to the main site.
- Test OAuth with a non-customer Canva account.
- Retrieve Canva folders, design thumbnails, and exported images.
- Observe Canva design changes before connecting the customer account.

### Work completed

- Added the protected `/test/` page and navigation entry.
- Added Azure Static Web Apps authentication rules for `/test/` and `/api/canva/*`.
- Added a managed Azure Functions API under `api/`.
- Added Canva OAuth Authorization Code with PKCE.
- Added encrypted, expiring OAuth state values.
- Added explicit server-side authentication checks for every Canva endpoint.
- Added local ignored token storage for development.
- Added Azure Key Vault token storage for deployment.
- Added endpoints for connection status, folder discovery, design retrieval, export creation, and export polling.
- Added live folder refresh every 60 seconds on the Test page.
- Added per-design JPG export testing.
- Added local Static Web Apps CLI configuration through `npm run dev:canva`.
- Updated Azure deployment to include the managed API.
- Changed the Azure deployment workflow to manual-only until its token and resource are configured.
- Unified the OAuth API and scheduled synchronization around the Key Vault secret `canva-oauth-token`.
- Documented local test setup, secrets handling, deployment storage, and customer-launch cleanup in `README.md`.

### Security decisions

- Canva client secrets and refresh tokens are never returned to browser code.
- The local settings file and token file are excluded from Git.
- Local file token storage is rejected when the API detects an Azure environment.
- Deployed token storage requires Azure Key Vault and managed identity.
- The test page requires an authenticated Static Web Apps user.
- The Test route should be removed or restricted to a custom administrator role before customer launch.

### Verification completed

- Installed the Static Web Apps CLI and API dependencies.
- Confirmed Static Web Apps CLI version 2.1.0.
- Ran `npm run build`; Astro generated 6 static pages.
- Astro diagnostics reported 0 errors, 0 warnings, and 0 hints.
- Checked every Azure Function JavaScript module for syntax errors.
- Loaded the Function registration module successfully in test mode.
- Verified encrypted OAuth state creation and decryption.
- Parsed every new JSON configuration successfully.
- Production dependency audits for both the site and API reported 0 vulnerabilities.
- The root development dependency tree reports 9 transitive advisories from the Static Web Apps CLI toolchain; these packages are not shipped in the static site or managed API.

### Live verification pending Canva settings

- Start the local SWA emulator after test Canva credentials are configured.
- Complete OAuth against the test Canva account.
- Confirm folder and thumbnail retrieval with live account data.
- Confirm at least one asynchronous JPG export.

### Canva test result presentation correction

- Confirmed the test API successfully returned one Canva design.
- Identified that Canva omitted the optional design thumbnail.
- Removed the dark unused-grid background that made an empty gallery track resemble a blank image.
- Added an explicit instruction to use the JPG export test when Canva does not return a thumbnail.

## Scope change — Canva API integration removed

The project owner chose to simplify the portfolio and retain only the static Astro implementation.

### Removed

- Internal Canva OAuth Test page and navigation entry
- Azure Functions API backend
- Local OAuth settings and stored test tokens
- Canva OAuth, PKCE, folder, thumbnail, and export code
- Canva synchronization script and generated catalog
- Canva synchronization GitHub Actions workflow
- Static Web Apps CLI development dependency
- Canva-specific authentication routes and documentation

### Retained

- Astro static-site configuration
- Home, Work, About, Contact, and 404 pages
- Static artwork catalog in `src/data/artworks.ts`
- Gallery filters and artwork lightbox
- Ignacio’s biography and contact information
- Existing Canva portfolio link
- Azure Static Web Apps static deployment workflow
- Historical work entries in this log for billing and documentation

### Ongoing artwork workflow

Approved artwork images will be added to `public/art/`, and their metadata will be maintained directly in `src/data/artworks.ts`. This removes the need for Canva developer credentials, OAuth token rotation, Azure Functions, Azure Key Vault, and scheduled synchronization.

## About-page portrait update

- Added the client-supplied `ignacioluera.png` portrait to the public site assets.
- Replaced the About-page monogram placeholder with Ignacio’s portrait.
- Preserved the existing About-page grid column width.
- Applied centered cover cropping so the image fills the existing responsive portrait area.
- Removed the portrait from the outstanding-content note.

## Homepage hero artwork update

- Added the supplied `mayanignacio.png` artwork to the public site assets.
- Replaced the homepage placeholder beside “Ignacio Luera” with the supplied artwork.
- Preserved the existing hero column and frame dimensions.
- Used the existing centered cover treatment for a small responsive crop.
- Added descriptive alternative text and intrinsic image dimensions.
