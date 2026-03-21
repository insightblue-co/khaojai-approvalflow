import type { ApprovalFlowData } from './components/interface';
import { mapApprovalApiResponseToFlowData, type MapApprovalApiOptions } from './mapApprovalApiToFlowData';

export type ParseApprovalFlowJsonResult =
  | { ok: true; data: ApprovalFlowData }
  | { ok: false; errors: string[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Parses JSON (string or object) into `ApprovalFlowData` for the editor.
 * Accepts either a full `ApprovalFlowData`-shaped object or an API-style approval payload with `steps` + `start_step_id`.
 */
export function parseApprovalFlowJson(
  raw: string | unknown,
  opts?: MapApprovalApiOptions
): ParseApprovalFlowJsonResult {
  const errors: string[] = [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, errors: ['Invalid JSON'] };
    }
  }

  if (!isRecord(parsed)) {
    return { ok: false, errors: ['Root value must be a JSON object'] };
  }

  const steps = parsed.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push('Object must include a non-empty "steps" array');
  }

  const startId = parsed.start_step_id;
  if (typeof startId !== 'string' || !startId) {
    errors.push('Object must include a string "start_step_id"');
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  try {
    const data = mapApprovalApiResponseToFlowData(parsed as Record<string, any>, opts);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, errors: [e?.message || 'Failed to map approval data'] };
  }
}
