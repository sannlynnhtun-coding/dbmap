# Brand assets

Always use original official brand icons and logos consistently throughout the entire application, including Web, Desktop, navigation, UI components, and all other interfaces.

Use `public/favicon.svg` as the original DBMaps artwork. All Vue brand placements use `src/components/DbMapLogo.vue`; the static loading screen uses the same SVG. Windows uses `rust-desktop/assets/DBMaps.ico`, converted from that original artwork. Preserve source colors and proportions; do not redraw, recolor, distort, or replace brand marks with generic UI icons. Generic action icons may continue to use the existing Lucide library.

Vendor artwork in `public/icons/` comes from its official publisher; source URLs and SHA-256 hashes are recorded in `public/icons/sources.json`. Reuse those local assets, including in the offline desktop bundle. Update provenance and branding checks when changing any brand asset.
