import { getApprovalFlowAdapters } from '../../../adapters';
import { Checkbox, Flex, Modal, Pagination } from 'antd';
import { PaginationProps } from 'antd/lib';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ApprovalItem, ApprovalRequesterModalProps } from '../../interface';

const CustomPagination = styled(Pagination)`
  z-index: 1;
  padding: 8px 16px;
  width: 100%;
  background-color: ${props => props.theme.colors.neutral_12};

  .ant-pagination-item,
  .ant-pagination-prev,
  .ant-pagination-next {
    border-radius: 0px;
    border: 1px solid ${props => props.theme.colors.neutral_08};
  }
  .ant-pagination-item-active {
    border: 1px solid ${props => props.theme.colors.primary_02};
  }
`;

export const AddApprovalRequesterRoleModal: React.FC<ApprovalRequesterModalProps> = ({
  open,
  handleOk,
  handleCancel,
  value
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { AutoRenderFilterV2, useFilterTableV2 } = getApprovalFlowAdapters();

  const [count, setCount] = useState(0);
  const [updatedValue, setUpdatedValue] = useState<ApprovalItem[]>([]);

  useEffect(() => {
    setUpdatedValue(value);
    setCount(value?.length || 0);
  }, [open]);

  const { filterProps, setCurrent, setPageSize, tableQueryResult } = useFilterTableV2({
    resource: 'workspace-role',
    simples: [
      {
        fields: 'name',
        nameShow: t(`${tPageFieldBaseKey}.fields.role`),
        operator: 'contains',
        multipleInput: true
      }
    ],
    initialPageSize: 20
  });

  const renderRole = (role: any) => {
    return (
      <Checkbox key={role.id} value={role.id}>
        {role.name}
      </Checkbox>
    );
  };

  const onChange = (checkedValues: number[]) => {
    const valueWithLabels = checkedValues.map(val => {
      const checkbox = tableQueryResult.data?.data.find((option: { id: number; name?: string }) => option.id === val);
      return { id: val, display_name: checkbox?.name as string };
    });

    setCount(valueWithLabels.length);
    setUpdatedValue(valueWithLabels);
  };

  const handleChagePagination: PaginationProps['onChange'] = (page, pageSize) => {
    setCurrent(page);
    setPageSize(pageSize);
  };

  return (
    <Modal
      width={1000}
      open={open}
      title={t(`${tPageFieldBaseKey}.label.selectApprovalRequesterFromRole`, {
        count: count
      })}
      onOk={() => handleOk('roles', updatedValue)}
      onCancel={handleCancel}
      closable={false}
    >
      <div style={{ padding: '16px 0px' }}>
        <AutoRenderFilterV2 {...filterProps} {...tableQueryResult} defaultButton={false} />

        <Checkbox.Group onChange={onChange} value={updatedValue?.map(val => val.id)}>
          <Flex vertical gap={8} style={{ padding: '16px 16px 0px 16px' }}>
            {tableQueryResult.data?.data.map((role: { id: number; name: string }) => renderRole(role))}
          </Flex>
        </Checkbox.Group>
      </div>
      <CustomPagination
        align='end'
        total={tableQueryResult.data?.total}
        showSizeChanger
        showQuickJumper
        defaultPageSize={20}
        onChange={handleChagePagination}
      />
    </Modal>
  );
};
