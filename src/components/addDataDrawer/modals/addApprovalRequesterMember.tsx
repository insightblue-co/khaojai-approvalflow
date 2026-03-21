import { getApprovalFlowAdapters } from '../../../adapters';
import { BaseRecord } from '@refinedev/core';
import { Modal, Pagination, Table } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';
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

export const AddApprovalRequesterMemberModal: React.FC<ApprovalRequesterModalProps> = ({
  open,
  handleOk,
  handleCancel,
  value
}) => {
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';
  const { AutoRenderFilterV2, CustomTable, useFilterTableV2 } = getApprovalFlowAdapters();

  const [count, setCount] = useState(0);
  const [updatedValue, setUpdatedValue] = useState<ApprovalItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    setUpdatedValue(value);
    setSelectedRowKeys(value.map(item => Number(item.id)));
    setCount(value?.length || 0);
  }, [open]);

  const { tableProps, filterProps, setCurrent, setPageSize, tableQueryResult } = useFilterTableV2({
    resource: 'user-workspaces',
    simples: [
      {
        fields: 'record_name',
        nameShow: t(`${tPageFieldBaseKey}.fields.member`),
        operator: 'contains',
        multipleInput: true
      }
    ],
    initialPageSize: 20
  });

  const handleChagePagination: PaginationProps['onChange'] = (page, pageSize) => {
    setCurrent(page);
    setPageSize(pageSize);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[], selectedRows: BaseRecord[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    const valueWithLabels = selectedRows.map(row => {
      return { id: Number(row.user_id), display_name: row.record_name as string };
    });

    setCount(valueWithLabels.length);
    setUpdatedValue(valueWithLabels);
  };

  const rowSelection: TableRowSelection<BaseRecord> = {
    selectedRowKeys,
    onChange: onSelectChange
  };

  return (
    <Modal
      width={1000}
      open={open}
      title={t(`${tPageFieldBaseKey}.label.selectApprovalRequesterFromUser`, {
        count: count
      })}
      onOk={() => handleOk('users', updatedValue)}
      onCancel={handleCancel}
      closable={false}
    >
      <div style={{ padding: '16px 0px' }}>
        <AutoRenderFilterV2 {...filterProps} {...tableQueryResult} defaultButton={false} />

        <CustomTable
          rowSelection={rowSelection}
          size='small'
          {...(tableProps as any)}
          rowKey='user_id'
          pagination={false}
        >
          <Table.Column
            key='record_name'
            dataIndex='record_name'
            title={t(`${tPageFieldBaseKey}.fields.user`) as string}
          />
          <Table.Column
            key='workspace_name'
            dataIndex='workspace'
            title={t(`${tPageFieldBaseKey}.fields.department`) as string}
            render={workspace => workspace.name}
          />
          <Table.Column
            title={t(`${tPageFieldBaseKey}.fields.phone`) as string}
            dataIndex='user'
            render={user => user.mobile}
          />
        </CustomTable>
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
