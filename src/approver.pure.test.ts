import { describe, expect, it } from 'vitest';
import { inferNodeType, transformSubmitterRules } from './approver';

describe('inferNodeType', () => {
  it('maps step_type to editor node_type', () => {
    expect(inferNodeType('ADD_CONDITION')).toBe('AddCondition');
    expect(inferNodeType('CONDITIONAL')).toBe('Condition');
    expect(inferNodeType('SUBMIT')).toBe('ApprovalFlow');
    expect(inferNodeType('APPROVAL')).toBe('ApprovalFlow');
  });
});

describe('transformSubmitterRules', () => {
  it('treats empty "all" as everyone', () => {
    const out = transformSubmitterRules({
      condition: 'and',
      rules: { all: [] }
    });
    expect(out.condition).toBe('everyone');
    expect(out.rules).toEqual({});
  });

  it('preserves condition when rules are non-empty', () => {
    const out = transformSubmitterRules({
      condition: 'or',
      rules: { users: [{ id: 1 }] }
    });
    expect(out.condition).toBe('or');
  });
});
