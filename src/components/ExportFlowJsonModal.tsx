import React, { useMemo } from 'react';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ApprovalFlowData } from './interface';
import { exportApprovalFlowJson } from '../exportApprovalFlowJson';

const { Text } = Typography;

export type ExportFlowJsonModalProps = {
  open: boolean;
  onCancel: () => void;
  flow: ApprovalFlowData;
  fileName?: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'approval-flow';
}

export const ExportFlowJsonModal: React.FC<ExportFlowJsonModalProps> = ({ open, onCancel, flow, fileName }) => {
  const { t } = useTranslation('approval-setting');

  const jsonText = useMemo(() => exportApprovalFlowJson(flow), [flow]);
  const downloadName = `${sanitizeFileName(fileName || flow.name || 'approval-flow')}.json`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      message.success(t('_approvalGroup.actions.exportFlowCopySuccess', { defaultValue: 'JSON copied to clipboard' }));
    } catch {
      message.error(t('_approvalGroup.actions.exportFlowCopyFailed', { defaultValue: 'Unable to copy JSON' }));
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('_approvalGroup.actions.exportFlowDownloadSuccess', { defaultValue: 'JSON downloaded' }));
  };

  return (
    <Modal
      open={open}
      title={t('_approvalGroup.actions.exportFlowJson', { defaultValue: 'Export flow as JSON' })}
      onCancel={onCancel}
      width={720}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onCancel}>{t('_approvalGroup.actions.close', { defaultValue: 'Close' })}</Button>
          <Button onClick={handleCopy}>{t('_approvalGroup.actions.copyJson', { defaultValue: 'Copy JSON' })}</Button>
          <Button type='primary' onClick={handleDownload}>
            {t('_approvalGroup.actions.downloadJson', { defaultValue: 'Download JSON' })}
          </Button>
        </Space>
      }
    >
      <Text type='secondary' style={{ display: 'block', marginBottom: 8 }}>
        {t('_approvalGroup.actions.exportFlowHint', {
          defaultValue: 'Exports the current flow as reusable JSON and removes editor-only virtual nodes.'
        })}
      </Text>
      <Input.TextArea value={jsonText} rows={16} readOnly style={{ fontFamily: 'monospace' }} />
    </Modal>
  );
};
