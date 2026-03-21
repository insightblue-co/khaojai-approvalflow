import { getApprovalFlowAdapters } from '../../../adapters';
import { BaseKey } from '@refinedev/core';
import { Modal, TreeDataNode } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApprovalItem, ApprovalRequesterModalProps } from '../../interface';

export const AddApprovalRequesterDepartmentModal: React.FC<ApprovalRequesterModalProps> = ({
  open,
  handleOk,
  handleCancel,
  value
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { SelectDepartmentComponent } = getApprovalFlowAdapters();

  const [count, setCount] = useState(0);
  const [updatedValue, setUpdatedValue] = useState<ApprovalItem[]>([]);
  const [treeValue, setTreeValue] = useState<TreeDataNode[]>([]);

  useEffect(() => {
    const updatedTreeValue = value?.map(val => {
      return { key: Number(val.id), title: val.display_name };
    });
    setTreeValue(updatedTreeValue);
    setCount(value?.length || 0);
  }, [open]);

  const onChange = (checkedValues: TreeDataNode[]) => {
    const valueWithLabels = checkedValues.map(val => {
      return { id: Number(val.key), display_name: val.title?.toString() || '' };
    });

    setCount(checkedValues.length);
    setUpdatedValue(valueWithLabels);
    setTreeValue(checkedValues);
  };

  return (
    <Modal
      width={1000}
      open={open}
      title={t(`${tPageFieldBaseKey}.label.selectApprovalRequesterFromDepartment`, {
        count: count
      })}
      onOk={() => handleOk('departments', updatedValue)}
      onCancel={handleCancel}
      closable={false}
    >
      <div style={{ padding: '16px 0px' }}>
        <SelectDepartmentComponent onChange={onChange} selectedValue={treeValue} />
      </div>
    </Modal>
  );
};
