import type { MouseEvent } from 'react';
import * as XYFlow from '@xyflow/react';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import { ApproveBoxProps, Next } from '../interface';
import * as SolarIconSet from 'solar-icon-set';
import { Button, Flex, message, Popconfirm, Typography } from 'antd';
import type { PopconfirmProps } from 'antd';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ConditionDrawer from '../conditionDrawer';
import {
  buildReachableSteps,
  buildStepMaps,
  findChildNodesToDelete,
  LAYOUT,
  removeConditionFromParent,
  renumberConditionIds,
  shiftHigherPriorityConditions,
  updateGrandparentNexts
} from '../../approver';

// ============= Styled Components =============
const ConditionBoxContainer = styled.div.withConfig({
  shouldForwardProp: prop => !['isEnd', 'isSelected', 'isMaxLevel'].includes(prop)
})<{ isEnd: boolean; isSelected: boolean; isMaxLevel: boolean }>`
  border: 2px solid ${props => (props.isSelected ? props.theme.colors.primary_03 : props.theme.colors.neutral_08)};
  border-radius: 5px;
  width: ${props => (props.isEnd ? '250px' : '500px')};
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.1);
  cursor: ${props => (props.isMaxLevel ? 'not-allowed' : 'pointer')};
  transition: border-color 0.2s ease-in-out;
  position: relative;
  opacity: ${props => (props.isMaxLevel ? 0.5 : 1)};
  pointer-events: ${props => (props.isMaxLevel ? 'none' : 'auto')};

  &:hover {
    border: 2px solid ${props => (props.isSelected ? props.theme.colors.primary_03 : props.theme.colors.primary_01)};
  }
`;

const NodeActionsContainer = styled.div.withConfig({
  shouldForwardProp: prop => prop !== 'isSelected'
})<{ isSelected: boolean }>`
  position: absolute;
  top: 0px;
  right: -45px;
  display: ${props => (props.isSelected ? 'flex' : 'none')};
  flex-direction: column;
  gap: 8px;
  z-index: 10;
`;

const ActionButton = styled(Button)`
  border-radius: 50%;
  width: 24px !important;
  height: 24px;
`;

const ConditionContent = styled.div`
  border-top: 1px solid ${props => props.theme.colors.neutral_08};
  padding: 16px;
  color: ${props => props.theme.colors.neutral_04};
  cursor: pointer;
`;

export const ConditionBox = (props: ApproveBoxProps) => {
  const { data, isSelected, onNodeClick, id } = props;
  const { flow, setFlow } = useApprovalFlowContext();
  const { t } = useTranslation('approval-setting');
  const theme = useTheme();
  const tPageFieldBaseKey = 'approveBoxFlow';

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Find parent ADD_CONDITION step
  const parentStep = flow.steps.find(
    step => step.step_type === 'ADD_CONDITION' && step.nexts.some((next: any) => next._virtual_condition_id === id)
  );

  // Get condition metadata
  const getConditionData = () => {
    if (!parentStep) return null;

    const index = parentStep.nexts.findIndex((next: any) => next._virtual_condition_id === id);
    if (index === -1) return null;

    const next = parentStep.nexts[index];

    return {
      level: index + 1,
      maxLevel: parentStep.nexts.length,
      isMaxLevel: index + 1 === parentStep.nexts.length,
      conditionName: (next as any).condition_name || '',
      step_id: (next as any)._virtual_condition_id || ''
    };
  };

  const conditionData = getConditionData();

  /**
   * Handles deletion when only 2 conditions remain
   * Deletes parent ADD_CONDITION step and redirects grandparent to remaining condition
   */
  const handleDeleteLastTwoConditions = (deletingCondition: Next, remainingCondition: Next) => {
    if (!parentStep) return;

    // Build optimized lookup maps
    const { stepMap, referencesMap } = buildStepMaps(flow.steps);

    // Find step that points to the ADD_CONDITION step
    const grandparentStep = flow.steps.find(step =>
      step.nexts.some((next: any) => next.step_id === parentStep.step_id)
    );

    // Build complete set of steps to keep (all steps reachable from remaining condition)
    const stepsToKeep = buildReachableSteps([remainingCondition.step_id], stepMap);

    // Find orphaned child nodes BEFORE modifying the flow
    const nodesToDelete = findChildNodesToDelete(deletingCondition.step_id, stepMap, referencesMap, stepsToKeep);

    let updatedSteps = [...flow.steps];

    // Update grandparent to point directly to remaining condition's target
    if (grandparentStep) {
      updatedSteps = updateGrandparentNexts(
        updatedSteps,
        grandparentStep.step_id,
        parentStep.step_id,
        remainingCondition.step_id
      );
    }

    // Remove ADD_CONDITION step and orphaned children (use Set for O(1) lookup)
    const deleteSet = new Set([parentStep.step_id, ...nodesToDelete]);
    updatedSteps = updatedSteps.filter(step => !deleteSet.has(step.step_id));

    setFlow({ ...flow, steps: updatedSteps });
  };

  /**
   * Handles deletion when more than 2 conditions exist
   * Removes condition and its orphaned children, then renumbers remaining conditions
   */
  const handleDeleteCondition = (deletingCondition: Next) => {
    if (!parentStep) return;

    // Build optimized lookup maps
    const { stepMap, referencesMap } = buildStepMaps(flow.steps);

    // Collect root steps from all other condition paths
    const otherConditionRoots: string[] = [];
    parentStep.nexts.forEach((next: any) => {
      if (next._virtual_condition_id !== id) {
        otherConditionRoots.push(next.step_id);
      }
    });

    // Build complete set of steps to preserve (all steps reachable from other conditions)
    const stepsToKeep = buildReachableSteps(otherConditionRoots, stepMap);

    // Find orphaned children
    const nodesToDelete = findChildNodesToDelete(deletingCondition.step_id, stepMap, referencesMap, stepsToKeep);

    // Shift higher priority conditions and its child BEFORE removing the condition
    const currentPriority = conditionData?.level || 0;
    let updatedSteps = shiftHigherPriorityConditions(
      flow.steps,
      parentStep.step_id,
      currentPriority,
      LAYOUT.defaultWidth + LAYOUT.horizontalSpacing,
      stepMap
    );

    // Remove condition from parent
    updatedSteps = removeConditionFromParent(updatedSteps, parentStep.step_id, id);

    // Remove orphaned children (use Set for O(1) lookup)
    const deleteSet = new Set(nodesToDelete);
    updatedSteps = updatedSteps.filter(step => !deleteSet.has(step.step_id));

    // Renumber remaining conditions for consistent ordering
    const finalSteps = renumberConditionIds(updatedSteps);

    setFlow({ ...flow, steps: finalSteps });
  };

  /**
   * Main delete handler
   */
  const handleDeleteClick: PopconfirmProps['onConfirm'] = (e?: React.MouseEvent<HTMLElement> | MouseEvent) => {
    e?.stopPropagation();

    if (!parentStep) return;

    const deletingCondition = parentStep.nexts.find((next: any) => next._virtual_condition_id === id);
    if (!deletingCondition) return;

    // Special case: Last 2 conditions - delete parent and redirect flow
    if (parentStep.nexts.length === 2) {
      const remainingCondition = parentStep.nexts.find((next: any) => next._virtual_condition_id !== id);
      if (!remainingCondition) return;

      handleDeleteLastTwoConditions(deletingCondition, remainingCondition);
    } else {
      // Normal case: Remove condition and orphaned children
      handleDeleteCondition(deletingCondition);
    }

    message.success(t('messages.deleteSuccess'));
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick();
  };

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDrawerOpen(true);
  };

  // Extract values with defaults
  const level = conditionData?.level || 0;
  const isMaxLevel = conditionData?.isMaxLevel || false;
  const conditionName = conditionData?.conditionName || '';

  return (
    <ConditionBoxContainer
      isEnd={data.type === 'end'}
      isSelected={isSelected}
      onClick={handleClick}
      isMaxLevel={isMaxLevel}
    >
      <NodeActionsContainer isSelected={isSelected}>
        <ActionButton
          icon={<SolarIconSet.Settings color={theme.colors.primary_02} size={14} iconStyle='Outline' />}
          onClick={handleOpenDrawer}
        />

        <Popconfirm
          title={t(`${tPageFieldBaseKey}.fields.deleteStep`)}
          description={t(`${tPageFieldBaseKey}.fields.deleteStepDesc`)}
          onConfirm={handleDeleteClick}
          okText={t(`${tPageFieldBaseKey}.actions.confirm`)}
          cancelText={t(`${tPageFieldBaseKey}.actions.cancel`)}
          onCancel={(e?: MouseEvent) => e?.stopPropagation()}
        >
          <ActionButton
            onClick={(e: MouseEvent) => e.stopPropagation()}
            icon={<SolarIconSet.TrashBinTrash color={theme.colors.primary_02} size={14} iconStyle='Outline' />}
          />
        </Popconfirm>
      </NodeActionsContainer>

      <Flex vertical={true} style={{ padding: 16, backgroundColor: '#ffffff' }}>
        <Flex justify='space-between' align='center'>
          <Flex align='center'>
            <Typography.Title level={5} style={{ color: isMaxLevel ? theme.colors.neutral_05 : 'green' }}>
              {conditionName || `${t(`${tPageFieldBaseKey}.fields.conditionalBranch`)} ${level}`}
            </Typography.Title>
          </Flex>
          <Typography.Title level={5} style={{ color: isMaxLevel ? theme.colors.neutral_05 : 'green' }}>
            {t(`${tPageFieldBaseKey}.fields.priority`)} {level}
          </Typography.Title>
        </Flex>
        <div style={{ color: theme.colors.neutral_04 }}>{`${conditionData?.step_id}`}</div>
      </Flex>

      <ConditionContent onClick={handleOpenDrawer}>
        <Flex align='center' justify='space-between'>
          {t(`${tPageFieldBaseKey}.actions.setCondition`)}
          <SolarIconSet.AltArrowRight color={theme.colors.primary_02} size={18} iconStyle='Outline' />
        </Flex>
      </ConditionContent>

      <ConditionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} stepId={id} />

      {!data.isFirstNode && <XYFlow.Handle type='target' position={XYFlow.Position.Top} id='target' />}
      {!data.isLastNode && <XYFlow.Handle type='source' position={XYFlow.Position.Bottom} id='source' />}

      <XYFlow.Handle type='source' position={XYFlow.Position.Right} id='right' style={{ top: '50%' }} />
      <XYFlow.Handle type='target' position={XYFlow.Position.Right} id='right' style={{ top: '50%' }} />
      <XYFlow.Handle type='source' position={XYFlow.Position.Left} id='left' style={{ top: '50%' }} />
      <XYFlow.Handle type='target' position={XYFlow.Position.Left} id='left' style={{ top: '50%' }} />
    </ConditionBoxContainer>
  );
};
