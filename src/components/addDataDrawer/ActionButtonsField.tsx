import React from 'react';
import { Input, Button, Select, Card, Row, Col, Space, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ActionButton, Step } from '../interface';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';

const { Text } = Typography;

const ActionButtonsContainer = styled.div`
  margin-bottom: 16px;
`;

const ActionButtonItem = styled(Card)`
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;

  .ant-card-body {
    padding: 16px;
  }
`;

const FieldLabel = styled(Text)`
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
`;

const AddButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

interface ActionButtonsFieldProps {
  value?: ActionButton[];
  onChange?: (value: ActionButton[]) => void;
  disabled?: boolean;
  currentStepId?: string; // Current step ID to exclude from dropdown
}

export const ActionButtonsField: React.FC<ActionButtonsFieldProps> = ({
  value = [],
  onChange,
  disabled = false,
  currentStepId
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { flow } = useApprovalFlowContext();

  // Get available steps for dropdown (exclude current step)
  const availableSteps = flow.steps.filter(
    step =>
      step.step_id !== currentStepId &&
      step.step_type !== 'SUBMIT' &&
      step.step_type !== 'ADD_CONDITION' &&
      step.step_type !== 'CONDITIONAL'
  );

  const handleAdd = () => {
    const newActionButtons = [...value, { display_name: '', value: '', type: 'default' as const, step_id: '' }];
    onChange?.(newActionButtons);
  };

  const handleRemove = (index: number) => {
    const newActionButtons = value.filter((_, i) => i !== index);
    onChange?.(newActionButtons);
  };

  const handleChange = (index: number, field: keyof ActionButton, fieldValue: string) => {
    const newActionButtons = [...value];
    newActionButtons[index] = {
      ...newActionButtons[index],
      [field]: fieldValue
    };
    onChange?.(newActionButtons);
  };

  const renderActionButtonItem = (button: ActionButton, index: number) => (
    <ActionButtonItem key={index} size='small'>
      <Row gutter={16} align='middle'>
        <Col span={8}>
          <FieldLabel>{t(`${tPageFieldBaseKey}.fields.displayName`)}</FieldLabel>
          <Input
            placeholder={t(`${tPageFieldBaseKey}.placeholder.displayName`)}
            value={button.display_name}
            onChange={e => handleChange(index, 'display_name', e.target.value)}
            disabled={disabled}
          />
        </Col>
        <Col span={8}>
          <FieldLabel>{t(`${tPageFieldBaseKey}.fields.value`)}</FieldLabel>
          <Select
            value={button.value || 'submit'}
            onChange={value => handleChange(index, 'value', value)}
            disabled={disabled}
            style={{ width: '100%' }}
            options={[
              { value: 'reject', label: t(`${tPageFieldBaseKey}.buttonValues.reject`) },
              { value: 'revise', label: t(`${tPageFieldBaseKey}.buttonValues.revise`) },
              { value: 'submit', label: t(`${tPageFieldBaseKey}.buttonValues.submit`) },
              { value: 'approve', label: t(`${tPageFieldBaseKey}.buttonValues.approve`) }
            ]}
          />
        </Col>
        <Col span={6}>
          <FieldLabel>{t(`${tPageFieldBaseKey}.fields.buttonType`)}</FieldLabel>
          <Select
            value={button.type || 'default'}
            onChange={value => handleChange(index, 'type', value)}
            disabled={disabled}
            style={{ width: '100%' }}
            options={[
              { value: 'default', label: t(`${tPageFieldBaseKey}.buttonTypes.default`) },
              { value: 'primary', label: t(`${tPageFieldBaseKey}.buttonTypes.primary`) },
              { value: 'danger', label: t(`${tPageFieldBaseKey}.buttonTypes.danger`) },
              { value: 'warning', label: t(`${tPageFieldBaseKey}.buttonTypes.warning`) }
            ]}
          />
        </Col>
        <Col span={2}>
          <div style={{ textAlign: 'center' }}>
            <Button
              type='text'
              icon={<MinusCircleOutlined />}
              onClick={() => handleRemove(index)}
              danger
              disabled={disabled}
              title={t(`${tPageFieldBaseKey}.actions.removeActionButton`)}
            />
          </div>
        </Col>
        <Col span={24}>
          <FieldLabel>{t(`${tPageFieldBaseKey}.fields.nextStep`)}</FieldLabel>
          <Select
            placeholder={t(`${tPageFieldBaseKey}.placeholder.selectStep`)}
            value={button.step_id || undefined}
            onChange={value => handleChange(index, 'step_id', value)}
            disabled={disabled}
            style={{ width: '100%' }}
            allowClear
            options={availableSteps.map(step => ({
              value: step.step_id,
              label: step.name + ' (' + step.step_id + ')'
            }))}
          />
        </Col>
      </Row>
    </ActionButtonItem>
  );

  return (
    <ActionButtonsContainer>
      {value.length > 0 && <div>{value.map((button, index) => renderActionButtonItem(button, index))}</div>}

      {!disabled && (
        <AddButtonContainer>
          <Button type='dashed' onClick={handleAdd} icon={<PlusOutlined />} style={{ width: '100%' }}>
            {t(`${tPageFieldBaseKey}.actions.addActionButton`)}
          </Button>
        </AddButtonContainer>
      )}
    </ActionButtonsContainer>
  );
};
