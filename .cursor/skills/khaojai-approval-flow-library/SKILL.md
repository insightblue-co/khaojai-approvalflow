---
name: khaojai-approval-flow-library
description: >-
  Guides development of the khaojai-approval-flow standalone React package (approval
  flow editor with XYFlow, adapters for host apps, JSON import/mapping). Use when
  working inside the khaojai-approval-flow repository, editing ApprovalFlow components,
  adapters.ts, approver transforms, or integration with a host application.
---

# khaojai-approval-flow library

## Scope

- This skill applies to **this repository only** (`khaojai-approval-flow`).
- Treat **sibling projects** (e.g. `khaojai-ai` / `khaojai-ui`) as **consumers**, not part of this repo. Do not modify them unless the user explicitly requests integration work.

## Before changing code

1. Read [`README.md`](README.md) and [`.cursorrules`](.cursorrules) at the repo root.
2. Identify whether the change needs a new **adapter** field in [`src/adapters.ts`](src/adapters.ts) instead of importing a host path.
3. Keep exports in [`src/index.ts`](src/index.ts) coherent with the public API.

## Adapters pattern

- Call **`registerApprovalFlowAdapters(...)` once** in the host app before rendering any editor UI.
- Required adapter keys include: `get`, `getFormsByIds`, `PDFIntegrationsList`, `FormBuilder`, `safeTransformAPIToFormBuilder`, `useApprovalCustomFieldConfig`, `ModalConditionSetting`, `AutoRenderFilterV2`, `CustomTable`, `useFilterTableV2`, `SelectDepartmentComponent`.
- Inside this package, use **`getApprovalFlowAdapters()`** at runtime (e.g. in drawers) — never import `@/api-requests` or other app-only paths.

## Main modules

| Area | Location |
|------|----------|
| Canvas / XYFlow | [`src/components/index.tsx`](src/components/index.tsx) (`ApprovalFlow`) |
| Context | [`src/context/ApprovalFlowContext.tsx`](src/context/ApprovalFlowContext.tsx) |
| Step transforms / layout helpers | [`src/approver.ts`](src/approver.ts) |
| API / JSON mapping | [`src/mapApprovalApiToFlowData.ts`](src/mapApprovalApiToFlowData.ts), [`src/parseApprovalFlowJson.ts`](src/parseApprovalFlowJson.ts) |
| Import UI | [`src/components/ImportFlowJsonModal.tsx`](src/components/ImportFlowJsonModal.tsx) |
| Types | [`src/components/interface/index.tsx`](src/components/interface/index.tsx) |

## Checklist for PR-sized changes

- [ ] No direct dependency on `khaojai-ui` or monorepo-only paths.
- [ ] New host needs → extend `ApprovalFlowAdapters` + document in README.
- [ ] Run `pnpm run typecheck` (or `npm run typecheck`).
- [ ] Translations: if new user-facing strings, note expected host namespace or add `defaultValue` in `t()`.

## When the user asks to “integrate with khaojai-ui”

- That work belongs in the **consumer** repo (dependency entry, `registerApprovalFlowAdapters` wiring, import rewrites). Confirm explicitly before editing files outside this package.
