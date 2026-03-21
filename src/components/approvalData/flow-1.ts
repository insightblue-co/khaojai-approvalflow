import { ApprovalFlowData } from '../interface';

export const approvalFlow_1: ApprovalFlowData = {
  name: '',
  approval_group_id: null,
  description: '',
  start_at: '',
  end_at: '',
  submitter_rules: {},
  form_name: { label: '', value: '' },
  steps: [
    {
      pre_actions: null,
      post_actions: null,
      nexts: [
        {
          condition_groups: null,
          step_id: 'end1'
        }
      ],
      step_id: 'submit',
      name: 'submit',
      description: '',
      status: 'PENDING',
      form_id: null,
      form_name: null,
      form_data_permissions: null,
      action_buttons: null,
      step_type: 'SUBMIT',
      approval_type: 'AUTO_APPROVE',
      approvers: [],
      approve_require: 'ANY',
      ccs: [],
      node_type: 'ApprovalFlow'
    },
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
      ccs: [],
      node_type: 'ApprovalFlow'
    }
  ],
  start_step_id: 'submit'
};
