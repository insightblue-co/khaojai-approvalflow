import { describe, expect, it } from 'vitest';
import { approvalFlow_1 } from './components/approvalData/flow-1';
import { parseApprovalFlowJson } from './parseApprovalFlowJson';

describe('parseApprovalFlowJson', () => {
  it('rejects invalid JSON strings', () => {
    const r = parseApprovalFlowJson('{ not json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain('Invalid JSON');
  });

  it('rejects non-object root', () => {
    expect(parseApprovalFlowJson(null).ok).toBe(false);
    expect(parseApprovalFlowJson([]).ok).toBe(false);
    expect(parseApprovalFlowJson('[]').ok).toBe(false);
  });

  it('requires non-empty steps and start_step_id', () => {
    const emptySteps = parseApprovalFlowJson({ steps: [], start_step_id: 'a' });
    expect(emptySteps.ok).toBe(false);
    if (!emptySteps.ok) expect(emptySteps.errors.some(e => e.includes('steps'))).toBe(true);

    const noStart = parseApprovalFlowJson({ steps: [{ step_id: 'x' }] });
    expect(noStart.ok).toBe(false);
    if (!noStart.ok) expect(noStart.errors.some(e => e.includes('start_step_id'))).toBe(true);
  });

  it('maps a minimal valid API-shaped payload', () => {
    const r = parseApprovalFlowJson({
      name: 'My flow',
      steps: approvalFlow_1.steps,
      start_step_id: approvalFlow_1.start_step_id
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.start_step_id).toBe('submit');
      expect(r.data.name).toBe('My flow');
      expect(r.data.steps.length).toBeGreaterThan(0);
    }
  });
});
