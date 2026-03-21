import { Modal, Radio, RadioChangeEvent } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApprovalItem, ApprovalRequesterModalProps } from '../../interface';

export const AddApprovalRequesterDepartmentSupervisorModal: React.FC<ApprovalRequesterModalProps> = ({
  open,
  handleOk,
  handleCancel,
  value
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';

  const [updatedValue, setUpdatedValue] = useState<ApprovalItem[]>([]);

  useEffect(() => {
    setUpdatedValue(value);
  }, [open]);

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  };

  const options = [
    { value: 1, label: t(`${tPageFieldBaseKey}.fields.departmentManager`) },
    { value: 2, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 1' }) },
    { value: 3, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 2' }) },
    { value: 4, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 3' }) },
    { value: 5, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 4' }) },
    { value: 6, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 5' }) },
    { value: 7, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 6' }) },
    { value: 8, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 7' }) },
    { value: 9, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 8' }) },
    { value: 10, label: t(`${tPageFieldBaseKey}.fields.aboveDepartmentManager`, { level: '+ 9' }) }
  ];

  const onChange = (e: RadioChangeEvent) => {
    const selectedOption = options.find(option => option.value === e.target.value);
    const valueWithLabels = [{ id: Number(selectedOption?.value || ''), display_name: selectedOption?.label || '' }];
    setUpdatedValue(valueWithLabels);
  };

  return (
    <Modal
      width={1000}
      open={open}
      title={t(`${tPageFieldBaseKey}.label.selectApprovalRequesterFromDepartmentSupervisor`)}
      onOk={() => handleOk('supervisor_department', updatedValue)}
      onCancel={handleCancel}
      closable={false}
    >
      <div style={{ padding: '16px 0px' }}>
        <Radio.Group value={updatedValue?.[0]?.id} style={style} onChange={onChange} options={options}></Radio.Group>
      </div>
    </Modal>
  );
};
