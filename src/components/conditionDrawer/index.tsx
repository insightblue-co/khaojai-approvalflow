import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Typography, Button, Input, Dropdown, Flex } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import * as SolarIconSet from 'solar-icon-set';
import styled from 'styled-components';
import { getApprovalFlowAdapters } from '../../adapters';

interface ConditionDrawerProps {
  open: boolean;
  onClose: () => void;
  stepId: string;
}

const StyledDrawer = styled(Drawer)`
  .ant-drawer-header {
    border-bottom: 1px solid ${props => props.theme.colors.neutral_08};
    padding: 16px 24px;
  }

  .ant-drawer-body {
    padding: 0;
  }

  .drawer-content {
    padding: 24px;
  }

  .drawer-footer {
    border-top: 1px solid ${props => props.theme.colors.neutral_08};
    padding: 12px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

/**
 * ConditionDrawer - Edit condition node properties (name, logic, priority)
 *
 * Key concepts:
 * - currentPriority: The condition's original priority when drawer opens
 * - selectedPriority: The new priority selected by user (updates immediately on dropdown click)
 * - All changes (priority, name, logic) are applied atomically in handleSubmit
 * - Priority swap also renumbers virtual_condition_ids to maintain consistency
 */
const ConditionDrawer: React.FC<ConditionDrawerProps> = ({ open, onClose, stepId }) => {
  const { t } = useTranslation('approval-setting');
  const theme = useTheme();
  const { flow, setFlow } = useApprovalFlowContext();
  const { ModalConditionSetting, getFormsByIds } = getApprovalFlowAdapters();
  const tPageFieldBaseKey = 'approveBoxFlow';

  // Condition data
  const [conditionName, setConditionName] = useState<string>('');
  const [logicCondition, setLogicCondition] = useState<any | undefined>(undefined);
  const [allFormPages, setAllFormPages] = useState<any[]>([]);

  // UI state
  const [isEditingName, setIsEditingName] = useState(false);

  // Priority state
  const [priorityItems, setPriorityItems] = useState<{ key: string; label: string }[]>([]);
  const [currentPriority, setCurrentPriority] = useState<number>(1); // Original priority
  const [selectedPriority, setSelectedPriority] = useState<number>(1); // New priority (updates on dropdown click)

  // Ref to trigger save in ModalConditionSetting
  const saveConditionRef = useRef<(() => void) | undefined>(undefined);

  // Ref to store the latest logic condition (to avoid state update delays)
  const latestLogicConditionRef = useRef<any | undefined>(undefined);

  // Load all forms from approval steps
  useEffect(() => {
    if (!open) return;

    const loadAllForms = async () => {
      try {
        // Collect unique form IDs from all steps AND from flow-level form
        const formIds = new Set<string>();

        // Add flow-level form if exists
        if (flow.form_name && flow.form_name.value) {
          formIds.add(flow.form_name.value);
        }

        // Add forms from steps
        flow.steps.forEach(step => {
          if (step.form_id && step.form_id !== null) {
            formIds.add(step.form_id);
          }
        });

        if (formIds.size === 0) {
          console.warn('[ConditionDrawer] No forms found in flow');
          setAllFormPages([]);
          return;
        }

        // Fetch all forms using the API function
        const forms = await getFormsByIds(Array.from(formIds));

        // Aggregate all pages from all forms
        const allPages: any[] = [];
        forms.forEach(form => {
          if (form && form.pages && Array.isArray(form.pages)) {
            allPages.push(...form.pages);
          }
        });

        setAllFormPages(allPages);
      } catch (error) {
        console.error('[ConditionDrawer] Error loading forms:', error);
        setAllFormPages([]);
      }
    };

    loadAllForms();
  }, [open, flow.steps, flow.form_name]);

  // Helper to find parent ADD_CONDITION step
  const findParentStep = (virtualConditionId: string) => {
    return flow.steps.find(
      step =>
        step.step_type === 'ADD_CONDITION' &&
        step.nexts.some((next: any) => next._virtual_condition_id === virtualConditionId)
    );
  };

  // Load existing condition when drawer opens or reset when closes
  useEffect(() => {
    if (!open) {
      setLogicCondition(undefined);
      latestLogicConditionRef.current = undefined;
      setConditionName('');
      setIsEditingName(false);
      setPriorityItems([]);
      setCurrentPriority(1);
      setSelectedPriority(1);
      return;
    }

    const parentStep = findParentStep(stepId);
    if (!parentStep) {
      setLogicCondition(undefined);
      setConditionName('');
      setPriorityItems([]);
      return;
    }

    // Find this condition's index in parent's nexts array
    const conditionIndex = parentStep.nexts.findIndex((n: any) => n._virtual_condition_id === stepId);
    if (conditionIndex === -1) return;

    const conditionNext = parentStep.nexts[conditionIndex];
    const priority = conditionIndex + 1; // 1-based priority

    // Load condition data
    setConditionName(conditionNext.condition_name || '');
    const loadedCondition = conditionNext.logic_condition
      ? JSON.parse(JSON.stringify(conditionNext.logic_condition))
      : undefined;
    setLogicCondition(loadedCondition);
    latestLogicConditionRef.current = loadedCondition;
    setCurrentPriority(priority);
    setSelectedPriority(priority);

    // Generate priority dropdown items
    setPriorityItems(
      Array.from({ length: parentStep.nexts.length }, (_, i) => ({
        key: String(i + 1),
        label: `${t(`${tPageFieldBaseKey}.fields.priority`)} ${i + 1}`
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepId]);

  /**
   * Handle submit - Apply all changes atomically
   * This ensures priority swap, name, and logic updates don't conflict
   */
  const handleSubmit = () => {
    // Trigger save in ModalConditionSetting to get the latest logic condition
    if (saveConditionRef.current) {
      saveConditionRef.current();
    }

    const parentStep = findParentStep(stepId);
    if (!parentStep) return;

    let updatedSteps = [...flow.steps];
    const parentStepIndex = updatedSteps.findIndex(s => s.step_id === parentStep.step_id);
    if (parentStepIndex === -1) return;

    // Step 1: Apply priority swap if changed
    if (currentPriority !== selectedPriority) {
      const fromIndex = currentPriority - 1;
      const toIndex = selectedPriority - 1;
      const newNexts = [...parentStep.nexts];

      // Swap positions in array
      [newNexts[fromIndex], newNexts[toIndex]] = [newNexts[toIndex], newNexts[fromIndex]];

      // Create a mapping of old virtual IDs to new virtual IDs
      const match = stepId?.match(/condition(\d+)_/);
      const groupNum = match ? match[1] : '0';
      const conditionBaseId = `condition${groupNum}`;
      const idMapping = new Map<string, string>();

      newNexts.forEach((next: any, index: number) => {
        if (next._virtual_condition_id) {
          const oldId = next._virtual_condition_id;
          const newId = `${conditionBaseId}_${index + 1}`;
          idMapping.set(oldId, newId);
          next._virtual_condition_id = newId;
        }
      });

      // Update the parent step with new nexts
      updatedSteps[parentStepIndex] = { ...parentStep, nexts: newNexts };

      // Update virtual nodes in flow.steps to match the new IDs
      updatedSteps = updatedSteps.map(step => {
        if ((step as any)._is_virtual && idMapping.has(step.step_id)) {
          return {
            ...step,
            step_id: idMapping.get(step.step_id)!
          };
        }
        return step;
      });

      // Clear positions of all virtual nodes in this group to force re-layout
      const allVirtualIds = Array.from(idMapping.values());
      updatedSteps = updatedSteps.map(step => {
        if ((step as any)._is_virtual && allVirtualIds.includes(step.step_id)) {
          return {
            ...step,
            position_x: undefined,
            position_y: undefined
          };
        }
        return step;
      });
    }

    // Step 2: Apply condition name and logic updates
    // Use the ref value to get the latest condition (avoids state update delays)
    const currentParent = updatedSteps[parentStepIndex];
    const conditionIndex = currentParent.nexts.findIndex((n: any) => n._virtual_condition_id === stepId);

    if (conditionIndex !== -1) {
      const newNexts = [...currentParent.nexts];
      newNexts[conditionIndex] = {
        ...newNexts[conditionIndex],
        condition_name: conditionName,
        logic_condition: latestLogicConditionRef.current
      };
      updatedSteps[parentStepIndex] = { ...currentParent, nexts: newNexts };
    }

    // Apply all changes to flow context
    setFlow({ ...flow, steps: updatedSteps });
    onClose();
  };

  const handleConditionSave = (condition: any) => {
    // Update both state and ref (ref is used in handleSubmit to avoid state update delays)
    setLogicCondition(condition);
    latestLogicConditionRef.current = condition;
  };

  const titleWithEditIcon = (
    <Flex align='center' gap={8} vertical={false} justify='space-between'>
      <Flex align='center' gap={8}>
        {isEditingName ? (
          <Input
            value={conditionName}
            onChange={e => setConditionName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onPressEnter={() => setIsEditingName(false)}
            placeholder={`${t(`${tPageFieldBaseKey}.fields.conditionalBranch`)} ${selectedPriority}`}
            autoFocus
            style={{ width: '300px' }}
          />
        ) : (
          <>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {conditionName || `${t(`${tPageFieldBaseKey}.fields.conditionalBranch`)} ${selectedPriority}`}
            </Typography.Title>
            <SolarIconSet.Pen2
              color={theme.colors.primary_02}
              size={18}
              iconStyle='Outline'
              onClick={() => setIsEditingName(true)}
              style={{ cursor: 'pointer', width: '24px', height: '24px' }}
            />
          </>
        )}
      </Flex>
      <Dropdown
        menu={{
          items: priorityItems,
          onClick: ({ key }) => {
            setSelectedPriority(parseInt(key, 10));
          }
        }}
        trigger={['click']}
      >
        <Button>
          {t(`${tPageFieldBaseKey}.fields.priority`)} {selectedPriority}{' '}
          <SolarIconSet.AltArrowDown size={16} iconStyle='Outline' />
        </Button>
      </Dropdown>
    </Flex>
  );

  return (
    <StyledDrawer
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      title={titleWithEditIcon}
      placement='right'
      width='80%'
      onClose={onClose}
      open={open}
      closable={false}
      maskClosable={false}
      footer={
        <Flex justify='end' align='center' gap={16}>
          <Button
            onClick={e => {
              onClose();
            }}
          >
            {t(`${tPageFieldBaseKey}.actions.cancel`)}
          </Button>
          <Button
            type='primary'
            onClick={e => {
              handleSubmit();
            }}
          >
            {t(`${tPageFieldBaseKey}.actions.confirm`)}
          </Button>
        </Flex>
      }
    >
      <div className='drawer-content'>
        <Flex align='center' gap={8} style={{ marginBottom: 16 }}>
          <Typography.Text type='secondary'>{t(`${tPageFieldBaseKey}.fields.conditionDrawerDesc`)}</Typography.Text>
          <SolarIconSet.InfoCircle size={16} iconStyle='Outline' />
        </Flex>

        <ModalConditionSetting
          key={`${stepId}-${logicCondition ? 'loaded' : 'new'}`}
          visible={open}
          onClose={() => {}}
          mode='show'
          initialLogicCondition={logicCondition}
          onSave={handleConditionSave}
          onSaveRef={saveConditionRef}
          pages={allFormPages}
          isModal={false}
        />
      </div>
    </StyledDrawer>
  );
};

export default ConditionDrawer;
