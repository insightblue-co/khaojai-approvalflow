import { useApprovalFlowContext } from '../../context/ApprovalFlowContext';
import { Typography } from 'antd';
import { Flex } from 'antd/lib';
import { useTranslation } from 'react-i18next';
import { ApprovalItemHeaderProps } from '../interface';
import { getImagePathByHeaderType } from './function';
import { useTheme } from 'styled-components';

export const ApproveBoxItemHeader = (props: ApprovalItemHeaderProps) => {
  const { flow } = useApprovalFlowContext();
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { id } = props;
  const currentStep = flow.steps.find((step: any) => step.step_id === id);
  const theme = useTheme();

  const imagePath = getImagePathByHeaderType(props.headerType);

  return (
    <Flex
      style={{
        padding: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center'
      }}
    >
      {/* Native img: works with bundled SVG data URLs; antd Image can fail on some data: sources */}
      <img
        src={imagePath}
        alt=""
        width={32}
        height={32}
        style={{ paddingRight: 10, flexShrink: 0, display: 'block' }}
      />
      <Flex vertical={true}>
        <Typography.Title
          level={5}
          style={{
            paddingTop: 4
          }}
        >
          {t(`${tPageFieldBaseKey}.fields.${currentStep?.name}`, currentStep?.name)}
        </Typography.Title>
        <div style={{ color: theme.colors.neutral_04 }}>{`${currentStep?.step_id}`}</div>
      </Flex>
      {/* {!props.isFirstNode && <Button icon={<DeleteOutlined />} />} */}
    </Flex>
  );
};
