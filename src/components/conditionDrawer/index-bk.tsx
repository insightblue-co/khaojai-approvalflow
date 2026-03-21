import React, { useState } from 'react';
import { Drawer, Typography, Form, Space, Button, Select, Divider, Input, Dropdown, Flex } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components';
import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import * as SolarIconSet from 'solar-icon-set';
import styled from 'styled-components';

interface ConditionDrawerProps {
  open: boolean;
  onClose: () => void;
  stepId: string;
  level: string;
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

const ConditionGroupCard = styled.div`
  border: 1px solid ${props => props.theme.colors.neutral_08};
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ConditionGroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background-color: ${props => props.theme.colors.neutral_11};
`;

const ConditionGroupContent = styled.div`
  padding: 8px 16px;
`;

const AddConditionButton = styled.div`
  color: ${props => props.theme.colors.primary_02};
  display: flex;
  align-items: center;
  border: none;
  cursor: pointer;
`;

const AddConditionGroupButton = styled(Button)`
  border: 1px dashed ${props => props.theme.colors.primary_02};
  color: ${props => props.theme.colors.primary_02};
  background: transparent;
  width: 100%;
  margin-top: 16px;
  height: 40px;

  &:hover {
    border-color: ${props => props.theme.colors.primary_01};
    color: ${props => props.theme.colors.primary_01};
  }
`;

const ConditionRow = styled(Flex)`
  margin-bottom: 12px;
`;

const ConditionDrawer: React.FC<ConditionDrawerProps> = ({ open, onClose, stepId, level }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation('approval-setting');
  const theme = useTheme();
  const { flow } = useApprovalFlowContext();
  const [selectedPriority, setSelectedPriority] = useState('Priority1');
  const tPageFieldBaseKey = 'approveBoxFlow';

  const handleSubmit = () => {
    form.validateFields().then(values => {
      console.log('Condition values:', values);
      // Implement the logic to save the condition
      onClose();
    });
  };

  // Find the step in the flow
  const currentStep = flow.steps.find(step => step.step_id === stepId);

  const titleWithEditIcon = (
    <Flex align='center' gap={8} vertical={false} justify='space-between'>
      <Flex align='center' gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {t(`${tPageFieldBaseKey}.fields.conditionalBranch`)} {level}
        </Typography.Title>
        <SolarIconSet.Pen2 color={theme.colors.primary_02} size={18} iconStyle='Outline' />
      </Flex>
      <Dropdown
        menu={{
          items: [
            { key: '1', label: 'Priority1' },
            { key: '2', label: 'Priority2' }
          ]
          // onClick: ({ key }) => setSelectedPriority(key === '1' ? 'Priority1' : 'Priority2')
        }}
        trigger={['click']}
      >
        <Button>
          {selectedPriority} <SolarIconSet.AltArrowDown size={16} iconStyle='Outline' />
        </Button>
      </Dropdown>
    </Flex>
  );

  return (
    <StyledDrawer
      title={titleWithEditIcon}
      placement='right'
      width={640}
      onClose={onClose}
      open={open}
      closable={false}
      footer={
        <Flex justify='end' align='center' gap={16}>
          <Button onClick={onClose}>{t(`${tPageFieldBaseKey}.actions.cancel`)}</Button>
          <Button type='primary' onClick={handleSubmit}>
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

        <Form form={form} layout='vertical'>
          <ConditionGroupCard>
            <ConditionGroupHeader>
              <Typography.Text strong>{t(`${tPageFieldBaseKey}.fields.conditionGroup`)}</Typography.Text>
              <Button
                type='text'
                icon={<SolarIconSet.TrashBinTrash size={24} iconStyle='Outline' color={theme.colors.neutral_04} />}
                onClick={() => {
                  console.log('delete');
                }}
              />
            </ConditionGroupHeader>
            <ConditionGroupContent>
              <Typography.Text type='secondary' style={{ display: 'block', marginBottom: '8px' }}>
                {t(`${tPageFieldBaseKey}.fields.when`)}
              </Typography.Text>

              <ConditionRow gap={8} vertical>
                <Form.Item style={{ marginBottom: 4 }}>
                  <Select defaultValue='requester' style={{ width: '100%' }}>
                    <Select.Option value='requester'>{t(`${tPageFieldBaseKey}.fields.requester`)}</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item style={{ marginBottom: 4 }}>
                  <Select defaultValue='belongs_to' style={{ width: '100%' }}>
                    <Select.Option value='belongs_to'>{t(`${tPageFieldBaseKey}.fields.belongsTo`)}</Select.Option>
                  </Select>
                </Form.Item>
              </ConditionRow>

              <ConditionRow>
                <Form.Item style={{ marginBottom: 0, flex: 1 }}>
                  <Select placeholder='Select department/supervisor/department supervisor' style={{ width: '100%' }} />
                </Form.Item>
              </ConditionRow>

              <Flex align='center' gap={8} style={{ color: theme.colors.primary_02, cursor: 'pointer', width: 140 }}>
                <div style={{ fontSize: 24 }}>+</div>
                <div style={{ paddingTop: 4 }}>{t(`${tPageFieldBaseKey}.actions.addCondition`)}</div>
              </Flex>
            </ConditionGroupContent>
          </ConditionGroupCard>

          <AddConditionGroupButton icon={<SolarIconSet.AddCircle size={16} iconStyle='Outline' />}>
            {t(`${tPageFieldBaseKey}.actions.addConditionGroup`)}
          </AddConditionGroupButton>
        </Form>
      </div>
    </StyledDrawer>
  );
};

export default ConditionDrawer;
