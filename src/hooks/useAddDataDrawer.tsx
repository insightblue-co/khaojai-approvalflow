import { useApprovalFlowContext } from '../context/ApprovalFlowContext';
import { Form } from 'antd';
import { useState } from 'react';

/**
 * Custom hook to manage AddDataDrawer functionality
 * @param stepId - ID of the flow step
 * @param label - Label of the step
 */
export const useAddDataDrawer = (stepId: string, type: string) => {
  const [addDataForm] = Form.useForm();
  const [openAddDataDrawer, setOpenAddDataDrawer] = useState(false);
  const { flow, setFlow } = useApprovalFlowContext();

  const openDrawer = () => {
    setOpenAddDataDrawer(true);

    const currentStep = flow.steps.find((step: any) => step.step_id === stepId);

    if (currentStep) {
      const initialValues: any = {};

      // Set approvers if available
      if (currentStep.approvers && currentStep.approvers.length > 0) {
        for (let i = 0; i < currentStep.approvers.length; i++) {
          const level = `rules${i + 1}`;
          initialValues[level] = currentStep.approvers[i];
        }
      }

      // Set ccs if available
      if (currentStep.ccs && currentStep.ccs.length > 0) {
        for (let i = 0; i < currentStep.ccs.length; i++) {
          const level = `rules${i + 1}`;
          initialValues[level] = currentStep.ccs[i];
        }
      }

      // Set submitter rules if this is the first step and submitter rules exist
      if (type === 'submit' && flow.submitter_rules) {
        if (flow.submitter_rules.condition) {
          initialValues.approval_qualification = flow.submitter_rules.condition;
        }
        if (flow.submitter_rules.rules) {
          initialValues.rules = flow.submitter_rules.rules;
        }
      }

      // Set form data - prioritize individual step form over global form
      if (currentStep.form_id && currentStep.form_name) {
        // Use individual step's form data
        initialValues.form = {
          value: currentStep.form_id,
          label: currentStep.form_name
        };
      } else if (flow.form_name?.label && flow.form_name?.value) {
        // Fallback to global form data
        initialValues.form = {
          value: flow.form_name.value,
          label: flow.form_name.label
        };
      }

      // Set approve_require
      if (currentStep.approve_require) {
        initialValues.approve_require = currentStep.approve_require;
      }

      // Set action_buttons
      if (currentStep.action_buttons) {
        initialValues.action_buttons = currentStep.action_buttons;
      }

      // Set the form values
      addDataForm.setFieldsValue(initialValues);
    }
  };

  const closeDrawer = () => {
    addDataForm.resetFields();
    setOpenAddDataDrawer(false);
  };

  const submitDrawer = (values: any) => {
    // Create a deep copy of the flow to avoid direct mutation
    const updatedFlow = { ...flow };
    updatedFlow.steps = [...flow.steps];
    
    const currentStep = updatedFlow.steps.find((step: any) => step.step_id === stepId);
    
    if (type === 'submit') {
      // Update submitter rules
      updatedFlow.submitter_rules = {
        ...updatedFlow.submitter_rules,
        rules: values.rules,
        condition: values.approval_qualification
      };
      
      // Update form information for submit step
      if (values.form && currentStep) {
        const updatedStep = { ...currentStep };
        updatedStep.form_id = values.form.value;
        updatedStep.form_name = values.form.label;
        updatedStep.step_type = 'SUBMIT';
        
        // Update action_buttons if provided
        if (values.action_buttons) {
          updatedStep.action_buttons = values.action_buttons;
          // Generate nexts based on action buttons
          updatedStep.nexts = generateNextsFromActionButtons(values.action_buttons, currentStep?.nexts);
        }
        
        // Update global form_name for submit step
        updatedFlow.form_name = {
          label: values.form.label,
          value: values.form.value
        };
        
        // Update the step in the array
        const stepIndex = updatedFlow.steps.findIndex((step: any) => step.step_id === stepId);
        if (stepIndex !== -1) {
          updatedFlow.steps[stepIndex] = updatedStep;
        }
      } else if (currentStep) {
        // Create a copy of the current step to avoid mutation
        const updatedStep = { ...currentStep };
        updatedStep.step_type = 'SUBMIT';
        
        // Update action_buttons if provided
        if (values.action_buttons) {
          updatedStep.action_buttons = values.action_buttons;
          // Generate nexts based on action buttons
          updatedStep.nexts = generateNextsFromActionButtons(values.action_buttons, currentStep?.nexts);
        }
        
        // Update the step in the array
        const stepIndex = updatedFlow.steps.findIndex((step: any) => step.step_id === stepId);
        if (stepIndex !== -1) {
          updatedFlow.steps[stepIndex] = updatedStep;
        }
      }
    } else {
      if (currentStep) {
        // Create a copy of the current step to avoid mutation
        const updatedStep = { ...currentStep };
        
        if (type === 'check' || type === 'approved') {
          updatedStep.approvers = values.rules;
          updatedStep.step_type = 'APPROVE';
        } else if (type === 'approve') {
          updatedStep.ccs = values.rules;
          updatedStep.step_type = 'CC';
        } else if (type === 'revise') {
          updatedStep.approvers = values.rules;
          updatedStep.step_type = 'REVISE';
        } else if (type === 'end') {
          updatedStep.step_type = 'END';
        } else if (type === 'integration') {
          updatedStep.step_type = 'INTEGRATION';
          // Integration steps don't have approvers/ccs
          // Update approval type
          if (values.approval) {
            updatedStep.approval_type = values.approval.toUpperCase();
          }
          // Update next steps from action_buttons (integration drawer uses action_buttons)
          if (values.action_buttons && values.action_buttons.length > 0) {
            const nextStepIds = values.action_buttons
              .filter((btn: any) => btn.step_id)
              .map((btn: any) => btn.step_id);
            if (nextStepIds.length > 0) {
              updatedStep.nexts = nextStepIds.map((stepId: string) => ({
                condition_groups: null,
                step_id: stepId
              }));
            }
          } else if (values.next_steps && values.next_steps.length > 0) {
            // Fallback to next_steps if action_buttons not available
            updatedStep.nexts = values.next_steps.map((stepId: string) => ({
              condition_groups: null,
              step_id: stepId
            }));
          }
          // Clear action_buttons for INTEGRATION step type since we use nexts directly
          // This prevents createFlowEdges from skipping edge creation
          updatedStep.action_buttons = null;
          // Store integration data in extra
          // Only save enabled PDF integrations (selected integrations for integration)
          // Always update extra to ensure data is saved even if form_integrations is empty
          updatedStep.extra = {
            ...(updatedStep.extra || {}),
            form_integrations: values.form_integrations || {},
            pdf_integrations: values.pdf_integrations || [], // Only enabled integrations
            all_pdf_integrations: values.all_pdf_integrations || [] // All for reference
          };
        }

        // Update form information if form is selected
        if (values.form) {
          updatedStep.form_id = values.form.value;
          updatedStep.form_name = values.form.label;
          
          // Do NOT update global form_name for non-submit steps
          // Each step maintains its own form selection independently
        }
        
        updatedStep.approve_require = values.approve_require;
        
        // Update action_buttons if provided (skip for integration type)
        if (values.action_buttons && type !== 'integration') {
          updatedStep.action_buttons = values.action_buttons;
          // Generate nexts based on action buttons
          updatedStep.nexts = generateNextsFromActionButtons(values.action_buttons, currentStep?.nexts);
        }
        
        // Update the step in the array
        const stepIndex = updatedFlow.steps.findIndex((step: any) => step.step_id === stepId);
        if (stepIndex !== -1) {
          updatedFlow.steps[stepIndex] = updatedStep;
        }
      }
    }

    // Set the updated flow - this will trigger React re-render
    setFlow(updatedFlow);
    setOpenAddDataDrawer(false);
  };

  // Helper function to generate nexts from action buttons
  const generateNextsFromActionButtons = (actionButtons: any[], existingNexts: any[] = []) => {
    if (!actionButtons || actionButtons.length === 0) {
      return existingNexts;
    }

    const newNexts: any[] = [];
    const stepConditionsMap = new Map<string, any[]>(); // Map to group conditions by step_id

    // Group action buttons by their target step_id
    actionButtons.forEach(button => {
      if (button.step_id && button.value) {
        const condition = {
          field: "request.step.action",
          operator: "EQUAL",
          value: button.value,
          value_field: ""
        };
        
        if (!stepConditionsMap.has(button.step_id)) {
          stepConditionsMap.set(button.step_id, []);
        }
        stepConditionsMap.get(button.step_id)!.push(condition);
      }
    });

    // Create nexts with grouped conditions
    stepConditionsMap.forEach((conditions, stepId) => {
      const nextItem = {
        condition_groups: [
          {
            conditions: conditions
          }
        ],
        step_id: stepId
      };
      newNexts.push(nextItem);
    });

    // Add existing nexts that don't have action button conditions
    existingNexts.forEach(next => {
      const hasActionCondition = next.condition_groups?.some((group: any) =>
        group.conditions?.some((condition: any) => 
          condition.field === "request.step.action"
        )
      );
      
      if (!hasActionCondition) {
        newNexts.push(next);
      }
    });
    return newNexts;
  };

  return {
    addDataForm,
    openAddDataDrawer,
    openDrawer,
    closeDrawer,
    submitDrawer
  };
};
