# Production launch and rollback runbook

## Launch command

Production mutation commands are blocked unless their explicit guard is set. Load the local credentials from `.env`, then run:

```sh
set -a
source .env
set +a
ALLOW_PRODUCTION_LAUNCH=true pnpm sanity:launch:production
```

The launch command stops immediately on failure and runs these stages in order:

1. export the existing `production` dataset with assets and drafts
2. recreate the deterministic migration as production drafts
3. export the pre-publication state and generate a draft-only validation file
4. validate draft schemas, references, exact inventory, page queries, slugs, and accessibility fields
5. compare every migrated draft with the verified `development` document and asset content
6. publish reusable references, then Work Projects and Journal Articles, then page singletons and Site Settings
7. validate and compare the published production state
8. export the post-migration production dataset

The write token is local-only. Netlify production contains only public Sanity identifiers, a Viewer read token for preview, and the preview session secret. No Sanity-to-Netlify build hook should exist because published content is queried at request time.

## Launch record — 2026-11-10

- Sanity project: `h2h3psnm`
- Dataset: `production`
- Pre-migration archive: `.sanity/backups/production-pre-migration-2026-11-10T15-26-58-843Z.tar.gz`
  - 0 documents, 0 assets
  - SHA-256: `b3021c09d514c25b8100ac13222d845460c1ea3672f73e8f0c818f1da8f3b687`
- Validated pre-publication archive: `.sanity/backups/production-pre-publication-2026-11-10T15-37-34-818Z.tar.gz`
  - 70 documents (35 published plus 35 migration drafts), 61 assets
  - SHA-256: `450e6fa3f77d5f31c4964cccb34721778073f9f19217c92984bbd6bc40a4a532`
- Final post-migration archive: `.sanity/backups/production-post-migration-2026-11-10T16-09-13-376Z.tar.gz`
  - 35 published documents, 61 assets
  - SHA-256: `2f86efc9ddc614f1916f783a3968ddc6103e64b35dc1627ab81b4cf24d11fad7`
- Launch Netlify deploy: `6af33d4551ef71d6844b7b8a`
- Known-good pre-cutover rollback deploy: `6af26c8d922a089cee6f97cd`

The archives and JSON integrity manifests are intentionally gitignored. Copy them to the approved secure backup location before removing the local working copy.

## Verification record

- 35 production documents passed live schema validation.
- Production published content and asset hashes matched the verified development dataset.
- All 19 public routes plus generic, Work Project, and Journal Article 404 scenarios passed at 1440 px and 390 px, including statuses, metadata, links, 70 images, basic accessibility checks, and horizontal overflow checks.
- `/studio` returned 200 with `X-Robots-Tag: noindex, nofollow`, was absent from public navigation, and showed Sanity’s login-provider screen to an unauthenticated browser.
- An unsigned preview request returned 401. A signed production preview displayed a temporary Home draft, rendered the exit control and Visual Editing client, and used private/no-store and noindex/nofollow headers. The preview-exit endpoint cleared the secure cookie and redirected to published content.
- The temporary Home edit was published and observed publicly without changing the active Netlify deploy, then the verified content was restored.
- The obsolete `sanity content published` Netlify build hook was deleted. The site now has zero Netlify build hooks.
- Netlify’s public “Built with Netlify” badge was disabled and the final responsive screenshots were recaptured without the overlay.
- Both dataset archives passed gzip/tar integrity checks. The pre-migration archive was parsed successfully by Sanity document validation. A full restore rehearsal into a temporary dataset requires a project-admin token with `sanity.project.datasets/create` and `delete`; the local least-privilege migration token intentionally does not have those grants.

## Netlify rollback

List retained production deploys and confirm the target ID:

```sh
netlify api listSiteDeploys \
  --data '{"site_id":"f9a14843-889d-4103-97ca-c89f2481b53c","per_page":10}'
```

Restore the known-good pre-cutover deployment:

```sh
netlify api restoreSiteDeploy \
  --data '{"site_id":"f9a14843-889d-4103-97ca-c89f2481b53c","deploy_id":"6af26c8d922a089cee6f97cd"}'
```

Verify `/`, key dynamic URLs, and `/studio`. To return to the Sanity launch deploy:

```sh
netlify api restoreSiteDeploy \
  --data '{"site_id":"f9a14843-889d-4103-97ca-c89f2481b53c","deploy_id":"6af33d4551ef71d6844b7b8a"}'
```

This rollback was rehearsed in production: the pre-cutover deploy returned 200, then the launch deploy was restored and both `/` and `/studio` returned 200.

## Sanity dataset rollback

Dataset recreation requires a project-admin token. First capture an emergency export of the current state and verify the pre-migration archive checksum:

```sh
ALLOW_PRODUCTION_EXPORT=true pnpm sanity:dataset:export:production:post
shasum -a 256 .sanity/backups/production-pre-migration-2026-11-10T15-26-58-843Z.tar.gz
```

Then restore the exact pre-migration state:

```sh
sanity datasets delete production --force
sanity datasets create production --visibility public
sanity datasets import \
  --dataset production \
  --replace \
  .sanity/backups/production-pre-migration-2026-11-10T15-26-58-843Z.tar.gz
```

After restoration, run the public smoke check against the matching pre-cutover Netlify deploy. To roll forward again, recreate `production`, import the post-migration archive, restore the launch deploy, and run:

```sh
ALLOW_PRODUCTION_VALIDATION=true pnpm sanity:validate:production:published
ALLOW_PRODUCTION_VALIDATION=true pnpm sanity:compare:production:published
pnpm verify:production
```
