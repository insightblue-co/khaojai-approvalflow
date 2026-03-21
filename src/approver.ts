import {
  ApprovalFlowBoxProps,
  ApprovalFlowData,
  ApprovalFlowEdge,
  ApprovalFlowNode,
  Rules,
  Step,
  SubmitterRules
} from './components/interface';
import { MarkerType } from '@xyflow/react';

export const LAYOUT = {
  defaultWidth: 500,
  endNodeWidth: 250,
  verticalSpacing: 200,
  horizontalSpacing: 100,
  baseNodeHeight: 60,
  formContentBaseHeight: 40,
  tagHeight: 15,
  tagRowSpacing: 8
} as const;

// Helper function to transform submitter rules
export const transformSubmitterRules = (submitterRules: any): any => {
  const selectedAll = submitterRules.rules?.all?.length === 0;
  const transformedRules = {
    condition: selectedAll ? 'everyone' : submitterRules.condition,
    rules: {} as Record<string, number[]>
  };

  if (submitterRules.rules && !selectedAll) {
    Object.entries(submitterRules.rules).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        transformedRules.rules[key] = (value as any[]).map(item => Number(item.id));
      }
    });
  }

  return transformedRules;
};

// Helper function to infer node_type from step_type for backward compatibility
export const inferNodeType = (step_type: string): 'ApprovalFlow' | 'Condition' | 'AddCondition' => {
  switch (step_type) {
    case 'ADD_CONDITION':
      return 'AddCondition';
    case 'CONDITIONAL':
      return 'Condition';
    default:
      return 'ApprovalFlow';
  }
};

// Helper function to transform steps
export const transformSteps = (steps: Step[]): any[] => {
  // Filter out virtual CONDITION nodes (they should not be saved to database)
  const realSteps = steps.filter((step: any) => !step._is_virtual && step.step_type !== 'CONDITIONAL');

  return realSteps.map(step => {
    // Clean up nexts to remove virtual fields
    const cleanedNexts =
      step.nexts?.map((next: any) => {
        const { _virtual_condition_id, _virtual_nexts, ...cleanNext } = next;
        return cleanNext;
      }) || [];

    return {
      pre_actions: step.pre_actions,
      post_actions: step.post_actions,
      nexts: cleanedNexts,
      form_id: step.form_id,
      form_name: step.form_name || null, // Include form_name field
      step_id: step.step_id,
      name: step.name,
      description: step.description,
      status: step.status,
      form_data_permissions: step.form_data_permissions,
      action_buttons: step.action_buttons,
      approval_type: step.approval_type,
      step_type: step.step_type,
      approvers: transformApprovers(step.approvers),
      approve_require: step.approve_require,
      position_x: Math.round(step.position_x ?? 0),
      position_y: Math.round(step.position_y ?? 0),
      ccs: transformCCs(step.ccs),
      extra: step.extra || {} // Include extra field for integration data and other step-specific data
      // Note: node_type is not saved to database as it can be inferred from step_type
    };
  });
};

// Helper function to check if there are other rules besides "all" or "submitter"
const hasOtherRules = (rules: Rules | undefined): boolean => {
  if (!rules) return false;
  return !!(
    (rules.users && rules.users.length > 0) ||
    (rules.departments && rules.departments.length > 0) ||
    (rules.roles && rules.roles.length > 0) ||
    (rules.supervisor_department && rules.supervisor_department.length > 0)
  );
};

// Helper function to transform approvers
export const transformApprovers = (approvers: SubmitterRules[]): any[] => {
  return approvers?.map(approver => {
    // Check if rules only contain "all" with empty array (everyone)
    if (approver.rules && approver.rules.all?.length === 0 && !hasOtherRules(approver.rules)) {
      return {
        condition: 'everyone',
        rules: {}
      };
    }
    // Check if rules only contain "submitter" with empty array
    if (approver.rules && approver.rules.submitter?.length === 0 && !hasOtherRules(approver.rules)) {
      return {
        condition: 'submitter',
        rules: {}
      };
    }
    
    // If condition is "everyone" but there are actual rules, change it to "and" (or use the condition from form if it's already "and" or "or")
    let condition = approver.condition;
    if (condition === 'everyone' && approver.rules && hasOtherRules(approver.rules)) {
      // If condition is "everyone" but there are actual rules, default to "and"
      condition = 'and';
    }
    
    return {
      condition: condition || 'and', // Default to "and" if condition is not set
      rules: transformRoles(approver.rules)
    };
  });
};

// Helper function to transform CCs
export const transformCCs = (ccs: SubmitterRules[]): any[] => {
  return ccs?.map(cc => {
    // Check if rules only contain "all" with empty array (everyone)
    if (cc.rules && cc.rules.all?.length === 0 && !hasOtherRules(cc.rules)) {
      return {
        condition: 'everyone',
        rules: {}
      };
    }
    // Check if rules only contain "submitter" with empty array
    if (cc.rules && cc.rules.submitter?.length === 0 && !hasOtherRules(cc.rules)) {
      return {
        condition: 'submitter',
        rules: {}
      };
    }
    
    // If condition is "everyone" but there are actual rules, change it to "and" (or use the condition from form if it's already "and" or "or")
    let condition = cc.condition;
    if (condition === 'everyone' && cc.rules && hasOtherRules(cc.rules)) {
      // If condition is "everyone" but there are actual rules, default to "and"
      condition = 'and';
    }
    
    return {
      condition: condition || 'and', // Default to "and" if condition is not set
      rules: transformRoles(cc.rules)
    };
  });
};

export const addLabelToValue = (submitterRules: SubmitterRules[], t: any, tPageFieldBaseKey: string): any[] => {
  return submitterRules?.map(submitterRule => {
    if (submitterRule.condition === 'everyone') {
      return {
        condition: 'everyone',
        rules: { all: [] }
      };
    }
    if (submitterRule.condition === 'submitter') {
      return {
        condition: 'submitter',
        rules: { submitter: [] }
      };
    }

    // Handle rule_details safely
    let filteredRules = {};
    if (
      (submitterRule.rules && typeof submitterRule.rule_details === 'object') ||
      submitterRule.rules?.supervisor_department
    ) {
      // Process each property of rule_details
      if (submitterRule.rule_details) {
        filteredRules = filterRules(submitterRule.rule_details);
      }
      if (submitterRule.rules?.supervisor_department) {
        filteredRules = {
          supervisor_department: submitterRule.rules.supervisor_department.map(item => {
            const level = Number(item) - 1;
            var displayName = '';
            if (Number(item) === 1) {
              displayName = 'หัวหน้าหน่วยงาน';
            } else {
              displayName = `สูงกว่าหัวหน้าหน่วยงาน + ${level}`;
            }
            return { id: item, display_name: displayName };
          })
        };
      }
    }

    return {
      condition: submitterRule.condition,
      rules: filteredRules
    };
  });
};

export const filterRules = (rules: Rules) => {
  return Object.entries(rules)
    .filter(([_, value]) => Array.isArray(value) && value.length > 0)
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value.map(item => {
          return { id: Number(item.id), display_name: item.display_name };
        })
      }),
      {}
    );
};

// Helper function to transform roles
export const transformRoles = (roles?: Rules | {}): Record<string, number[]> => {
  if (!roles) return {};

  return Object.entries(roles).reduce(
    (acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = (value as any[]).map(item => Number(item.id));
      }
      return acc;
    },
    {} as Record<string, number[]>
  );
};

// Helper function to create default rule object
const DEFAULT_QUALIFICATION_VALUE = 'and';
export const createDefaultRule = (): SubmitterRules | {} => ({
  condition: DEFAULT_QUALIFICATION_VALUE,
  rules: {}
});

// Helper function to ensure rules array is valid
export const ensureValidRulesArray = (rules: any): SubmitterRules[] => {
  if (Array.isArray(rules) && rules.length > 0) {
    // Transform each rule to ensure it has the correct structure
    return rules.map(rule => {
      // If rule already has 'condition' and 'rules', return it as is
      if (rule.condition && rule.rules) {
        return rule;
      }

      // Extract condition or use default
      const condition = rule.condition || DEFAULT_QUALIFICATION_VALUE;

      // Extract all properties except condition
      const { condition: _, ...otherProps } = rule;

      // Return properly structured rule
      return {
        condition,
        rules: otherProps
      };
    });
  }
  return [createDefaultRule()];
};

// Function to generate a unique step ID with the given prefix ('check' or 'approve')
export const generateUniqueStepId = (prefix: string, flow: ApprovalFlowData) => {
  // Get all existing step_ids that start with the given prefix
  const existingIds = flow.steps
    .filter(step => step.step_id.startsWith(prefix))
    .map(step => {
      // Extract the number part after the prefix
      const numMatch = step.step_id.match(new RegExp(`^${prefix}(\\d+)$`));
      return numMatch ? parseInt(numMatch[1], 10) : -1;
    });

  // Find the maximum existing ID number
  const maxId = Math.max(-1, ...existingIds);

  // Use the next number as the new ID
  return `${prefix}${maxId + 1}`;
};

/**
 * Extracts priority number from step_id (e.g., "condition1" -> 1)
 * Used for ordering conditional nodes horizontally
 */
export const getPriorityFromStepId = (stepId: string): number => {
  const match = stepId.match(/condition(\d+)/);
  return match ? parseInt(match[1], 10) : 999; // Default to high number if no match
};

/**
 * Creates a node object for ReactFlow
 */
export const createNode = (
  element: Step,
  index: number,
  xPos: number,
  yPos: number,
  isLastNode: boolean
): ApprovalFlowNode => {
  const nodeType = element.node_type ?? 'ApprovalFlow';
  return {
    id: element.step_id,
    type: nodeType,
    data: {
      index: index,
      isFirstNode: index === 0,
      isLastNode: isLastNode,
      type: element.step_id,
      label: `${element.name}`,
      content: `${element.name}`
    } as ApprovalFlowBoxProps,
    position: {
      x: xPos,
      y: yPos
    }
  } as ApprovalFlowNode;
};

/**
 * Creates an edge object for ReactFlow
 */
export const createEdge = (
  sourceId: string,
  targetId: string,
  isConditionBranch: boolean,
  label?: string
): ApprovalFlowEdge => {
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    label: label || '',
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 30,
      height: 30
    },
    data: {
      isCondition: isConditionBranch
    }
  } as ApprovalFlowEdge;
};

export const createSideEdge = (
  sourceId: string,
  targetId: string,
  isConditionBranch: boolean,
  label?: string,
  position?: 'left' | 'right'
): ApprovalFlowEdge => {
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    label: label || '',
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 30,
      height: 30
    },
    data: {
      isCondition: isConditionBranch
    },
    sourceHandle: position,
    targetHandle: position
  } as ApprovalFlowEdge;
};

/**
 * Renumbers virtual condition IDs to match their array positions
 */
export const renumberConditionIds = (steps: Step[]): Step[] => {
  return steps.map(step => {
    if (step.step_type !== 'ADD_CONDITION' || !step.nexts) return step;

    const groupNum = step.step_id.match(/addcondition(\d+)/)?.[1] || '0';
    const conditionBaseId = `condition${groupNum}`;

    return {
      ...step,
      nexts: step.nexts.map((next: any, index: number) => ({
        ...next,
        _virtual_condition_id: next._virtual_condition_id ? `${conditionBaseId}_${index + 1}` : undefined
      }))
    };
  });
};

/**
 * Builds lookup maps for efficient step operations
 */
export const buildStepMaps = (allSteps: Step[]) => {
  const stepMap = new Map<string, Step>();
  const referencesMap = new Map<string, Set<string>>();

  // Build step lookup map
  allSteps.forEach(step => {
    stepMap.set(step.step_id, step);
  });

  // Build references map (step_id -> set of steps that reference it)
  allSteps.forEach(step => {
    step.nexts.forEach((next: any) => {
      if (next.step_id) {
        if (!referencesMap.has(next.step_id)) {
          referencesMap.set(next.step_id, new Set());
        }
        referencesMap.get(next.step_id)!.add(step.step_id);
      }
    });
  });

  return { stepMap, referencesMap };
};

/**
 * Builds a complete set of all steps reachable from root steps (optimized)
 */
export const buildReachableSteps = (rootStepIds: string[], stepMap: Map<string, Step>): Set<string> => {
  const reachable = new Set<string>();

  const traverse = (stepId: string) => {
    if (reachable.has(stepId)) return;
    reachable.add(stepId);

    const step = stepMap.get(stepId);
    if (!step) return;

    step.nexts.forEach((next: any) => {
      if (next.step_id) traverse(next.step_id);
    });
  };

  rootStepIds.forEach(stepId => traverse(stepId));
  return reachable;
};

/**
 * Finds child nodes to delete (optimized with pre-built maps)
 */
export const findChildNodesToDelete = (
  startStepId: string,
  stepMap: Map<string, Step>,
  referencesMap: Map<string, Set<string>>,
  stepsToKeep: Set<string>
): string[] => {
  const nodesToDelete: string[] = [];
  const visited = new Set<string>();

  const traverse = (currentStepId: string) => {
    if (visited.has(currentStepId) || stepsToKeep.has(currentStepId)) return;

    visited.add(currentStepId);
    const currentStep = stepMap.get(currentStepId);
    if (!currentStep) return;

    // Check if referenced by steps outside deletion path (O(1) lookup)
    const referencingSteps = referencesMap.get(currentStepId) || new Set();
    const isUsedElsewhere = Array.from(referencingSteps).some(refStepId => !visited.has(refStepId));

    if (!isUsedElsewhere) {
      nodesToDelete.push(currentStepId);
      currentStep.nexts.forEach((next: any) => {
        if (next.step_id) traverse(next.step_id);
      });
    }
  };

  traverse(startStepId);
  return nodesToDelete;
};

/**
 * Updates grandparent step to bypass the ADD_CONDITION step and point to remaining condition
 */
export const updateGrandparentNexts = (
  steps: Step[],
  grandparentStepId: string,
  oldStepId: string,
  newStepId: string
): Step[] => {
  return steps.map(step => {
    if (step.step_id !== grandparentStepId) return step;

    return {
      ...step,
      nexts: step.nexts.map((next: any) =>
        next.step_id === oldStepId
          ? { ...next, step_id: newStepId, _virtual_condition_id: undefined, condition_name: undefined }
          : next
      )
    };
  });
};

/**
 * Shifts position of higher priority condition roots and their descendants left by specified amount
 */
export const shiftHigherPriorityConditions = (
  steps: Step[],
  parentStepId: string,
  deletedConditionPriority: number,
  shiftAmount: number,
  stepMap: Map<string, Step>
): Step[] => {
  const parentStep = steps.find(step => step.step_id === parentStepId);
  if (!parentStep) return steps;

  // Get condition roots that have higher priority than deleted one
  const higherPriorityRoots: string[] = [];
  parentStep.nexts.forEach((next: any, index: number) => {
    const priority = index + 1; // 1-based priority
    if (priority > deletedConditionPriority) {
      higherPriorityRoots.push(next.step_id);
    }
  });

  if (higherPriorityRoots.length === 0) return steps;

  // Find all descendants of higher priority roots
  const visited = new Set<string>();
  const stepsToShift = new Set<string>();

  const traverse = (stepId: string) => {
    if (visited.has(stepId)) return;
    visited.add(stepId);
    stepsToShift.add(stepId);

    const step = stepMap.get(stepId);
    if (!step) return;

    step.nexts.forEach((next: any) => {
      if (next.step_id) traverse(next.step_id);
    });
  };

  higherPriorityRoots.forEach(rootStepId => traverse(rootStepId));

  // Shift positions of affected steps
  return steps.map(step => {
    if (stepsToShift.has(step.step_id) && step.position_x !== undefined) {
      return {
        ...step,
        position_x: step.position_x - shiftAmount
      };
    }
    return step;
  });
};

/**
 * Removes a condition from parent's nexts array
 */
export const removeConditionFromParent = (steps: Step[], parentStepId: string, conditionId: string): Step[] => {
  return steps.map(step =>
    step.step_id === parentStepId
      ? { ...step, nexts: step.nexts.filter((next: any) => next._virtual_condition_id !== conditionId) }
      : step
  );
};
