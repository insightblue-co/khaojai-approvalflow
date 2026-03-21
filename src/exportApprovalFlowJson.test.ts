import { describe, expect, it } from 'vitest';
import type { ApprovalFlowData } from './components/interface';
import { exportApprovalFlowJson, getExportApprovalFlowData } from './exportApprovalFlowJson';

describe('exportApprovalFlowJson', () => {
  const flow: ApprovalFlowData = {
    approval_group_id: 1,
    name: 'Test flow',
    description: 'Export test',
    start_at: '',
    end_at: '',
    submitter_rules: { condition: 'and', rules: {} },
    form_name: { label: 'Test Form', value: 'test-form' },
    start_step_id: 'submit',
    steps: [
      {
        pre_actions: null,
        post_actions: null,
        nexts: [{ condition_groups: null, step_id: 'addcondition1' }],
        step_id: 'submit',
        name: 'submit',
        description: '',
        status: 'PENDING',
        form_id: 'test-form',
        form_name: 'Test Form',
        form_data_permissions: null,
        action_buttons: null,
        step_type: 'SUBMIT',
        approval_type: 'MANUAL_APPROVE',
        approvers: [],
        approve_require: 'ANY',
        ccs: []
      },
      {
        pre_actions: null,
        post_actions: null,
        nexts: [
          {
            condition_groups: [],
            step_id: 'end1',
            _virtual_condition_id: 'condition1_1'
          }
        ],
        step_id: 'addcondition1',
        name: 'addcondition',
        description: '',
        status: 'PENDING',
        form_id: null,
        form_name: null,
        form_data_permissions: null,
        action_buttons: null,
        step_type: 'ADD_CONDITION',
        approval_type: 'AUTO_APPROVE',
        approvers: [],
        approve_require: 'ANY',
        ccs: [],
        node_type: 'AddCondition'
      },
      {
        pre_actions: null,
        post_actions: null,
        nexts: [{ condition_groups: null, step_id: 'end1' }],
        step_id: 'condition1_1',
        name: 'condition',
        description: '',
        status: 'CONDITION',
        form_id: null,
        form_name: null,
        form_data_permissions: null,
        action_buttons: null,
        step_type: 'CONDITIONAL',
        approval_type: 'AUTO_APPROVE',
        approvers: [],
        approve_require: 'ANY',
        ccs: [],
        node_type: 'Condition',
        _is_virtual: true
      } as any,
      {
        pre_actions: null,
        post_actions: null,
        nexts: [],
        step_id: 'end1',
        name: 'end',
        description: '',
        status: 'END',
        form_id: null,
        form_name: null,
        form_data_permissions: null,
        action_buttons: null,
        step_type: 'END',
        approval_type: 'AUTO_APPROVE',
        approvers: [],
        approve_require: 'ANY',
        ccs: []
      }
    ]
  };

  it('removes virtual condition steps from exported data', () => {
    const exported = getExportApprovalFlowData(flow);

    expect(exported.steps).toHaveLength(3);
    expect(exported.steps.some(step => step.step_id === 'condition1_1')).toBe(false);
    expect(exported.steps.some(step => step._is_virtual)).toBe(false);
  });

  it('returns valid JSON text', () => {
    const json = exportApprovalFlowJson(flow);
    const parsed = JSON.parse(json);

    expect(parsed.name).toBe('Test flow');
    expect(parsed.steps).toHaveLength(3);
    expect(parsed.steps.some((step: { step_id: string }) => step.step_id === 'condition1_1')).toBe(false);
  });
});
