import { MarkerType } from '@xyflow/react';
import { FormInstance } from 'antd';

export type ApprovalFlowData = {
  approval_group_id: number | null;
  name: string;
  description: string;
  start_at: string;
  end_at: string;
  resource_setting?: string | null;
  action_setting?: string | null;
  submitter_rules: SubmitterRules;
  form_name: { label: string; value: string };
  steps: Step[];
  start_step_id: string;
};

export type SubmitterRules = {
  condition?: string;
  rules?: Rules;
  rule_details?: Rules;
};

export type Rules = {
  all?: [];
  departments?: { id: number; display_name: string }[];
  supervisor_department?: { id: number; display_name: string }[];
  roles?: { id: number; display_name: string }[];
  users?: { id: number; display_name: string }[];
  submitter?: [];
};

export type Step = {
  pre_actions: null | unknown;
  post_actions: null | unknown;
  nexts: Next[];
  step_id: string;
  name: string;
  description: string;
  status: string;
  form_id: null | string;
  form_name: null | string;
  form_data_permissions: null | FieldPermission[];
  action_buttons: ActionButton[] | null;
  step_type: 'SUBMIT' | 'APPROVE' | 'CC' | 'HANDLE' | 'REVISE' | 'END' | 'ADD_CONDITION' | 'CONDITIONAL' | 'INTEGRATION';
  approval_type: string;
  approvers: SubmitterRules[];
  approve_require: string;
  ccs: SubmitterRules[];
  node_type?: 'ApprovalFlow' | 'Condition' | 'AddCondition';
  position_x?: number;
  position_y?: number;
  extra?: Record<string, any>; // Extra data for step-specific information (e.g., integration data)
  // Virtual field for UI rendering only (not saved to database)
  _is_virtual?: boolean;
};

export type Next = {
  condition_groups: ConditionGroup[] | null;
  logic_condition?: any; // New LogicConditionStructure format
  step_id: string;
  condition_name?: string; // Custom name for condition node
  // Virtual fields for UI rendering only (not saved to database)
  _virtual_condition_id?: string;
  _virtual_nexts?: string[]; // Array of step_ids for multi-branch conditions
};

export type ConditionGroup = {
  conditions: Condition[];
};

export type Condition = {
  field: string;
  operator: string;
  value: string;
  value_field: string;
};

export type FieldPermission = {
  field_name: string;
  is_required: boolean;
  is_visible: boolean;
  is_editable: boolean;
};

export type ActionButton = {
  display_name: string;
  value: string;
  type: 'primary' | 'default' | 'danger' | 'warning';
  step_id?: string; // Optional step to connect to
};

export interface ApprovalFlowNode {
  id: string;
  type: string;
  data: ApprovalFlowBoxProps;
  position: { x: number; y: number };
}

export interface ApprovalFlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  markerEnd: MarkerEdgeProps;
  sourceHandle?: string;
  targetHandle?: string;
  data?: {
    isCondition: boolean;
    rightToRightIndex?: number;
    leftToLeftIndex?: number;
    isHighlighted?: boolean;
  };
}

export interface MarkerEdgeProps {
  type: MarkerType;
  width?: number;
  height?: number;
}

export interface ApproveBoxProps {
  data: ApprovalFlowBoxProps;
  id: string;
  isSelected: boolean;
  onNodeClick: () => void;
}

export enum ApprovalHeaderType {
  SUBMIT,
  APPROVER,
  CC_TO,
  PROCESSING,
  REVISE,
  CONDITION,
  NEXT_APPROVAL,
  END,
  INTEGRATION,
  NOT_IMPLEMENTED
}

export interface ApprovalFlowBoxProps {
  index: number;
  isFirstNode: boolean;
  isLastNode: boolean;
  type: string;
  label: string;
  content: string;
  [key: string]: unknown; // Add index signature
}

export interface ApprovalBoxItemRowProps {
  id: string;
  label: string;
  content: string;
  type: string;
  onOpenDrawer?: () => void;
}

export interface ApprovalItemHeaderProps {
  id: string;
  headerType: ApprovalHeaderType;
  label?: string;
  isFirstNode?: boolean;
  isLastNode?: boolean;
}

export interface AddDataDrawerProps {
  addDataForm: FormInstance;
  openDrawer: boolean;
  handleCloseDrawer: () => void;
  handleSubmit: (val: any) => void;
  stepName: string;
  type: string;
  id: string;
}

export interface ApprovalRequesterSectionProps {
  onClick: () => void;
}

export interface ApprovalRequesterModalProps {
  open: boolean;
  handleOk: (name: string, value: { id: number; display_name: string }[]) => void;
  handleCancel: () => void;
  value: { id: number; display_name: string }[];
}

export interface ItemWithCount<T> {
  displayText: string;
  remainingCount: number;
  displayItems: T[];
  hiddenItems: T[];
}

export interface DisplayItem {
  display_name: string;
  [key: string]: any;
}

export interface TitleEditorProps {
  isEditing: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  onToggleEdit: () => void;
}

export interface ApprovalLevelsProps {
  t: (key: string, options?: any) => string;
  tPageFieldBaseKey: string;
  type: string;
  theme: any;
  hideCondition?: boolean;
}

export interface ApprovalItem {
  id: number;
  display_name: string;
}

export interface ApprovalRequesterData {
  [key: string]: ApprovalItem[];
}

export interface CustomApprovalRequesterProps {
  value?: ApprovalRequesterData;
  onChange?: (value: ApprovalRequesterData) => void;
  type: string;
}
