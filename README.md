# khaojai-approval-flow

Published package name: `@khaojai/approval-flow`

Standalone approval flow editor package (React + XYFlow + Ant Design). **This folder is not wired into `khaojai-ui` by default** — the app keeps its own `src/components/approveBoxFlow` copy until you choose to integrate.

## Contents

- Visual flow editor (`ApprovalFlow`), context (`ApprovalFlowProvider`), step/transform helpers (`approver` utilities).
- JSON helpers: `parseApprovalFlowJson`, `mapApprovalApiResponseToFlowData`, `exportApprovalFlowJson`, plus built-in import/export controls on `ApprovalFlow` and optional `ImportFlowJsonModal` / `ExportFlowJsonModal`.
- **Host registration:** call `registerApprovalFlowAdapters(...)` once at app startup with your HTTP client, FormBuilder, table filters, etc. (see `src/adapters.ts`).

## Peer dependencies

See `package.json` — React 18, Ant Design 5, `@xyflow/react`, `styled-components`, `react-i18next`, Refine packages used by embedded drawers.

## Build the library

From this repo (install deps first):

- `pnpm run build` — writes `dist/` (ESM + CJS + `.d.ts`) via `tsup`. Header icons under `src/assets/approval/*.svg` are inlined (data URLs) so consumers do **not** need `/images/approval/*` on the host (unlike a typical Vite app `public/` folder).

Publish or link uses the `files` field (`dist` only), so **build before** `npm pack`, publishing, or consuming via `file:`.

## Publish to npm

The package is prepared for npm publication with **GitHub Actions** and direct publish from `main`.

Before the first publish:

1. Create an npm access token and save it as the repository secret `NPM_TOKEN`.
2. Confirm the package name in [`package.json`](package.json) is the one you want on npm. This repo is configured for `@khaojai/approval-flow`.
3. Push the repository to GitHub with `main` as the default branch.

Release flow:

1. Push a change to `main`.
2. The release workflow validates the package, bumps the patch version, and publishes `@khaojai/approval-flow` to npm.
3. The workflow pushes the release commit and git tag back to `main`.

Notes:

- `pnpm run prepublishOnly` validates typecheck, tests, and build before a direct publish.
- `pnpm run pack:check` shows what would go into the npm tarball.
- The workflow uses a `[skip release]` marker in the automated release commit message so the version-bump commit does not trigger a second publish loop.
- Consumers do **not** update automatically just because `main` changes. They receive updates when they install a newer published version that matches their semver range and redeploy.

## Sample app (POC)

The **`poc-project/`** folder is a small Vite + React app that depends on this package via `"file:.."`. After `pnpm run build` at the repo root, follow `poc-project/README.md` to run it.

## Use it in another project

1. Install the package and **all** `peerDependencies` (React, Ant Design, `@xyflow/react`, `@ant-design/icons`, Refine, `styled-components`, `react-i18next`, `i18next`, `solar-icon-set`, etc. — see `package.json`).
2. Add the dependency, for example:
   - **Local folder:** `"@khaojai/approval-flow": "file:../khaojai-approval-flow"` after running `pnpm run build` in this repo.
   - **Registry:** `pnpm add @khaojai/approval-flow` after the package has been published, then use the version range you want.
3. Import from `'@khaojai/approval-flow'` (resolved to `dist/`). Your app bundler should handle ESM/CJS via `exports`.
4. Call `registerApprovalFlowAdapters(...)` once at startup, then render `ApprovalFlow` / `ApprovalFlowProvider` as needed.
5. Use `ApprovalFlow`'s built-in JSON controls, or call `parseApprovalFlowJson(...)` / `exportApprovalFlowJson(...)` directly when you need custom import/export flows.

## Integration (when you want it)

1. Add the package as above.
2. Register adapters before rendering any editor UI.
3. Replace imports from `@/components/approveBoxFlow` with this package, or keep both during migration.

Do **not** delete the in-repo `approveBoxFlow` until you have tested the package in your app.
