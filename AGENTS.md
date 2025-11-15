# Repository Guidelines

## Project Structure & Module Organization

This pnpm workspace centers on `packages/`, where each MCP server lives; today `packages/supabase-db` contains `src/` (runtime + TypeScript helpers), `tests/` (Jest suites), and `examples/` (connection snippets). Static assets for the GitHub Pages microsite reside in `docs/` plus `docs/assets/`, and automation metadata (pending releases) stays under `.changeset/`. Keep tooling scripts and shared configs at the root so new packages inherit them automatically.

## Build, Test, and Development Commands

Run `pnpm install` once to hydrate every workspace. Use `pnpm -r build` for the full graph or `pnpm --filter mcp-supabase-db build` to transpile that package via `tsc`. Execute server code locally with `pnpm --filter mcp-supabase-db start`. `pnpm lint` checks Markdown/Docs with Prettier, while `pnpm test` or `pnpm --filter mcp-supabase-db test` runs Jest with the Supabase mocks (remember to set `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, even to dummy values). Release flows rely on Changesets: `pnpm changeset` (describe the change) then `pnpm version`/`pnpm release`.

## Coding Style & Naming Conventions

Source files are ES modules with TypeScript definitions; prefer `.ts` for new logic and keep emitted `.js` and `.d.ts` checked in. Use 2-space indentation, single quotes, and descriptive module names (`tools/queryTools.js`, `code-api/cache.ts`). Functions stay camelCase, classes PascalCase, and exported tools group by domain (query, schema, privacy). Always run Prettier (`pnpm exec prettier --write`) on touched docs or Markdown, and respect existing TODO commentary rather than restating intent.

## Testing Guidelines

Tests live beside the package in `packages/*/tests` with the `*.test.js` suffix. Jest provides coverage output in `packages/supabase-db/coverage/`; keep core branches above 80% and expand mocks rather than hitting live Supabase. When adding tools, create parallel suites (e.g., `dataTools.test.js`) and clearly stub environment config by using the helper utilities in `tests/config.test.js`. Run `pnpm --filter mcp-supabase-db test -- --watch` during development for quick feedback.

## Commit & Pull Request Guidelines

Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) as seen in `git log`, squash noisy WIP history locally, and always include the matching Changeset summary. PRs should link an issue when relevant, list affected packages (`packages:` block), describe testing (`Tests:` block), and attach screenshots for documentation/UI updates (e.g., `docs/index.html`).

## Security & Configuration Notes

Never commit real Supabase keys; local secrets belong in ignored `.env` files and should map to `mcp-config.json` for reproducible server startups. Validate new config fields with `src/config.js` helpers, document defaults inside package READMEs, and scrub backups or exports before syncing the `backups/` directory.
