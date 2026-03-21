import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { Button, Drawer, Flex, Form, Radio, Typography, Spin } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AddDataDrawerProps, ActionButton } from '../interface';
import { TitleEditor } from '../addDataDrawer/TitleEditor';
import { CustomFormSelect } from '../addDataDrawer/customFormSelect';
import { ActionButtonsField } from '../addDataDrawer/ActionButtonsField';
import { getApprovalFlowAdapters } from '../../adapters';
import { Step } from '../interface';
import styled from 'styled-components';

const PDFIntegrationsContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const { Text } = Typography;

export const IntegrationDrawer: React.FC<AddDataDrawerProps> = ({
  addDataForm,
  openDrawer,
  handleCloseDrawer,
  handleSubmit,
  stepName,
  type,
  id
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { flow, setFlow } = useApprovalFlowContext();
  const { get, PDFIntegrationsList } = getApprovalFlowAdapters();
  const [isEditTitle, setIsEditTitle] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [pdfIntegrations, setPdfIntegrations] = useState<string[]>([]);
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>({});
  const [approvalType, setApprovalType] = useState<string>('auto_approve');
  const [formData, setFormData] = useState<any>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);


  // Set initial title when drawer opens
  useEffect(() => {
    if (!openDrawer) return;

    const currentStep = flow.steps.find((step: any) => step.step_id === id);

    if (!currentStep) return;

    // Set title - use saved name or default translation
    const savedName = currentStep.name;
    if (savedName) {
      setTitle(savedName);
    } else {
      const displayName = stepName === 'integration' 
        ? t(`${tPageFieldBaseKey}.fields.integration`, { defaultValue: 'การเชื่อมต่อ' })
        : t(`${tPageFieldBaseKey}.fields.${stepName}`, { defaultValue: stepName });
      setTitle(displayName);
    }

    // Set approval type from current step
    if (currentStep.approval_type) {
      const approvalTypeValue = currentStep.approval_type.toLowerCase();
      setApprovalType(approvalTypeValue);
      addDataForm.setFieldValue('approval', approvalTypeValue);
    } else {
      // Default to AUTO_APPROVE
      setApprovalType('auto_approve');
      addDataForm.setFieldValue('approval', 'auto_approve');
    }

    // Set form data if available
    let formValue = null;
    if (currentStep && currentStep.form_id && currentStep.form_name) {
      formValue = {
        value: currentStep.form_id,
        label: currentStep.form_name
      };
      setSelectedFormId(currentStep.form_id);
    } else if (flow.form_name?.label && flow.form_name?.value) {
      formValue = {
        value: flow.form_name.value,
        label: flow.form_name.label
      };
      setSelectedFormId(flow.form_name.value);
    }

    if (formValue) {
      addDataForm.setFieldValue('form', formValue);
    }

    // Set next steps if available - convert to action buttons format
    if (currentStep.nexts && currentStep.nexts.length > 0) {
      const nextStepIds = currentStep.nexts.map((next: any) => next.step_id);
      // Convert next steps to action buttons format
      const actionButtons: ActionButton[] = nextStepIds.map((stepId: string) => {
        const step = flow.steps.find((s: Step) => s.step_id === stepId);
        return {
          display_name: step?.name || stepId,
          value: stepId,
          type: 'default' as const,
          step_id: stepId
        };
      });
      addDataForm.setFieldValue('action_buttons', actionButtons);
      
      // If next steps > 2, force WAIT_RESPONSE
      if (nextStepIds.length > 2) {
        setApprovalType('wait_response');
        addDataForm.setFieldValue('approval', 'wait_response');
      }
    } else {
      addDataForm.setFieldValue('action_buttons', []);
    }

    // Load PDF integrations and enabled states from step extra data FIRST
    // This preserves saved data and prevents it from being overwritten
    const savedPdfIntegrations = currentStep.extra?.all_pdf_integrations 
      ? (currentStep.extra.all_pdf_integrations as string[])
      : currentStep.extra?.pdf_integrations 
        ? (currentStep.extra.pdf_integrations as string[])
        : undefined;
    
    const savedEnabledStates = currentStep.extra?.form_integrations as Record<string, boolean> | undefined;
    
    if (savedPdfIntegrations && savedPdfIntegrations.length > 0) {
      setPdfIntegrations(savedPdfIntegrations);
      addDataForm.setFieldValue('pdf_integrations', savedPdfIntegrations);
    }
    
    if (savedEnabledStates) {
      setEnabledIntegrations(savedEnabledStates);
      addDataForm.setFieldValue('form_integrations', savedEnabledStates);
    }

    // Load form data from API ONLY for PDFIntegrationsList component
    // But DO NOT overwrite saved integrations data
    // Only load if we have a form selected
    if (formValue?.value) {
      // If we have saved data, just load form data without overwriting
      // Otherwise, load everything from API
      if (savedPdfIntegrations && savedPdfIntegrations.length > 0) {
        // Load form data but preserve saved integrations
        loadFormDataOnly(formValue.value, savedPdfIntegrations, savedEnabledStates);
      } else {
        // No saved data, load from API
        loadFormIntegrations(formValue.value);
      }
    }

    // Initial validation
    validateForm();
  }, [openDrawer, flow.steps, id, addDataForm, flow.form_name, stepName]);

  // Load form integrations when form changes (only if form actually changed by user)
  // Skip this effect during initial load (when openDrawer is true and we're loading saved data)
  useEffect(() => {
    // Don't run if drawer is not open (initial mount)
    if (!openDrawer) return;
    
    const formValue = addDataForm.getFieldValue('form');
    if (formValue?.value && formValue.value !== selectedFormId) {
      // Only load if this is a user-initiated form change, not initial load
      // Check if we already have saved data for this form
      const currentStep = flow.steps.find((step: any) => step.step_id === id);
      const hasSavedData = currentStep?.extra?.all_pdf_integrations || currentStep?.extra?.pdf_integrations;
      
      setSelectedFormId(formValue.value);
      setFormData(null); // Clear form data while loading
      
      // If we have saved data for this form, preserve it; otherwise load from API
      if (hasSavedData && currentStep?.form_id === formValue.value) {
        // Same form with saved data - just load form data, don't overwrite integrations
        const savedPdfIntegrations = currentStep.extra?.all_pdf_integrations 
          ? (currentStep.extra.all_pdf_integrations as string[])
          : currentStep.extra?.pdf_integrations 
            ? (currentStep.extra.pdf_integrations as string[])
            : undefined;
        const savedEnabledStates = currentStep.extra?.form_integrations as Record<string, boolean> | undefined;
        loadFormDataOnly(formValue.value, savedPdfIntegrations, savedEnabledStates);
      } else {
        // New form or no saved data - load from API
        loadFormIntegrations(formValue.value);
      }
    } else if (!formValue?.value) {
      setPdfIntegrations([]);
      setSelectedFormId(null);
      setFormData(null);
      setEnabledIntegrations({});
      setLoadingIntegrations(false);
    }
  }, [addDataForm.getFieldValue('form'), selectedFormId, openDrawer, flow.steps, id]);

  // Check if approval type should be forced to WAIT_RESPONSE
  useEffect(() => {
    const actionButtons = addDataForm.getFieldValue('action_buttons') || [];
    const nextStepIds = actionButtons
      .filter((btn: ActionButton) => btn.step_id)
      .map((btn: ActionButton) => btn.step_id);
    if (nextStepIds.length > 2 && approvalType !== 'wait_response') {
      setApprovalType('wait_response');
      addDataForm.setFieldValue('approval', 'wait_response');
    }
  }, [addDataForm.getFieldValue('action_buttons')]);

  // Load form data only (for PDFIntegrationsList component) without overwriting saved integrations
  const loadFormDataOnly = async (
    formId: string, 
    savedPdfIntegrations?: string[], 
    savedEnabledStates?: Record<string, boolean>
  ) => {
    setLoadingIntegrations(true);
    try {
      // Fetch form details to get form data for PDFIntegrationsList
      const response = await get({
        url: `/v1/data/form/${formId}`
      });

      if (response?.data?.data) {
        const fetchedFormData = response.data.data;
        setFormData(fetchedFormData);
        
        // DO NOT overwrite saved integrations - only set formData for component
        // The saved integrations are already set in the useEffect above
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  // Load form integrations when form changes (for new form selection)
  const loadFormIntegrations = async (
    formId: string, 
    savedPdfIntegrations?: string[], 
    savedEnabledStates?: Record<string, boolean>
  ) => {
    setLoadingIntegrations(true);
    try {
      // Fetch form details to get PDF integrations
      const response = await get({
        url: `/v1/data/form/${formId}`
      });

      if (response?.data?.data) {
        const fetchedFormData = response.data.data;
        setFormData(fetchedFormData);
        
        // Use saved PDF integrations if available, otherwise use from form data
        if (savedPdfIntegrations && savedPdfIntegrations.length > 0) {
          // Use saved PDF integrations - don't overwrite
          setPdfIntegrations(savedPdfIntegrations);
          addDataForm.setFieldValue('pdf_integrations', savedPdfIntegrations);
          
          // Use saved enabled states - don't overwrite
          if (savedEnabledStates) {
            setEnabledIntegrations(savedEnabledStates);
            addDataForm.setFieldValue('form_integrations', savedEnabledStates);
          }
        } else {
          // No saved data, use form data from API
          const pdfIntegrationIds = fetchedFormData.pdf_integrations || [];
          setPdfIntegrations(pdfIntegrationIds);
          addDataForm.setFieldValue('pdf_integrations', pdfIntegrationIds);

          // Initialize enabled states from saved states or existing, default to true
          // Only update states for PDFs that are in the current list
          const currentEnabledStates: Record<string, boolean> = savedEnabledStates || { ...enabledIntegrations };
          pdfIntegrationIds.forEach((pdfId: string) => {
            if (!(pdfId in currentEnabledStates)) {
              currentEnabledStates[pdfId] = true; // Default to enabled
            }
          });
          // Remove states for PDFs that are no longer in the list
          Object.keys(currentEnabledStates).forEach(pdfId => {
            if (!pdfIntegrationIds.includes(pdfId)) {
              delete currentEnabledStates[pdfId];
            }
          });
          setEnabledIntegrations(currentEnabledStates);
          addDataForm.setFieldValue('form_integrations', currentEnabledStates);
        }
      }
    } catch (error) {
      console.error('Error loading form integrations:', error);
      // Don't clear saved data on error if we have it
      if (!savedPdfIntegrations || savedPdfIntegrations.length === 0) {
        setPdfIntegrations([]);
      }
    } finally {
      setLoadingIntegrations(false);
    }
  };

  // Function to validate form and update button state
  const validateForm = () => {
    try {
      const values = addDataForm.getFieldsValue();
      const hasForm = !!values.form;
      setIsButtonDisabled(!hasForm);
    } catch (error) {
      console.error('Error validating form:', error);
      setIsButtonDisabled(true);
    }
  };

  const checkFormValidity = () => {
    // Check if approval type should be forced
    const actionButtons = addDataForm.getFieldValue('action_buttons') || [];
    const nextStepIds = actionButtons
      .filter((btn: ActionButton) => btn.step_id)
      .map((btn: ActionButton) => btn.step_id);
    if (nextStepIds.length > 2 && approvalType !== 'wait_response') {
      setApprovalType('wait_response');
      addDataForm.setFieldValue('approval', 'wait_response');
    }
    validateForm();
  };

  const toggleEditTitle = () => {
    setIsEditTitle(prev => !prev);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleIntegrationToggle = (pdfId: string, enabled: boolean) => {
    const updatedStates = {
      ...enabledIntegrations,
      [pdfId]: enabled
    };
    setEnabledIntegrations(updatedStates);
    addDataForm.setFieldValue('form_integrations', updatedStates);
  };

  const handlePDFIntegrationsChange = (pdfIds: string[]) => {
    setPdfIntegrations(pdfIds);
    // Update enabled states for new integrations
    const updatedStates: Record<string, boolean> = { ...enabledIntegrations };
    pdfIds.forEach(pdfId => {
      if (!(pdfId in updatedStates)) {
        updatedStates[pdfId] = true; // Default to enabled
      }
    });
    // Remove states for removed integrations
    Object.keys(updatedStates).forEach(pdfId => {
      if (!pdfIds.includes(pdfId)) {
        delete updatedStates[pdfId];
      }
    });
    setEnabledIntegrations(updatedStates);
    addDataForm.setFieldValue('form_integrations', updatedStates);
  };

  const onFinishForm = useCallback(
    (values: any) => {
      // Update flow - this will be saved to database through handleSubmit
      const updatedFlow = { ...flow };
      const stepToUpdate = updatedFlow.steps.find((step: any) => step.step_id === id);
      if (stepToUpdate) {
        // Update step name
        stepToUpdate.name = title;
        
        // Set approval type
        const finalApprovalType = values.approval || approvalType;
        stepToUpdate.approval_type = finalApprovalType.toUpperCase();
        
        // Update form data
        if (values.form) {
          stepToUpdate.form_id = values.form.value;
          stepToUpdate.form_name = values.form.label;
        }

        // Update next steps from action buttons
        if (values.action_buttons && values.action_buttons.length > 0) {
          const nextStepIds = values.action_buttons
            .filter((btn: ActionButton) => btn.step_id)
            .map((btn: ActionButton) => btn.step_id);
          if (nextStepIds.length > 0) {
            stepToUpdate.nexts = nextStepIds.map((stepId: string) => ({
              condition_groups: null,
              step_id: stepId
            }));
          }
        } else {
          // Clear nexts if no action buttons
          stepToUpdate.nexts = [];
        }
        
        // Clear action_buttons for INTEGRATION step type since we use nexts directly
        // This prevents createFlowEdges from skipping edge creation
        stepToUpdate.action_buttons = null;

        // Store integration states in step extra data
        // Only save enabled PDF integrations (selected integrations)
        const enabledPdfIntegrations = pdfIntegrations.filter((pdfId: string) => {
          const integrationStates = values.form_integrations || enabledIntegrations || {};
          return integrationStates[pdfId] !== false; // Only include enabled ones
        });
        
        // Always update extra to ensure data is saved
        stepToUpdate.extra = {
          ...(stepToUpdate.extra || {}),
          form_integrations: values.form_integrations || enabledIntegrations || {},
          pdf_integrations: enabledPdfIntegrations, // Only save enabled integrations
          all_pdf_integrations: pdfIntegrations // Keep all for reference
        };
      }
      setFlow(updatedFlow);

      // Prepare values for submission - include only enabled pdf_integrations
      const integrationStates = values.form_integrations || enabledIntegrations || {};
      const enabledPdfIntegrations = pdfIntegrations.filter((pdfId: string) => {
        return integrationStates[pdfId] !== false; // Only include enabled ones
      });
      
      const submitValues = {
        ...values,
        pdf_integrations: enabledPdfIntegrations, // Only enabled integrations
        all_pdf_integrations: pdfIntegrations, // All for reference
        form_integrations: integrationStates
      };

      // Submit the form - this will call useAddDataDrawer's submitDrawer
      // which will handle the final update and save to database
      handleSubmit(submitValues);
    },
    [flow, id, title, setFlow, handleSubmit, approvalType, pdfIntegrations, enabledIntegrations]
  );

  const handleCancel = () => {
    handleCloseDrawer();
    setIsButtonDisabled(true);
  };

  const handleFormChange = (formValue: any) => {
    addDataForm.setFieldValue('form', formValue);
    if (formValue?.value) {
      // Check if this is the same form with saved data
      const currentStep = flow.steps.find((step: any) => step.step_id === id);
      const isSameForm = currentStep?.form_id === formValue.value;
      const hasSavedData = currentStep?.extra?.all_pdf_integrations || currentStep?.extra?.pdf_integrations;
      
      if (isSameForm && hasSavedData) {
        // Same form with saved data - preserve it
        const savedPdfIntegrations = currentStep.extra?.all_pdf_integrations 
          ? (currentStep.extra.all_pdf_integrations as string[])
          : currentStep.extra?.pdf_integrations 
            ? (currentStep.extra.pdf_integrations as string[])
            : undefined;
        const savedEnabledStates = currentStep.extra?.form_integrations as Record<string, boolean> | undefined;
        loadFormDataOnly(formValue.value, savedPdfIntegrations, savedEnabledStates);
      } else {
        // New form or no saved data - load from API
        loadFormIntegrations(formValue.value);
      }
    } else {
      setPdfIntegrations([]);
      setSelectedFormId(null);
      setFormData(null);
      setEnabledIntegrations({});
    }
    validateForm();
  };

  const handleApprovalTypeChange = (value: string) => {
    const actionButtons = addDataForm.getFieldValue('action_buttons') || [];
    const nextStepIds = actionButtons
      .filter((btn: ActionButton) => btn.step_id)
      .map((btn: ActionButton) => btn.step_id);
    // If next steps > 2, force WAIT_RESPONSE
    if (nextStepIds.length > 2) {
      setApprovalType('wait_response');
      addDataForm.setFieldValue('approval', 'wait_response');
    } else {
      setApprovalType(value);
      addDataForm.setFieldValue('approval', value);
    }
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
        onClick={e => e.stopPropagation()}
      >
        {/* Approval Type */}
        <Form.Item 
          label={t(`${tPageFieldBaseKey}.fields.approval`)} 
          name='approval'
          rules={[{ required: true, message: t(`${tPageFieldBaseKey}.fields.approvalRequired`) }]}
        >
          <Radio.Group 
            onChange={e => handleApprovalTypeChange(e.target.value)}
            value={approvalType}
          >
            <Radio.Button value='auto_approve'>
              {t(`${tPageFieldBaseKey}.fields.autoApprove`)}
            </Radio.Button>
            <Radio.Button value='wait_response'>
              {t(`${tPageFieldBaseKey}.fields.waitResponse`)}
            </Radio.Button>
          </Radio.Group>
          {(() => {
            const actionButtons = addDataForm.getFieldValue('action_buttons') || [];
            const nextStepIds = actionButtons
              .filter((btn: ActionButton) => btn.step_id)
              .map((btn: ActionButton) => btn.step_id);
            return nextStepIds.length > 2 && (
              <Text type='secondary' style={{ display: 'block', marginTop: 4 }}>
                {t(`${tPageFieldBaseKey}.fields.waitResponseRequiredNote`)}
              </Text>
            );
          })()}
        </Form.Item>

        {/* Next Steps Selection using ActionButtonsField */}
        <Form.Item
          label={t(`${tPageFieldBaseKey}.fields.nextSteps`)}
          name='action_buttons'
          rules={[
            {
              required: true,
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error(t(`${tPageFieldBaseKey}.fields.nextStepsRequired`)));
                }
                const hasStepId = value.some((btn: ActionButton) => btn.step_id);
                if (!hasStepId) {
                  return Promise.reject(new Error(t(`${tPageFieldBaseKey}.fields.nextStepsRequired`)));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <ActionButtonsField
            currentStepId={id}
            onChange={(actionButtons) => {
              const nextStepIds = actionButtons
                .filter((btn: ActionButton) => btn.step_id)
                .map((btn: ActionButton) => btn.step_id);
              // If more than 2 next steps selected, force WAIT_RESPONSE
              if (nextStepIds.length > 2 && approvalType !== 'wait_response') {
                setApprovalType('wait_response');
                addDataForm.setFieldValue('approval', 'wait_response');
              }
            }}
          />
        </Form.Item>

        {/* Form Selection */}
        <Form.Item
          label={t(`${tPageFieldBaseKey}.fields.form`)}
          name='form'
          rules={[{ required: true, message: t(`${tPageFieldBaseKey}.fields.formRequired`) }]}
        >
          <CustomFormSelect
            currentStep={flow.steps.find((step: any) => step.step_id === id)}
            onPermissionChange={permissions => {
              const updatedFlow = { ...flow };
              const stepToUpdate = updatedFlow.steps.find((step: any) => step.step_id === id);
              if (stepToUpdate) {
                stepToUpdate.form_data_permissions = permissions;
              }
              setFlow(updatedFlow);
            }}
            value={addDataForm.getFieldValue('form')}
            onChange={handleFormChange}
          />
        </Form.Item>

        {/* PDF Integrations List */}
        {selectedFormId && (
          <Form.Item
            label={t(`${tPageFieldBaseKey}.fields.formIntegrations`)}
            name='form_integrations'
          >
            {loadingIntegrations ? (
              <Flex justify="center" align="center" style={{ padding: '40px 0' }}>
                <Spin size="large" />
              </Flex>
            ) : formData ? (
              <PDFIntegrationsContainer>
                <PDFIntegrationsList
                  pdfIntegrations={pdfIntegrations}
                  onPDFIntegrationsChange={handlePDFIntegrationsChange}
                  formData={formData}
                  formValues={{}}
                  showActions={false}
                  showEnableSwitch={true}
                  onIntegrationToggle={handleIntegrationToggle}
                  enabledIntegrations={enabledIntegrations}
                  readOnly={true}
                />
              </PDFIntegrationsContainer>
            ) : (
              <Text type='secondary'>{t(`${tPageFieldBaseKey}.fields.loadingIntegrations`)}</Text>
            )}
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
};
