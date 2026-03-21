import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ApprovalHeaderType, Step } from '../interface';
import { getImagePathByHeaderType, getTextByHeaderType } from './function';
import { generateUniqueStepId } from '../../approver';

const ActionFlowContainer = styled.div`
  display: flex;
  padding: 8px;
  border: 1px solid #e4e7ec;
  background-color: #fff;
  width: 190px;
  justify-content: start;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.theme.colors.primary_03};

    .ant-typography {
      color: #fff !important;
    }
  }
`;

const StyledTitle = styled(Typography.Text)`
  text-align: center;
  padding-top: 4px;
  margin-bottom: 0;
  color: #0c111d;
  transition: color 0.3s;
`;

interface ApproveBoxActionsProps {
  id: string;
  isStandalone?: boolean;
  actionsFilter?: ApprovalHeaderType[];
}

export const ApproveBoxActions = ({ id, isStandalone = false, actionsFilter }: ApproveBoxActionsProps) => {
  const { flow, setFlow } = useApprovalFlowContext();

  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';

  const defaultActionsItem = [
    // ApprovalHeaderType.SUBMIT,
    ApprovalHeaderType.APPROVER,
    ApprovalHeaderType.CC_TO,
    ApprovalHeaderType.PROCESSING,
    ApprovalHeaderType.REVISE,
    ApprovalHeaderType.CONDITION,
    ApprovalHeaderType.INTEGRATION
    // ApprovalHeaderType.NEXT_APPROVAL,
    // ApprovalHeaderType.END
  ];

  const actionsItem = actionsFilter || defaultActionsItem;

  const handleClick = (item: ApprovalHeaderType) => {
    const updatedSteps = [...flow.steps];

    // If standalone mode, create node near the + button (top right)
    if (isStandalone) {
      // Position near the + button in top right corner
      // Offset it down and left a bit from the button
      const posX = window.innerWidth - 580; // 580px from right (button is at 20px + 48px width + some spacing)
      const posY = 100; // 100px from top (button is at 20px + some spacing)

      let newStep: Step;

      switch (item) {
        case ApprovalHeaderType.APPROVER: {
          const uniqueStepId = generateUniqueStepId('check', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
            name: 'approver',
            description: '',
            status: 'APPROVER',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'APPROVE',
            approval_type: 'MANUAL_APPROVE',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        case ApprovalHeaderType.CC_TO: {
          const uniqueStepId = generateUniqueStepId('approve', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
            name: 'cc_to',
            description: '',
            status: 'CC_TO',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'CC',
            approval_type: 'MANUAL_APPROVE',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        case ApprovalHeaderType.PROCESSING: {
          const uniqueStepId = generateUniqueStepId('approved', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
            name: 'processing',
            description: '',
            status: 'PROCESSING',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'HANDLE',
            approval_type: 'MANUAL_APPROVE',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        case ApprovalHeaderType.REVISE: {
          const uniqueStepId = generateUniqueStepId('revise', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
            name: 'revise',
            description: '',
            status: 'REVISE',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'REVISE',
            approval_type: 'MANUAL',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        case ApprovalHeaderType.END: {
          const uniqueStepId = generateUniqueStepId('end', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
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
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        case ApprovalHeaderType.INTEGRATION: {
          const uniqueStepId = generateUniqueStepId('integration', flow);
          newStep = {
            pre_actions: null,
            post_actions: null,
            nexts: [], // No nexts - standalone
            step_id: uniqueStepId,
            name: 'integration',
            description: '',
            status: 'INTEGRATION',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'INTEGRATION',
            approval_type: 'AUTO_APPROVE',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'ApprovalFlow',
            position_x: posX,
            position_y: posY
          };
          break;
        }
        default:
          return;
      }

      updatedSteps.push(newStep);

      console.log('🆕 Created standalone node:', {
        stepId: newStep.step_id,
        type: newStep.step_type,
        position: { x: posX, y: posY },
        totalSteps: updatedSteps.length
      });

      setFlow({
        ...flow,
        steps: updatedSteps
      });

      console.log('✅ Flow updated with new standalone node');
      return;
    }

    // Original logic for adding nodes in flow (non-standalone mode)
    // Extract the current step ID from the component ID
    const currentStepId = id.split('-')[0];

    // Find the current step index
    const currentStepIndex = updatedSteps.findIndex(step => step.step_id === currentStepId);
    if (currentStepIndex === -1) return;

    const currentStep = updatedSteps[currentStepIndex];

    // Check if current step is a virtual CONDITION node
    const isVirtualCondition = (currentStep as any)._is_virtual === true;

    // Get next step ids
    const nextStepIds = currentStep?.nexts?.map(n => n.step_id) || [];
    // Check if current step branches to two Condition nodes
    const isBranchToConditions =
      nextStepIds.length >= 2 &&
      nextStepIds.every(nextId => {
        const s = updatedSteps.find(st => st.step_id === nextId);
        return (s as Step)?.node_type === 'Condition';
      });

    const buildNexts = (targetIds: string[]) => targetIds.map(tid => ({ condition_groups: null, step_id: tid }));

    // Helper function to update parent ADD_CONDITION node if current is virtual
    const updateParentAddCondition = (newStepId: string) => {
      if (isVirtualCondition) {
        // Find the parent ADD_CONDITION node
        const parentAddCondition = updatedSteps.find(
          step =>
            step.step_type === 'ADD_CONDITION' &&
            step.nexts?.some((next: any) => next._virtual_condition_id === currentStepId)
        );

        if (parentAddCondition) {
          // Update the corresponding next in ADD_CONDITION
          parentAddCondition.nexts = parentAddCondition.nexts?.map((next: any) => {
            if (next._virtual_condition_id === currentStepId) {
              return {
                ...next,
                step_id: newStepId // Update to point to the new step
              };
            }
            return next;
          });
        }
      }
    };

    switch (item) {
      case ApprovalHeaderType.APPROVER: {
        // Generate a unique ID for the new step
        const uniqueStepId = generateUniqueStepId('check', flow);

        // Create new approver step
        const newStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: isBranchToConditions ? buildNexts(nextStepIds) : buildNexts([nextStepIds[0] || 'end1']),
          step_id: uniqueStepId,
          name: 'approver',
          description: '',
          status: 'APPROVER',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'APPROVE',
          approval_type: 'MANUAL_APPROVE',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'ApprovalFlow'
        };

        // Update current step's next to point to the new step (replacing single or multiple branches)
        updatedSteps[currentStepIndex].nexts = buildNexts([uniqueStepId]);

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(uniqueStepId);

        // Insert new step after current step
        updatedSteps.splice(currentStepIndex + 1, 0, newStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }

      case ApprovalHeaderType.CC_TO: {
        // Generate a unique ID for the new step
        const uniqueStepId = generateUniqueStepId('approve', flow);

        // Create new CC step
        const newStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: isBranchToConditions ? buildNexts(nextStepIds) : buildNexts([nextStepIds[0] || 'end1']),
          step_id: uniqueStepId,
          name: 'cc_to',
          description: '',
          status: 'CC_TO',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'CC',
          approval_type: 'MANUAL_APPROVE',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'ApprovalFlow'
        };

        // Update current step's next to point to the new step (replacing single or multiple branches)
        updatedSteps[currentStepIndex].nexts = buildNexts([uniqueStepId]);

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(uniqueStepId);

        // Insert new step after current step
        updatedSteps.splice(currentStepIndex + 1, 0, newStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }

      case ApprovalHeaderType.PROCESSING: {
        // Generate a unique ID for the new step
        const uniqueStepId = generateUniqueStepId('approved', flow);

        // Create new condition step
        const newStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: isBranchToConditions ? buildNexts(nextStepIds) : buildNexts([nextStepIds[0] || 'end1']),
          step_id: uniqueStepId,
          name: 'processing',
          description: '',
          status: 'PROCESSING',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'HANDLE',
          approval_type: 'MANUAL_APPROVE',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'ApprovalFlow'
        };

        // Update current step's next to point to the new step (replacing single or multiple branches)
        updatedSteps[currentStepIndex].nexts = buildNexts([uniqueStepId]);

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(uniqueStepId);

        // Insert new step after current step
        updatedSteps.splice(currentStepIndex + 1, 0, newStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }

      case ApprovalHeaderType.REVISE: {
        // Generate a unique ID for the new step
        const uniqueStepId = generateUniqueStepId('revise', flow);

        // Create new revise step
        const newStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: isBranchToConditions ? buildNexts(nextStepIds) : buildNexts([nextStepIds[0] || 'end1']),
          step_id: uniqueStepId,
          name: 'revise',
          description: '',
          status: 'REVISE',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'REVISE',
          approval_type: 'MANUAL',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'ApprovalFlow'
        };

        // Update current step's next to point to the new step (replacing single or multiple branches)
        updatedSteps[currentStepIndex].nexts = buildNexts([uniqueStepId]);

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(uniqueStepId);

        // Insert new step after current step
        updatedSteps.splice(currentStepIndex + 1, 0, newStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }

      case ApprovalHeaderType.INTEGRATION: {
        // Generate a unique ID for the new step
        const uniqueStepId = generateUniqueStepId('integration', flow);

        // Create new integration step
        const newStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: isBranchToConditions ? buildNexts(nextStepIds) : buildNexts([nextStepIds[0] || 'end1']),
          step_id: uniqueStepId,
          name: 'integration',
          description: '',
          status: 'INTEGRATION',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'INTEGRATION',
          approval_type: 'AUTO_APPROVE',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'ApprovalFlow'
        };

        // Update current step's next to point to the new step (replacing single or multiple branches)
        updatedSteps[currentStepIndex].nexts = buildNexts([uniqueStepId]);

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(uniqueStepId);

        // Insert new step after current step
        updatedSteps.splice(currentStepIndex + 1, 0, newStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }

      case ApprovalHeaderType.CONDITION: {
        const addConditionUniqueStepId = generateUniqueStepId('addcondition', flow);
        const conditionUniqueStepId = `condition${addConditionUniqueStepId.slice(-1)}`;

        const endUniqueStepId = generateUniqueStepId('end', flow);

        // Create end step
        const endStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: [],
          step_id: endUniqueStepId,
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
        };

        // Create ADD_CONDITION step with virtual condition references
        // The condition nodes will be created virtually for UI rendering only
        const addConditionStep: Step = {
          pre_actions: null,
          post_actions: null,
          nexts: [
            // First condition branch - always points to end
            {
              condition_groups: [], // Empty array means "condition not set yet"
              step_id: endUniqueStepId,
              _virtual_condition_id: `${conditionUniqueStepId}_1`
            } as any,
            // Second condition branch - points to original next steps
            {
              condition_groups: [], // Empty array means "condition not set yet"
              step_id: nextStepIds[0] || 'end1', // This will be the actual target in DB
              _virtual_condition_id: `${conditionUniqueStepId}_2`,
              _virtual_nexts: isBranchToConditions ? nextStepIds : [] // Store all original nexts for virtual rendering
            } as any
          ],
          step_id: addConditionUniqueStepId,
          name: 'addcondition',
          description: '',
          status: '',
          form_id: null,
          form_name: null,
          form_data_permissions: null,
          action_buttons: null,
          step_type: 'ADD_CONDITION',
          approval_type: 'AUTO_APPROVE',
          approvers: [],
          approve_require: 'ANY',
          ccs: [],
          node_type: 'AddCondition'
        };

        // Update current step to point to ADD_CONDITION
        updatedSteps[currentStepIndex].nexts = [{ condition_groups: null, step_id: addConditionUniqueStepId }];

        // Update parent ADD_CONDITION if current is virtual
        updateParentAddCondition(addConditionUniqueStepId);

        // Only insert ADD_CONDITION step and end step (no separate CONDITION steps)
        updatedSteps.splice(currentStepIndex + 1, 0, addConditionStep, endStep);

        setFlow({
          ...flow,
          steps: updatedSteps
        });
        break;
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {actionsItem.map(item => {
        return (
          <ActionFlowContainer key={item.toString()} onClick={() => handleClick(item)}>
            <img src={getImagePathByHeaderType(item)} height={20} />
            <StyledTitle>{t(`${tPageFieldBaseKey}.fields.${getTextByHeaderType(item)}`)}</StyledTitle>
          </ActionFlowContainer>
        );
      })}
    </div>
  );
};
