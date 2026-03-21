import type { MouseEvent } from 'react';
import * as XYFlow from '@xyflow/react';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import { ApproveBoxProps, Step } from '../interface';
import { ApproveBoxItemHeader } from './ApproveBoxItemHeader';
import { ApproveBoxItemRow } from './ApproveBoxItemRow';
import { getHeaderTypeByString } from './function';
import * as SolarIconSet from 'solar-icon-set';
import { Button, message, Popconfirm } from 'antd';
import type { PopconfirmProps } from 'antd';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { useTranslation } from 'react-i18next';
import { useAddDataDrawer } from '../../hooks/useAddDataDrawer';
import { AddDataDrawer } from '../addDataDrawer';
import { IntegrationDrawer } from '../integrationDrawer';

const ApproveBoxContainer = styled.div.withConfig({
  shouldForwardProp: prop => !['isEnd', 'isSelected'].includes(prop)
})<{ isEnd: boolean; isSelected: boolean }>`
  border: 2px solid ${props => (props.isSelected ? props.theme.colors.primary_03 : props.theme.colors.neutral_08)};
  border-radius: 5px;
  width: ${props => (props.isEnd ? '250px' : '500px')};
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
  position: relative;

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
  pointer-events: auto;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const ApproveBox = (props: ApproveBoxProps) => {
  const { data, isSelected, onNodeClick, id } = props;
  const { flow, setFlow } = useApprovalFlowContext();
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const theme = useTheme();
  const stepType = id === 'submit' ? id : id.slice(0, -1);

  // Use the custom hook for settings button
  const { addDataForm, openAddDataDrawer, openDrawer, closeDrawer, submitDrawer } = useAddDataDrawer(id, stepType);

  // Simple calculation - no need for useMemo
  const showDeleteButton = flow.steps.length > 2 && id !== 'submit';

  /**
   * Updates a step's nexts array when its target is being deleted
   * @param step - The step to update
   * @param deletedStepId - ID of the step being deleted
   * @param newTargetId - ID to replace with, or null if endpoint should be removed
   */
  const updateStepNexts = (step: Step, deletedStepId: string, newTargetId: string | null): Step => {
    // If no replacement target, filter out the deleted step
    if (!newTargetId) {
      return {
        ...step,
        nexts: step.nexts.filter(next => next.step_id !== deletedStepId)
      };
    }

    // Replace references to deleted step with the new target
    return {
      ...step,
      nexts: step.nexts.map(next => (next.step_id === deletedStepId ? { ...next, step_id: newTargetId } : next))
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to the pane
    onNodeClick();
  };

  const handleSettingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDrawer();
  };

  const handleDeleteClick: PopconfirmProps['onConfirm'] = (e?: React.MouseEvent<HTMLElement> | MouseEvent) => {
    e?.stopPropagation();

    // Find the step to be deleted
    const stepToDelete = flow.steps.find(step => step.step_id === id);

    if (!stepToDelete) {
      message.error('Step not found');
      return;
    }

    // Get the first next step ID that the deleted step was pointing to
    const firstNextStepId = stepToDelete.nexts.length > 0 ? stepToDelete.nexts[0].step_id : null;

    // Find the previous step that points to the current step
    const previousStep = flow.steps.find(step => step.nexts.some(next => next.step_id === id));

    // Create updated steps array
    const updatedSteps = flow.steps
      .map(step => {
        if (step.step_id === previousStep?.step_id) {
          return updateStepNexts(step, id, firstNextStepId);
        }
        return step;
      })
      .filter(step => step.step_id !== id); // Remove the deleted step

    // Create a new flow object with the updated steps
    const updatedFlow = {
      ...flow,
      steps: updatedSteps
    };

    setFlow(updatedFlow);
    message.success('Step deleted successfully');
  };

  return (
    <ApproveBoxContainer isEnd={data.type.includes('end')} isSelected={isSelected} onClick={handleClick}>
      <NodeActionsContainer isSelected={isSelected}>
        <ActionButton
          onClick={handleSettingClick}
          icon={<SolarIconSet.Settings color={theme.colors.primary_02} size={14} iconStyle='Outline' />}
        />
        {showDeleteButton && (
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
        )}
      </NodeActionsContainer>

      {ApproveBoxItemHeader({
        isFirstNode: data.isFirstNode,
        isLastNode: data.isLastNode,
        label: data.label,
        headerType: getHeaderTypeByString(data.type),
        id: id
      })}
      {!data.isLastNode && (
        <ApproveBoxItemRow
          type={stepType}
          id={id}
          label={data.label}
          content={data.content}
          onOpenDrawer={openDrawer}
        />
      )}

      {!data.isFirstNode && <XYFlow.Handle type='target' position={XYFlow.Position.Top} id='target' />}
      {!data.isLastNode && <XYFlow.Handle type='source' position={XYFlow.Position.Bottom} id='source' />}

      {/* Right side handles for conditional connections */}
      <XYFlow.Handle type='source' position={XYFlow.Position.Right} id='right' style={{ top: '50%' }} />
      <XYFlow.Handle type='target' position={XYFlow.Position.Right} id='right' style={{ top: '50%' }} />

      <XYFlow.Handle type='source' position={XYFlow.Position.Left} id='left' style={{ top: '50%' }} />
      <XYFlow.Handle type='target' position={XYFlow.Position.Left} id='left' style={{ top: '50%' }} />

      {stepType === 'integration' ? (
        <IntegrationDrawer
          addDataForm={addDataForm}
          openDrawer={openAddDataDrawer}
          handleCloseDrawer={closeDrawer}
          handleSubmit={submitDrawer}
          stepName={data.label}
          type={stepType}
          id={id}
        />
      ) : (
        <AddDataDrawer
          addDataForm={addDataForm}
          openDrawer={openAddDataDrawer}
          handleCloseDrawer={closeDrawer}
          handleSubmit={submitDrawer}
          stepName={data.label}
          type={stepType}
          id={id}
        />
      )}
    </ApproveBoxContainer>
  );
};
