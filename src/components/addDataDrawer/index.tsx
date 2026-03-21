import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { Button, Drawer, Flex, Form, Radio, Steps } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';
import { AddDataDrawerProps, SubmitterRules } from '../interface';
import { CustomApprovalRequester } from './customApprovalRequester';
import { CustomFormSelect } from './customFormSelect';
import { ensureValidRulesArray } from '../../approver';
import { TitleEditor } from './TitleEditor';
import { ApprovalLevels } from './ApprovalLevels';
import { ActionButtonsField } from './ActionButtonsField';

const CustomRadioGroup = styled(Radio.Group)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AddDataDrawer: React.FC<AddDataDrawerProps> = ({
  addDataForm,
  openDrawer,
  handleCloseDrawer,
  handleSubmit,
  stepName,
  type,
  id
}) => {
  const theme = useTheme();
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { flow, setFlow } = useApprovalFlowContext();
  const [isEditTitle, setIsEditTitle] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [hideConditionMap, setHideConditionMap] = useState<Record<string, boolean>>({});
  const FORM_INITIAL_VALUES = {
    approval: 'manual',
    approval_qualification: 'and'
  };

  const isFirstStep = type === 'submit';
  const isEndStep = type === 'end';
  const isAddConditionStep = type === 'addcondition';
  const isConditionalStep = type === 'conditional';
  const isReviseStep = type === 'revise';

  // Get current approval type to determine what fields to show
  const [approvalType, setApprovalType] = useState<string>('manual');

  // Set initial title when drawer opens
  useEffect(() => {
    if (!openDrawer) return;

    setTitle(t(`${tPageFieldBaseKey}.fields.${stepName}`, { defaultValue: stepName }));

    const currentStep = flow.steps.find((step: any) => step.step_id === id);

    if (!currentStep) return;

    // Set approval type from current step
    if (isFirstStep) {
      // First step (submit) should always be manual
      setApprovalType('manual');
      addDataForm.setFieldValue('approval', 'manual');
    } else if (currentStep.approval_type) {
      const approvalTypeValue = currentStep.approval_type.toLowerCase();
      setApprovalType(approvalTypeValue);
      addDataForm.setFieldValue('approval', approvalTypeValue);
    } else {
      // Default to manual if no approval type is set
      setApprovalType('manual');
      addDataForm.setFieldValue('approval', 'manual');
    }

    // Initialize form data based on step type
    if (currentStep.step_id === 'submit') {
      // Handle submit step
      const submitterRules = flow.submitter_rules?.rules || {};
      const submitterCondition = flow.submitter_rules?.condition || 'and';

      // Set the main rules and qualification
      addDataForm.setFieldsValue({
        rules: submitterRules,
        approval_qualification: submitterCondition
      });

      // Initialize hideConditionMap for submitter
      if (submitterRules) {
        const roleKeys = Object.keys(submitterRules);
        setHideConditionMap({
          submitter: roleKeys.includes('all') || roleKeys.includes('submitter')
        });
      }
    } else {
      // Handle approval/cc/handler steps
      let existingRules = null;

      if (currentStep?.approvers?.length > 0) {
        existingRules = currentStep.approvers;
      } else if (currentStep.ccs?.length > 0) {
        existingRules = currentStep.ccs;
      }

      const submitterRules = ensureValidRulesArray(existingRules);

      addDataForm.setFieldValue('rules', submitterRules);

      // Initialize hideConditionMap for each rule
      const initialHideConditionMap: Record<string, boolean> = {};
      if (Array.isArray(submitterRules)) {
        submitterRules.forEach((submitterRule, index) => {
          if (submitterRule?.rules) {
            const roleKeys = Object.keys(submitterRule.rules);
            initialHideConditionMap[index] = roleKeys.includes('all') || roleKeys.includes('submitter');
          }
        });
        setHideConditionMap(initialHideConditionMap);
      }
    }

    // Set form data if available - prioritize individual step form over global form
    let formData = null;

    if (currentStep && currentStep.form_id && currentStep.form_name) {
      // Use individual step's form data
      formData = {
        value: currentStep.form_id,
        label: currentStep.form_name
      };
    } else if (flow.form_name?.label && flow.form_name?.value) {
      // Fallback to global form data
      formData = {
        value: flow.form_name.value,
        label: flow.form_name.label
      };
    }

    if (formData) {
      addDataForm.setFieldValue('form', formData);
    }

    addDataForm.setFieldValue('approve_require', currentStep?.approve_require);

    // Set action_buttons if available
    if (currentStep?.action_buttons) {
      addDataForm.setFieldValue('action_buttons', currentStep.action_buttons);
    }

    // Initial validation
    validateForm();
  }, [openDrawer, flow.steps, id, addDataForm, flow.submitter_rules, flow.form_name, stepName]);

  // Function to validate form and update button state
  const validateForm = () => {
    try {
      const values = addDataForm.getFieldsValue();

      // Check if required fields are filled based on form validation
      const requiredFieldsValid = addDataForm.getFieldsError().filter(({ errors }) => errors.length).length === 0;

      // For AUTO_APPROVE and AUTO_REJECT, skip rules validation
      const currentApprovalType = values.approval || approvalType;
      if (currentApprovalType === 'auto_approve' || currentApprovalType === 'auto_reject') {
        setIsButtonDisabled(!requiredFieldsValid);
        return;
      }

      // Custom validation for rules (only for MANUAL type)
      let rulesValid = false;

      if (values.rules) {
        if (isFirstStep) {
          // Validate first step rules
          const keys = Object.keys(values.rules);
          if (keys.length > 0) {
            if (keys.includes('all') || keys.includes('submitter')) {
              rulesValid = true;
            } else {
              // Check if any non-special key has a value
              rulesValid = keys.some(key => {
                const value = values.rules?.[key as keyof typeof values.rules];
                return Array.isArray(value) ? value.length > 0 : !!value;
              });
            }
          }
        } else {
          // Validate other steps rules
          if (Array.isArray(values.rules) && values.rules.length > 0) {
            rulesValid = values.rules.every((submitterRules: SubmitterRules) => {
              if (!submitterRules?.rules) return false;

              const roleKeys = Object.keys(submitterRules.rules);
              if (roleKeys.length === 0) return false;

              if (roleKeys.includes('all') || roleKeys.includes('submitter')) return true;

              return roleKeys.some(key => {
                const value = submitterRules.rules?.[key as keyof typeof submitterRules.rules];
                return Array.isArray(value) ? value.length > 0 : !!value;
              });
            });
          }
        }
      }

      // Enable button only if all validations pass
      setIsButtonDisabled(!requiredFieldsValid || !rulesValid);
    } catch (error) {
      console.error('Error validating form:', error);
      setIsButtonDisabled(true);
    }
  };

  const checkFormValidity = () => {
    // Update hideConditionMap based on current rules
    const rules = addDataForm.getFieldValue('rules');
    const newHideConditionMap: Record<string, boolean> = {};

    if (isFirstStep) {
      if (rules) {
        const roleKeys = Object.keys(rules);
        newHideConditionMap['submitter'] = roleKeys.includes('all') || roleKeys.includes('submitter');
      }
    } else if (Array.isArray(rules)) {
      rules.forEach((rule, index) => {
        if (rule?.rules) {
          const roleKeys = Object.keys(rule.rules);
          newHideConditionMap[index] = roleKeys.includes('all') || roleKeys.includes('submitter');
        }
      });
    }

    setHideConditionMap(newHideConditionMap);

    // Validate form
    validateForm();
  };

  const toggleEditTitle = () => {
    setIsEditTitle(prev => !prev);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const onFinishForm = useCallback(
    (values: any) => {
      // Update flow title and approval type
      const updatedFlow = { ...flow };
      const stepToUpdate = updatedFlow.steps.find((step: any) => step.step_id === id);
      if (stepToUpdate) {
        stepToUpdate.name = title;
        // Save approval type to step - convert to uppercase for backend
        // First step should always be MANUAL
        if (isFirstStep) {
          stepToUpdate.approval_type = 'MANUAL';
        } else if (values.approval) {
          stepToUpdate.approval_type = values.approval.toUpperCase();
        }
      }
      setFlow(updatedFlow);

      // Submit the form
      handleSubmit(values);
    },
    [flow, id, title, isFirstStep, setFlow, handleSubmit]
  );

  const handleCancel = () => {
    handleCloseDrawer();
    setIsButtonDisabled(true);
  };

  return (
    <Drawer
      title={
        <TitleEditor
          isEditing={isEditTitle}
          title={title}
          onTitleChange={handleTitleChange}
          onToggleEdit={toggleEditTitle}
        />
      }
      onClick={e => e.stopPropagation()}
      open={openDrawer}
      closable={false}
      width={640}
      maskClosable={false}
      footer={
        <Flex gap={8} justify='end'>
          <Button onClick={handleCancel} style={{ minWidth: '180px' }} size='large'>
            {t(`${tPageFieldBaseKey}.actions.cancel`)}
          </Button>
          <Button
            type='primary'
            style={{ minWidth: '180px' }}
            size='large'
            onClick={() => addDataForm.submit()}
            disabled={isButtonDisabled}
          >
            {t(`${tPageFieldBaseKey}.actions.confirm`)}
          </Button>
        </Flex>
      }
    >
      <Form
        layout='vertical'
        form={addDataForm}
        onFinish={onFinishForm}
        onValuesChange={checkFormValidity}
        validateTrigger={['onChange', 'onBlur']}
        initialValues={FORM_INITIAL_VALUES}
        onClick={e => e.stopPropagation()}
      >
        {!isFirstStep && !isEndStep && (
          <Form.Item label={t(`${tPageFieldBaseKey}.fields.approval`)} name='approval'>
            <Radio.Group onChange={e => setApprovalType(e.target.value)}>
              <Radio.Button value='manual'>{t(`${tPageFieldBaseKey}.fields.manual`)}</Radio.Button>
              <Radio.Button value='auto_approve'>{t(`${tPageFieldBaseKey}.fields.autoApprove`)}</Radio.Button>
              <Radio.Button value='auto_reject'>{t(`${tPageFieldBaseKey}.fields.autoReject`)}</Radio.Button>
            </Radio.Group>
          </Form.Item>
        )}

        {!isEndStep && approvalType !== 'auto_approve' && approvalType !== 'auto_reject' && (
          <Form.Item label={t(`${tPageFieldBaseKey}.fields.actionButtons`)} name='action_buttons'>
            <ActionButtonsField currentStepId={id} />
          </Form.Item>
        )}

        {approvalType !== 'auto_approve' && approvalType !== 'auto_reject' && (
          <Form.Item
            label={t(`${tPageFieldBaseKey}.fields.form`)}
            name='form'
            rules={[{ required: true, message: 'This field is required' }]}
          >
            <CustomFormSelect
              currentStep={flow.steps.find((step: any) => step.step_id === id)}
              onPermissionChange={permissions => {
                // Update the current step's form_data_permissions
                const updatedFlow = { ...flow };
                const stepToUpdate = updatedFlow.steps.find((step: any) => step.step_id === id);
                if (stepToUpdate) {
                  stepToUpdate.form_data_permissions = permissions;
                }
                setFlow(updatedFlow);
              }}
            />
          </Form.Item>
        )}

        {!isEndStep && isFirstStep ? (
          <>
            <Form.Item
              label={t(`${tPageFieldBaseKey}.fields.submitter`)}
              name='rules'
              rules={[{ required: true, message: 'This field is required' }]}
            >
              <CustomApprovalRequester type={type} />
            </Form.Item>

            {approvalType !== 'auto_approve' && approvalType !== 'auto_reject' && !hideConditionMap['submitter'] && (
              <Form.Item label={t(`${tPageFieldBaseKey}.fields.approvalQualification`)} name='approval_qualification'>
                <Radio.Group>
                  <Radio.Button value='and'>{t(`${tPageFieldBaseKey}.fields.matchAll`)}</Radio.Button>
                  <Radio.Button value='or'>{t(`${tPageFieldBaseKey}.fields.matchSome`)}</Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}
          </>
        ) : !isEndStep && approvalType !== 'auto_approve' && approvalType !== 'auto_reject' ? (
          <>
            <ApprovalLevels
              t={t}
              tPageFieldBaseKey={tPageFieldBaseKey}
              type={type}
              theme={theme}
              hideConditionMap={hideConditionMap}
            />

            {/* Only show approval require field if there's more than 1 approval level */}
            {Array.isArray(addDataForm.getFieldValue('rules')) && addDataForm.getFieldValue('rules').length > 1 && (
              <Form.Item
                label={t(`${tPageFieldBaseKey}.fields.${type}Require`)}
                name='approve_require'
                rules={[
                  {
                    required: true,
                    message: 'This field is required'
                  }
                ]}
              >
                <CustomRadioGroup>
                  <Radio value='ALL'>{t(`${tPageFieldBaseKey}.fields.${type}RequireAll`)}</Radio>
                  <Radio value='ANY'>{t(`${tPageFieldBaseKey}.fields.${type}RequireAny`)}</Radio>
                </CustomRadioGroup>
              </Form.Item>
            )}
          </>
        ) : null}
      </Form>
    </Drawer>
  );
};
