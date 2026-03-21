import React from 'react';
import { Tag, Tooltip } from 'antd';
import { TFunction } from 'i18next';
import { Rules, DisplayItem, ItemWithCount } from '../components/interface';

// Type definitions
export type StepType = 'submit' | 'approve' | 'check' | 'approved' | 'revise' | 'default';

export interface StepConfig {
  rules: {
    rules: Rules | null;
  } | null;
}

// Constants
export const MAX_DISPLAY_ITEMS = 2;
export const TAG_STYLES = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: '6px'
  },
  countBadge: {
    margin: 0,
    lineHeight: '16px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '100px'
  }
};

/**
 * Determine step type based on id pattern
 */
export const getStepType = (id: string): StepType => {
  if (id === 'submit') return 'submit';
  if (id.match(/^approve\d*$/)) return 'approve';
  if (id.match(/^check\d*$/)) return 'check';
  if (id.match(/^approved\d*$/)) return 'approved';
  if (id.toLowerCase().startsWith('revise')) return 'revise';
  return 'default';
};

/**
 * Check if step is a submit or revise step
 */
export const isSubmitOrReviseStep = (stepId: string): boolean => {
  if (!stepId) return false;
  const lowercaseId = stepId.toLowerCase();
  const type = getStepType(lowercaseId);
  return (
    type === 'submit' ||
    type === 'revise' ||
    lowercaseId === 'submit' ||
    lowercaseId === 'submitted' ||
    lowercaseId.startsWith('revise')
  );
};

/**
 * Get step configuration based on step type and flow data
 */
export const getStepConfig = (stepType: StepType, flow: any, stepId?: string, stepData?: any): StepConfig => {
  if (stepType === 'check' || stepType === 'approved') {
    // Use flow data if available, otherwise use step data
    const approvers =
      stepId !== undefined
        ? flow.steps.find((step: any) => step.step_id === stepId)?.approvers || []
        : stepData?.approvers || [];
    return {
      rules: {
        rules: mergeRoles(approvers)
      }
    };
  }

  if (stepType === 'approve') {
    // Use flow data if available, otherwise use step data
    const ccs =
      stepId !== undefined ? flow.steps.find((step: any) => step.step_id === stepId)?.ccs || [] : stepData?.ccs || [];
    return {
      rules: {
        rules: mergeRoles(ccs)
      }
    };
  }

  // For other types, use the original configuration
  const configs: Record<string, StepConfig> = {
    submit: {
      rules: flow.submitter_rules || stepData?.submitter_rules
    },
    revise: {
      rules: flow.submitter_rules || stepData?.submitter_rules
    },
    default: {
      rules: null
    }
  };

  return configs[stepType] || configs.default;
};

/**
 * Process items to display first N items and calculate remaining
 * @param items Array of items with display_name property
 * @param maxDisplay Maximum number of items to display
 * @returns Object containing display text and hidden items info
 */
export const processItemsWithCount = <T extends DisplayItem>(
  items: T[] | null | undefined = [],
  maxDisplay: number = MAX_DISPLAY_ITEMS
): ItemWithCount<T> => {
  if (!items?.length) {
    return {
      displayText: '',
      remainingCount: 0,
      displayItems: [],
      hiddenItems: []
    };
  }

  const displayItems = items.slice(0, maxDisplay);
  const hiddenItems = items.slice(maxDisplay);

  return {
    displayText: displayItems.map(item => item.display_name).join(', '),
    remainingCount: hiddenItems.length,
    displayItems,
    hiddenItems
  };
};

/**
 * Helper function to merge roles from multiple sources
 */
export const mergeRoles = (sources: Array<{ rules?: Rules; rule_details?: Rules }>): Rules => {
  const mergedRoles: Rules = {
    roles: [],
    users: [],
    departments: [],
    supervisor_department: []
  };

  sources.forEach(source => {
    // Use rule_details if available (from step data), otherwise use rules (from flow data)
    const rulesData = source.rule_details || source.rules;

    // Check if source has condition === 'submitter' (from backend approver data)
    if ((source as any).condition === 'submitter') {
      mergedRoles.submitter = [{ id: 'submitter', display_name: 'submitter' }] as any;
    }

    if (rulesData) {
      if (rulesData.all) {
        mergedRoles.all = rulesData.all;
      }

      if (rulesData.roles) {
        mergedRoles.roles = [...(mergedRoles.roles || []), ...rulesData.roles];
      }

      if (rulesData.users) {
        mergedRoles.users = [...(mergedRoles.users || []), ...rulesData.users];
      }

      if (rulesData.departments) {
        mergedRoles.departments = [...(mergedRoles.departments || []), ...rulesData.departments];
      }

      if (rulesData.supervisor_department) {
        mergedRoles.supervisor_department = [
          ...(mergedRoles.supervisor_department || []),
          ...rulesData.supervisor_department
        ];
      }

      if (rulesData.submitter) {
        mergedRoles.submitter = rulesData.submitter;
      }
    }
  });

  return mergedRoles;
};

/**
 * Renders a tag with a count badge for hidden items
 */
export const renderTagWithCount = (
  key: string,
  labelKey: string,
  items: DisplayItem[] | null | undefined,
  t: TFunction,
  tPageFieldBaseKey: string,
  theme: any
) => {
  const translatedLabel = t(`${tPageFieldBaseKey}.fields.${labelKey}`);

  // for all, submitter case
  if ((key === 'all' || key === 'submitter') && items?.length === 0) {
    return (
      <Tag key={key} style={TAG_STYLES.container}>
        {`${translatedLabel}`}
      </Tag>
    );
  }

  if (!items?.length) return null;

  const { displayText, remainingCount, hiddenItems } = processItemsWithCount(items);

  // Create tooltip content only for hidden items when there are any
  const tooltipContent = remainingCount > 0 ? hiddenItems.map(item => item.display_name).join(', ') : '';

  return (
    <Tag key={key} style={TAG_STYLES.container}>
      {`${translatedLabel}: ${displayText}`}
      {remainingCount > 0 && (
        <Tooltip title={tooltipContent} placement='top'>
          <Tag
            style={{
              ...TAG_STYLES.countBadge,
              backgroundColor: theme.colors.neutral_10,
              color: theme.colors.neutral_05
            }}
          >
            +{remainingCount}
          </Tag>
        </Tooltip>
      )}
    </Tag>
  );
};

/**
 * Renders all submitter rules tags
 */
export const renderSubmitterRules = (
  rules: Rules | null | undefined,
  t: TFunction,
  tPageFieldBaseKey: string,
  theme: any
) => {
  if (!rules) return null;

  return (
    <>
      {renderTagWithCount('all', 'everyone', rules?.all, t, tPageFieldBaseKey, theme)}
      {renderTagWithCount('departments', 'department', rules?.departments, t, tPageFieldBaseKey, theme)}
      {renderTagWithCount(
        'supervisor_department',
        'departmentManager',
        rules?.supervisor_department,
        t,
        tPageFieldBaseKey,
        theme
      )}
      {renderTagWithCount('roles', 'role', rules?.roles, t, tPageFieldBaseKey, theme)}
      {renderTagWithCount('users', 'selectMember', rules?.users, t, tPageFieldBaseKey, theme)}
      {renderTagWithCount('submitter', 'submitter', rules?.submitter, t, tPageFieldBaseKey, theme)}
    </>
  );
};
