import React, { useEffect, useState } from 'react';
import { Modal, Input, Upload, Button, Typography, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslation } from 'react-i18next';
import type { ApprovalFlowData } from './interface';
import { parseApprovalFlowJson } from '../parseApprovalFlowJson';
import type { MapApprovalApiOptions } from '../mapApprovalApiToFlowData';

const { Text } = Typography;

export type ImportFlowJsonModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (flow: ApprovalFlowData) => void;
  mapOptions?: MapApprovalApiOptions;
  /** When the modal opens, prefill the textarea (e.g. sample JSON for demos). */
  initialText?: string;
};

/**
 * Modal: paste JSON or upload a `.json` file and apply to the approval flow editor.
 */
export const ImportFlowJsonModal: React.FC<ImportFlowJsonModalProps> = ({
  open,
  onCancel,
  onApply,
  mapOptions,
  initialText
}) => {
  const { t } = useTranslation('approval-setting');
  const [text, setText] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (open) {
      setText(initialText ?? '');
      setFileList([]);
    }
  }, [open, initialText]);

  const handleApply = () => {
    const result = parseApprovalFlowJson(text.trim() || '{}', mapOptions);
    if (!result.ok) {
      result.errors.forEach(e => message.error(e));
      return;
    }
    onApply(result.data);
    message.success(t('_approvalGroup.actions.importFlowSuccess', { defaultValue: 'Flow imported' }));
    setText('');
    setFileList([]);
    onCancel();
  };

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setText(content);
        message.success(t('_approvalGroup.actions.importFlowFileRead', { defaultValue: 'File loaded' }));
      }
    };
    reader.readAsText(file);
    setFileList([{ uid: file.name, name: file.name, status: 'done' }]);
    return false;
  };

  return (
    <Modal
      open={open}
      title={t('_approvalGroup.actions.importFlowJson', { defaultValue: 'Import flow from JSON' })}
      onCancel={onCancel}
      onOk={handleApply}
      okText={t('_approvalGroup.actions.apply', { defaultValue: 'Apply' })}
      width={720}
      destroyOnClose
    >
      <Text type='secondary' style={{ display: 'block', marginBottom: 8 }}>
        {t('_approvalGroup.actions.importFlowHint', {
          defaultValue: 'Paste JSON or upload a file. Expected shape: API approval object or ApprovalFlowData with steps and start_step_id.'
        })}
      </Text>
      <Upload beforeUpload={beforeUpload} fileList={fileList} maxCount={1} accept='.json,application/json'>
        <Button>{t('_approvalGroup.actions.chooseJsonFile', { defaultValue: 'Choose JSON file' })}</Button>
      </Upload>
      <Input.TextArea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={14}
        placeholder='{ "steps": [...], "start_step_id": "..." }'
        style={{ marginTop: 12, fontFamily: 'monospace' }}
      />
    </Modal>
  );
};
