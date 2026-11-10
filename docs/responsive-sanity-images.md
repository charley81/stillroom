# Responsive Sanity image delivery

Public editorial images are rendered by `src/components/content/EditorialImage.astro` and transformed by Sanity's image CDN.

## Delivery policy

- Raster editorial images receive width-based `srcset` candidates up to the smaller of their intended rendered width and source width.
- Every use supplies a `sizes` hint that reflects its responsive layout.
- Images use `auto=format`, allowing Sanity to serve AVIF or WebP when supported while retaining a compatible fallback.
- Lossy raster transformations use quality `82`. This is the shared balance between editorial detail and transfer size.
- The default `crop` mode sends both target dimensions to Sanity so editor crop and hotspot data determine the server-side composition.
- Artwork displayed with `object-contain` uses `fit="max"`; Sanity still applies an explicit editor crop, but does not introduce an additional aspect-ratio crop.
- A mobile override receives its own source set and remains selected through the existing `(max-width: 760px)` media query.
- Width, height, alt text, decorative state, loading, fetch priority, decoding, captions, and preview behavior remain owned by the calling component and content model.

## Client Logos

Client Logo SVGs are intentionally rendered directly by `src/components/site/ClientLogos.astro`. They do not receive raster resizing, quality, or format parameters, preserving the approved vector artwork.

## Verification

Rendered component tests cover source sets, sizing hints, crop and hotspot parameters, the quality and format policy, mobile overrides, SVG Client Logos, and alternative text. `pnpm verify:site` checks loaded image responses while exercising every public route at mobile, intermediate, and desktop viewports.
