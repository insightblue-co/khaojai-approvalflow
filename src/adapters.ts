import type { ComponentType } from 'react';

export type GetFn = (args: { url: string }) => Promise<any>;

export type ApprovalFlowAdapters = {
  get: GetFn;
  getFormsByIds: (formIds: string[]) => Promise<any[]>;
  PDFIntegrationsList: ComponentType<any>;
  FormBuilder: ComponentType<any>;
  safeTransformAPIToFormBuilder: (data: any) => any;
  /** Returns groups used by the form selector (e.g. useTranslatedCustomFieldConfig from the host app). */
  useApprovalCustomFieldConfig: () => { APPROVAL_CUSTOM_FIELD_GROUPS: unknown };
  ModalConditionSetting: ComponentType<any>;
  AutoRenderFilterV2: ComponentType<any>;
  CustomTable: ComponentType<any>;
  useFilterTableV2: (...args: any[]) => any;
  SelectDepartmentComponent: ComponentType<any>;
};

let adapters: ApprovalFlowAdapters | null = null;

export function registerApprovalFlowAdapters(next: ApprovalFlowAdapters): void {
  adapters = next;
}

export function getApprovalFlowAdapters(): ApprovalFlowAdapters {
  if (!adapters) {
    throw new Error(
      '[khaojai-approval-flow] registerApprovalFlowAdapters() must be called before rendering the approval flow editor.'
    );
  }
  return adapters;
}
