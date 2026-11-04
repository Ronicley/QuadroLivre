# Existing Quadro Livre catalog

Exact copies of the assets referenced by `Sources/QuadroLivre/Resources/catalog-v1.json`, including archived revisions. Author, license, review status and exact versions remain in `catalog.json`; PNG hashes are in `SHA256SUMS`. No new art is generated and no native resource is modified.

Refresh explicitly from repository root: `node web/scripts/sync-catalog.mjs`. This is a byte-preserving copy, not an illustration generator. Commit this directory with the web app: Vercel's root is `web`, so builds need no files outside that root. Vite emits these images with content hashes and the service worker precaches them.
