import * as XYFlow from '@xyflow/react';
import styled from 'styled-components';
import { ApproveBoxProps, Step } from '../interface';
import { Button } from 'antd';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { generateUniqueStepId } from '../../approver';
import { useTranslation } from 'react-i18next';

const ConditionBoxContainer = styled.div.withConfig({
  shouldForwardProp: prop => !['isEnd', 'isSelected'].includes(prop)
})<{ isEnd: boolean; isSelected: boolean }>`
  width: ${props => (props.isEnd ? '250px' : '500px')};
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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

export const AddConditionBox = (props: ApproveBoxProps) => {
  const { data, isSelected, onNodeClick, id } = props;
  const { flow, setFlow } = useApprovalFlowContext();
  const { t } = useTranslation('approval-setting');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick();
  };

  const createEndStep = (endStepId: string): Step => ({
    pre_actions: null,
    post_actions: null,
    nexts: [],
    step_id: endStepId,
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
  });

  const handleAddCondition = () => {
    const currentStepId = id.split('-')[0];
    const currentStepIndex = flow.steps.findIndex(step => step.step_id === currentStepId);

    if (currentStepIndex === -1) return;

    const currentStep = flow.steps[currentStepIndex];
    if (currentStep.step_type !== 'ADD_CONDITION') return;

    // Generate new condition ID
    const conditionBaseId = `condition${currentStepId.slice(-1)}`;
    const nextConditionNumber = currentStep.nexts.length + 1;
    const newVirtualConditionId = `${conditionBaseId}_${nextConditionNumber}`;

    // Create new end step and condition
    const endStepId = generateUniqueStepId('end', flow);
    const newConditionNext = {
      condition_groups: [],
      step_id: endStepId,
      _virtual_condition_id: newVirtualConditionId
    };

    // Update steps: insert new condition before last, add end step
    const updatedSteps = [...flow.steps];
    updatedSteps[currentStepIndex] = {
      ...currentStep,
      nexts: [
        ...currentStep.nexts.slice(0, -1),
        newConditionNext as any,
        currentStep.nexts[currentStep.nexts.length - 1]
      ]
    };
    updatedSteps.splice(currentStepIndex + 1, 0, createEndStep(endStepId));

    setFlow({ ...flow, steps: updatedSteps });
  };

  return (
    <ConditionBoxContainer isEnd={data.type === 'end'} isSelected={isSelected} onClick={handleClick}>
      <NodeActionsContainer isSelected={isSelected}></NodeActionsContainer>

      <Button onClick={handleAddCondition}>{t('approveBoxFlow.actions.addConditionalBranch')}</Button>

      {!data.isFirstNode && <XYFlow.Handle type='target' position={XYFlow.Position.Top} id='target' />}
      {!data.isLastNode && <XYFlow.Handle type='source' position={XYFlow.Position.Bottom} id='source' />}
    </ConditionBoxContainer>
  );
};
