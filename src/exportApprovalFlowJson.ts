import type { ApprovalFlowData, Step } from './components/interface';

export type ExportApprovalFlowJsonOptions = {
  /** Pretty-print indentation passed to JSON.stringify. Defaults to 2. */
  space?: number;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isExportableStep(step: Step): boolean {
  return step._is_virtual !== true && step.step_type !== 'CONDITIONAL';
}

/**
 * Removes UI-only state such as virtual condition nodes so the exported payload
 * can be re-imported as a clean approval-flow JSON document.
 */
export function getExportApprovalFlowData(flow: ApprovalFlowData): ApprovalFlowData {
  const cloned = cloneJson(flow);

  return {
    ...cloned,
    steps: cloned.steps.filter(isExportableStep).map(step => {
      const { _is_virtual, ...rest } = step;
      return rest;
    })
  };
}

export function exportApprovalFlowJson(
  flow: ApprovalFlowData,
  { space = 2 }: ExportApprovalFlowJsonOptions = {}
): string {
  return JSON.stringify(getExportApprovalFlowData(flow), null, space);
}
