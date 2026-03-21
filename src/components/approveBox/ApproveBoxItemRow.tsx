import { Button, Flex, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import * as SolarIconSet from 'solar-icon-set';
import { useTheme } from 'styled-components';
import { useMemo, memo } from 'react';
import { ApprovalBoxItemRowProps } from '../interface';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import {
  getStepType,
  getStepConfig,
  renderSubmitterRules as renderSubmitterRulesHelper
} from '../../helpers/submitterRulesHelper';

/**
 * ApproveBoxItemRow component displays approval flow step information
 */
export const ApproveBoxItemRow = (props: ApprovalBoxItemRowProps) => {
  const { id, label, type, onOpenDrawer } = props;
  const theme = useTheme();
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { flow } = useApprovalFlowContext();

  // Determine step type and get config
  const stepType = getStepType(type);

  // Get config for current step type using helper function
  const config = useMemo(() => {
    return getStepConfig(stepType, flow, id);
  }, [stepType, flow, id]);

  /**
   * Renders all submitter rules tags
   */
  const renderSubmitterRules = () => {
    if (!config.rules?.rules) return null;

    const { rules } = config.rules;

    return renderSubmitterRulesHelper(rules, t, tPageFieldBaseKey, theme);
  };

  /**
   * Renders the add data button
   */
  const renderAddDataButton = () => (
    <Flex align='center' justify='center' style={{ padding: 8 }}>
      <Button
        icon={<SolarIconSet.AddCircle color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
        onClick={e => {
          e.stopPropagation(); // Prevent event bubbling to parent container
          onOpenDrawer?.();
        }}
      >
        {t('approveBoxFlow.actions.addData')}
      </Button>
    </Flex>
  );

  // Add safety check to ensure the flow step exists at the given index
  const flowStep = flow?.steps.find((step: any) => step.step_id === id);

  if (!flowStep) {
    return null; // Return null if the step doesn't exist
  }

  /**
   * Renders the content with form info
   */
  const renderFormContent = () => (
    <Flex vertical align='flex-start' style={{ padding: '8px 16px' }} gap={8}>
      <Flex justify='flex-start' gap={8} style={{ width: '100%' }}>
        <SolarIconSet.Bookmark color={theme.colors.primary_02} size={18} iconStyle='Outline' />
        {flowStep.form_name || flow.form_name?.label}
      </Flex>
      {renderSubmitterRules()}
    </Flex>
  );

  return (
    <div style={{ borderTop: `1px solid ${theme.colors.neutral_08}` }}>
      {flowStep.form_id ? renderFormContent() : renderAddDataButton()}
    </div>
  );
};
