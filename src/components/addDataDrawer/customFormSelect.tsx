import { useSelect } from '@refinedev/antd';
import { BaseOption, useShow } from '@refinedev/core';
import { Button, Flex, Select, Modal, Checkbox, Typography, Divider, Space, Card, Table } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as SolarIconSet from 'solar-icon-set';
import { useTheme } from 'styled-components';
import { getApprovalFlowAdapters } from '../../adapters';

interface CustomFormSelectProps {
  value?: BaseOption;
  onChange?: (val: BaseOption) => void;
  currentStep?: any; // Current step data containing form_data_permissions
  onPermissionChange?: (permissions: any[]) => void; // Callback to save permissions
}

export const CustomFormSelect = ({ value, onChange, currentStep, onPermissionChange }: CustomFormSelectProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { FormBuilder, safeTransformAPIToFormBuilder, useApprovalCustomFieldConfig } = getApprovalFlowAdapters();
  const { APPROVAL_CUSTOM_FIELD_GROUPS } = useApprovalCustomFieldConfig();
  const { selectProps: selectPropResource } = useSelect({
    resource: 'form',
    optionLabel: 'name',
    optionValue: 'id',
    hasPagination: false
  });

  const [isEdit, setIsEdit] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [permissions, setPermissions] = useState<any[]>(currentStep?.form_data_permissions || []);
  
  // Fetch form data when modal is opened
  const { queryResult } = useShow({
    resource: 'form',
    id: value?.value,
    queryOptions: {
      enabled: (isModalVisible || isPermissionModalVisible) && !!value?.value, // Fetch when either modal is open
    }
  });

  const handleChange = (e: BaseOption) => {
    onChange?.(e);
    setIsEdit(false);
  };

  const handleViewForm = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleOpenPermissionModal = () => {
    setIsPermissionModalVisible(true);
  };

  const handleClosePermissionModal = () => {
    setIsPermissionModalVisible(false);
  };

  const handleSavePermissions = () => {
    if (onPermissionChange) {
      onPermissionChange(permissions);
    }
    setIsPermissionModalVisible(false);
  };

  // Transform form data for FormBuilder
  const formBuilderData = queryResult?.data?.data ? safeTransformAPIToFormBuilder(queryResult.data.data) : null;

  // Generate permission structure from form data
  const permissionStructure = useMemo(() => {
    if (!formBuilderData?.pages) return [];
    
    return formBuilderData.pages.map((page: any) => ({
      name: page.name,
      is_visible: true,
      sections: page.sections.map((section: any) => ({
        name: section.name,
        is_visible: true,
        fields: section.elements.map((element: any) => ({
          name: element.settings?.name || element.settings?.id || element.id,
          label: element.settings?.label || element.label || element.settings?.name || element.id,
          is_visible: true,
          is_editable: true,
          is_required: element.settings?.required || false
        }))
      }))
    }));
  }, [formBuilderData]);

  // Initialize permissions from existing data or generate from form structure
  const initializePermissions = () => {
    if (currentStep?.form_data_permissions && currentStep.form_data_permissions.length > 0) {
      return currentStep.form_data_permissions;
    }
    return permissionStructure;
  };

  // Initialize permissions when modal opens or form data changes
  useEffect(() => {
    if (isPermissionModalVisible && permissionStructure.length > 0) {
      const initializedPermissions = initializePermissions();
      setPermissions(initializedPermissions);
    }
  }, [isPermissionModalVisible, permissionStructure, currentStep?.form_data_permissions]);

  // Reset permissions when form changes
  useEffect(() => {
    if (permissionStructure.length > 0) {
      const initializedPermissions = initializePermissions();
      setPermissions(initializedPermissions);
    }
  }, [formBuilderData, currentStep?.form_data_permissions]);

  // Update permission for a specific field
  const updateFieldPermission = (pageIndex: number, sectionIndex: number, fieldIndex: number, type: 'is_visible' | 'is_editable' | 'is_required', value: boolean) => {
    const newPermissions = [...permissions];
    if (!newPermissions[pageIndex]) {
      newPermissions[pageIndex] = permissionStructure[pageIndex];
    }
    if (!newPermissions[pageIndex].sections[sectionIndex]) {
      newPermissions[pageIndex].sections[sectionIndex] = permissionStructure[pageIndex].sections[sectionIndex];
    }
    if (!newPermissions[pageIndex].sections[sectionIndex].fields[fieldIndex]) {
      newPermissions[pageIndex].sections[sectionIndex].fields[fieldIndex] = permissionStructure[pageIndex].sections[sectionIndex].fields[fieldIndex];
    }
    
    newPermissions[pageIndex].sections[sectionIndex].fields[fieldIndex][type] = value;
    setPermissions(newPermissions);
  };

  // Update section permission
  const updateSectionPermission = (pageIndex: number, sectionIndex: number, type: 'is_visible', value: boolean) => {
    const newPermissions = [...permissions];
    if (!newPermissions[pageIndex]) {
      newPermissions[pageIndex] = permissionStructure[pageIndex];
    }
    if (!newPermissions[pageIndex].sections[sectionIndex]) {
      newPermissions[pageIndex].sections[sectionIndex] = permissionStructure[pageIndex].sections[sectionIndex];
    }
    
    newPermissions[pageIndex].sections[sectionIndex][type] = value;
    setPermissions(newPermissions);
  };

  // Update page permission
  const updatePagePermission = (pageIndex: number, type: 'is_visible', value: boolean) => {
    const newPermissions = [...permissions];
    if (!newPermissions[pageIndex]) {
      newPermissions[pageIndex] = permissionStructure[pageIndex];
    }
    
    newPermissions[pageIndex][type] = value;
    setPermissions(newPermissions);
  };

  return (
    <>
      {value && !isEdit ? (
        <Flex align='center' justify='space-between'>
          <div style={{ fontWeight: 'bold' }}>{value.label}</div>
          <Flex gap={8}>
            <Button
              icon={<SolarIconSet.Eye color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
              style={{ cursor: 'pointer' }}
              onClick={handleViewForm}
              title={t('approval-setting:customFormSelect.buttons.viewForm')}
            />
            <Button
              icon={<SolarIconSet.Settings color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
              style={{ cursor: 'pointer' }}
              onClick={handleOpenPermissionModal}
              title={t('approval-setting:customFormSelect.buttons.configurePermissions')}
            />
            <Button
              icon={<SolarIconSet.Pen2 color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
              style={{ cursor: 'pointer' }}
              onClick={() => setIsEdit(true)}
              title={t('approval-setting:customFormSelect.buttons.editSelection')}
            />
          </Flex>
        </Flex>
      ) : (
        <Select {...selectPropResource} labelInValue value={value} onSelect={handleChange} />
      )}

      {/* Full-screen Modal for Form Preview */}
      <Modal
        title={t('approval-setting:customFormSelect.modal.preview.title', { formName: value?.label || 'Form' })}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width="100vw"
        style={{ 
          top: 0,
          maxWidth: 'none',
          margin: 0,
          padding: 0
        }}
        bodyStyle={{
          height: 'calc(100vh - 55px)',
          overflow: 'auto'
        }}
        destroyOnClose={true}
      >
        {queryResult?.isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            {t('approval-setting:customFormSelect.modal.preview.loading')}
          </div>
        ) : queryResult?.isError ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            {t('approval-setting:customFormSelect.modal.preview.error', { error: queryResult.error?.message })}
          </div>
        ) : formBuilderData ? (
          <FormBuilder
            initialData={formBuilderData}
            initialMode="render"
            readOnly={true}
            customFieldGroups={APPROVAL_CUSTOM_FIELD_GROUPS}
            onSave={() => {}} // No save action needed in preview mode
            formName={queryResult?.data?.data?.name || 'Form Preview'}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            {t('approval-setting:customFormSelect.modal.preview.noData')}
          </div>
        )}
      </Modal>

      {/* Permission Configuration Modal */}
      <Modal
        title={t('approval-setting:customFormSelect.modal.permissions.title', { formName: queryResult?.data?.data?.name || value?.label || 'Form' })}
        open={isPermissionModalVisible}
        onCancel={handleClosePermissionModal}
        onOk={handleSavePermissions}
        width={800}
        okText={t('approval-setting:customFormSelect.modal.permissions.saveButton')}
        cancelText={t('approval-setting:customFormSelect.modal.permissions.cancelButton')}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <Typography.Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            {t('approval-setting:customFormSelect.modal.permissions.description')}
          </Typography.Text>
          
          {permissionStructure.map((page: any, pageIndex: number) => {
            const currentPagePermissions = permissions[pageIndex] || page;
            
            return (
              <Card key={pageIndex} style={{ marginBottom: 16 }} size="small">
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {t('approval-setting:customFormSelect.modal.permissions.pageIcon')} {page.name}
                    </Typography.Title>
                    <Checkbox
                      checked={currentPagePermissions?.is_visible === true}
                      onChange={(e) => updatePagePermission(pageIndex, 'is_visible', e.target.checked)}
                    >
                      {t('approval-setting:customFormSelect.modal.permissions.canViewPage')}
                    </Checkbox>
                  </Space>
                </div>
                
                {page.sections.map((section: any, sectionIndex: number) => {
                  const currentSectionPermissions = currentPagePermissions?.sections?.[sectionIndex] || section;
                  
                  return (
                    <div key={sectionIndex} style={{ marginLeft: 16, marginBottom: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Space>
                          <Typography.Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                            {t('approval-setting:customFormSelect.modal.permissions.sectionIcon')} {section.name}
                          </Typography.Title>
                          <Checkbox
                            checked={currentSectionPermissions?.is_visible === true}
                            onChange={(e) => updateSectionPermission(pageIndex, sectionIndex, 'is_visible', e.target.checked)}
                          >
                            {t('approval-setting:customFormSelect.modal.permissions.canViewSection')}
                          </Checkbox>
                        </Space>
                      </div>
                      
                      <div style={{ marginLeft: 16 }}>
                        <Table
                          size="small"
                          pagination={false}
                          showHeader={true}
                          dataSource={section.fields.map((field: any, fieldIndex: number) => ({
                            key: fieldIndex,
                            fieldIndex,
                            name: field.label,
                            field: field,
                            currentPermissions: currentSectionPermissions?.fields?.[fieldIndex] || field
                          }))}
                          columns={[
                            {
                              title: t('approval-setting:customFormSelect.modal.permissions.table.fieldName') as string,
                              dataIndex: 'name',
                              key: 'name',
                              width: '40%',
                            },
                            {
                              title: t('approval-setting:customFormSelect.modal.permissions.table.canView') as string,
                              key: 'is_visible',
                              width: '20%',
                              align: 'center' as const,
                              render: (_, record: any) => (
                                <Checkbox
                                  checked={record.currentPermissions?.is_visible === true}
                                  onChange={(e) => updateFieldPermission(pageIndex, sectionIndex, record.fieldIndex, 'is_visible', e.target.checked)}
                                />
                              ),
                            },
                            {
                              title: t('approval-setting:customFormSelect.modal.permissions.table.canEdit') as string,
                              key: 'is_editable',
                              width: '20%',
                              align: 'center' as const,
                              render: (_, record: any) => (
                                <Checkbox
                                  checked={record.currentPermissions?.is_editable === true}
                                  onChange={(e) => updateFieldPermission(pageIndex, sectionIndex, record.fieldIndex, 'is_editable', e.target.checked)}
                                />
                              ),
                            },
                            {
                              title: t('approval-setting:customFormSelect.modal.permissions.table.isRequired') as string,
                              key: 'is_required',
                              width: '20%',
                              align: 'center' as const,
                              render: (_, record: any) => (
                                <Checkbox
                                  checked={record.currentPermissions?.is_required === true}
                                  onChange={(e) => updateFieldPermission(pageIndex, sectionIndex, record.fieldIndex, 'is_required', e.target.checked)}
                                />
                              ),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      </Modal>
    </>
  );
};
