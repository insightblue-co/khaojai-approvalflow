import type { TFunction } from 'i18next';
import { approvalFlow_1 } from './components/approvalData/flow-1';
import type { ApprovalFlowData, Rules, Step, SubmitterRules } from './components/interface';
import { addLabelToValue, filterRules } from './approver';

export type MapApprovalApiOptions = {
  t?: TFunction;
  tPageFieldBaseKey?: string;
  baseFlow?: ApprovalFlowData;
};

/**
 * Maps a GET `/v1/data/approval/:id` style payload (or equivalent JSON export) into `ApprovalFlowData`
 * for the flow editor.
 */
export function mapApprovalApiResponseToFlowData(
  approvalData: Record<string, any>,
  opts: MapApprovalApiOptions = {}
): ApprovalFlowData {
  const { t, tPageFieldBaseKey = '_approvalGroup', baseFlow = approvalFlow_1 } = opts;

  let submitterRules: SubmitterRules = approvalData.submitter_rules || { condition: 'and', rules: {} };

  if (submitterRules.rule_details && (submitterRules.rules as any)?.supervisor_department) {
    const level = (submitterRules.rules as any).supervisor_department[0];
    const displayName =
      Number(level) === 1
        ? 'หัวหน้าหน่วยงาน'
        : `สูงกว่าหัวหน้าหน่วยงาน + ${Number(level) - 1}`;
    submitterRules = {
      ...submitterRules,
      rule_details: {
        ...(submitterRules.rule_details as object),
        supervisor_department: [{ id: Number(level), display_name: displayName }]
      } as Rules
    };
  }

  if (submitterRules.condition === 'everyone') {
    submitterRules = {
      condition: 'everyone',
      rules: { all: [] }
    };
  } else if (submitterRules.rule_details) {
    const filteredRules = filterRules(submitterRules.rule_details as Rules);
    submitterRules = {
      condition: submitterRules.condition,
      rules: filteredRules as Rules
    };
  }

  const stepsIn = (approvalData.steps || []) as Step[];
  const mappedSteps: Step[] = stepsIn.map(step => ({
    ...step,
    approvers: t != null ? addLabelToValue(step.approvers || [], t, tPageFieldBaseKey) : step.approvers || [],
    ccs: t != null ? addLabelToValue(step.ccs || [], t, tPageFieldBaseKey) : step.ccs || []
  }));

  const firstStep = mappedSteps[0];

  return {
    ...baseFlow,
    name: approvalData.name ?? baseFlow.name,
    description: approvalData.description ?? baseFlow.description ?? '',
    approval_group_id: approvalData.approval_group_id ?? baseFlow.approval_group_id,
    start_step_id: approvalData.start_step_id ?? baseFlow.start_step_id,
    resource_setting: approvalData.resource_setting ?? baseFlow.resource_setting ?? null,
    action_setting: approvalData.action_setting ?? baseFlow.action_setting ?? null,
    submitter_rules: submitterRules,
    steps: mappedSteps,
    start_at: approvalData.start_at ?? baseFlow.start_at ?? '',
    end_at: approvalData.end_at ?? baseFlow.end_at ?? '',
    form_name: {
      label: (firstStep?.form_name as string) || baseFlow.form_name?.label || '',
      value: (firstStep?.form_id as string) || baseFlow.form_name?.value || ''
    }
  };
}
