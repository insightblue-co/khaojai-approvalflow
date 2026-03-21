import { Button, Card, Col, Divider, Flex, Space, Switch, Tag, theme, Tooltip } from 'antd';
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as SolarIconSet from 'solar-icon-set';
import styled, { useTheme } from 'styled-components';
import {
  ApprovalRequesterSectionProps,
  ApprovalRequesterData,
  CustomApprovalRequesterProps,
  ApprovalItem
} from '../interface';
import { AddApprovalRequesterDepartmentModal } from './modals/addApprovalRequesterDepartment';
import { AddApprovalRequesterDepartmentSupervisorModal } from './modals/addApprovalRequesterDepartmentSupervisor';
import { AddApprovalRequesterMemberModal } from './modals/addApprovalRequesterMember';
import { AddApprovalRequesterRoleModal } from './modals/addApprovalRequesterRole';

const CustomDivider = styled(Divider)`
  margin: 0px;
`;

export const CustomApprovalRequester = ({ value = {}, onChange, type }: CustomApprovalRequesterProps) => {
  const theme = useTheme();
  const { t } = useTranslation('approval-setting');
  const tPageFieldBaseKey = 'approveBoxFlow';

  // Initialize checkedList from value or empty object
  const [checkedList, setCheckedList] = useState<ApprovalRequesterData>(value || {});
  const [openAddApprovalRequesterModal, setOpenAddApprovalRequesterModal] = useState<string>('');

  // Update checkedList when value changes
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      setCheckedList(value);
    }
  }, [value]);

  // Memoized helper function to check if a key is in the checkedList
  const isCheck = useCallback(
    (name: string) => {
      return Object.keys(checkedList).includes(name);
    },
    [checkedList]
  );

  const handleChange = (checked: boolean, name: string) => {
    if (checked) {
      if (name === 'all' || name === 'submitter') {
        const newState = { [name]: [] };
        setCheckedList(newState);
        onChange?.(newState);
      } else {
        setCheckedList(prev => {
          const newCheckedList = { ...prev };
          delete newCheckedList.all;
          delete newCheckedList.submitter;
          newCheckedList[name] = [];
          onChange?.(newCheckedList);
          return newCheckedList;
        });
      }
    } else {
      setCheckedList(prev => {
        const newCheckedList = { ...prev };
        delete newCheckedList[name];
        onChange?.(newCheckedList);
        return newCheckedList;
      });
    }
  };

  const handleCloseModal = useCallback(() => {
    setOpenAddApprovalRequesterModal('');
  }, []);

  const handleSubmitModal = useCallback(
    (name: string, items: ApprovalItem[]) => {
      setCheckedList(prev => {
        // Create a new object to avoid direct mutation
        const updatedCheckList = { ...prev, [name]: items };
        onChange?.(updatedCheckList);
        return updatedCheckList;
      });
      setOpenAddApprovalRequesterModal('');
    },
    [onChange]
  );

  // Component for adding data section
  const AddDataSection: React.FC<ApprovalRequesterSectionProps> = useCallback(
    ({ onClick }) => (
      <Flex align='center' style={{ pointerEvents: 'auto', height: 20 }} onClick={onClick}>
        <Divider style={{ height: 20 }} type='vertical' />
        <Button
          style={{
            width: 100,
            color: theme.colors.primary_02
          }}
          icon={<SolarIconSet.AddCircle color={theme.colors.primary_02} size={16} iconStyle='Outline' />}
          type='link'
        >
          {t(`${tPageFieldBaseKey}.actions.addData`)}
        </Button>
      </Flex>
    ),
    [t, theme.colors.primary_02]
  );

  // Component for showing data section
  const ShowDataSection: React.FC<{ name: string }> = useCallback(
    ({ name }) => {
      const MAX_CHARS = 42; // Maximum characters to display before using +N tag
      const items = checkedList[name] || [];

      // Function to calculate how many items to show
      const calculateVisibleItems = () => {
        let totalChars = 0;
        let visibleCount = 0;

        for (let i = 0; i < items.length; i++) {
          // Add length of item plus comma and space
          const itemLength = items[i]?.display_name?.length + (i > 0 ? 2 : 0); // ", " = 2 chars
          totalChars += itemLength;

          if (totalChars <= MAX_CHARS || i === 0) {
            // Always show at least one item
            visibleCount++;
          } else {
            break;
          }
        }

        return visibleCount;
      };

      const visibleCount = calculateVisibleItems();
      const visibleItems = items.slice(0, visibleCount);
      const hiddenCount = items.length - visibleCount;

      return (
        <Flex style={{ width: '100%' }} justify='space-between'>
          <Flex gap={8} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Divider style={{ height: 20 }} type='vertical' />
            {visibleItems.map(item => item.display_name).join(', ')}
          </Flex>
          <Flex gap={8} align='center'>
            {hiddenCount > 0 && (
              <Tooltip
                title={items
                  .slice(visibleCount)
                  .map(item => item.display_name)
                  .join(', ')}
              >
                <Tag color={theme.colors.neutral_10} style={{ color: theme.colors.neutral_05, borderRadius: 20 }}>
                  +{hiddenCount}
                </Tag>
              </Tooltip>
            )}
            <SolarIconSet.Pen2
              color={theme.colors.primary_02}
              size={18}
              iconStyle='Outline'
              onClick={() => setOpenAddApprovalRequesterModal(name)}
            />
          </Flex>
        </Flex>
      );
    },
    [checkedList, setOpenAddApprovalRequesterModal, theme.colors.primary_02]
  );

  // Function to render approval requester section
  const renderApprovalRequester = useCallback(
    (name: string, key: string) => {
      const hasData = isCheck(key) && checkedList[key]?.length > 0;

      return (
        <>
          <Flex align='center'>
            <Col span={8}>
              <Space>
                <Switch onChange={check => handleChange(check, key)} checked={isCheck(key)} />
                {t(`${tPageFieldBaseKey}.fields.${name}`)}
              </Space>
            </Col>
            {isCheck(key) &&
              (hasData ? (
                <ShowDataSection name={key} />
              ) : (
                <AddDataSection onClick={() => setOpenAddApprovalRequesterModal(key)} />
              ))}
          </Flex>
        </>
      );
    },
    [isCheck, checkedList, handleChange, t, ShowDataSection, AddDataSection]
  );

  // Define the configuration for each modal
  const modalConfigs = useMemo(
    () => [
      {
        key: 'roles',
        component: (
          <AddApprovalRequesterRoleModal
            open={openAddApprovalRequesterModal === 'roles'}
            handleCancel={handleCloseModal}
            handleOk={(modalName, modalValue) => handleSubmitModal(modalName, modalValue)}
            value={checkedList?.['roles'] || []}
          />
        )
      },
      {
        key: 'users',
        component: (
          <AddApprovalRequesterMemberModal
            open={openAddApprovalRequesterModal === 'users'}
            handleCancel={handleCloseModal}
            handleOk={(modalName, modalValue) => handleSubmitModal(modalName, modalValue)}
            value={checkedList?.['users'] || []}
          />
        )
      },
      {
        key: 'departments',
        component: (
          <AddApprovalRequesterDepartmentModal
            open={openAddApprovalRequesterModal === 'departments'}
            handleCancel={handleCloseModal}
            handleOk={(modalName, modalValue) => handleSubmitModal(modalName, modalValue)}
            value={checkedList?.['departments'] || []}
          />
        )
      },
      {
        key: 'supervisor_department',
        component: (
          <AddApprovalRequesterDepartmentSupervisorModal
            open={openAddApprovalRequesterModal === 'supervisor_department'}
            handleCancel={handleCloseModal}
            handleOk={(modalName, modalValue) => handleSubmitModal(modalName, modalValue)}
            value={checkedList?.['supervisor_department'] || []}
          />
        )
      },
      {
        key: 'submitter',
        component: null
      }
    ],
    [openAddApprovalRequesterModal, handleCloseModal, handleSubmitModal, checkedList]
  );

  return (
    <>
      <Card size='small'>
        <Flex vertical gap={8}>
          {['submit', 'check', 'approve'].includes(type) && (
            <>
              <Space>
                <Switch onChange={check => handleChange(check, 'all')} checked={isCheck('all')} />
                {t(`${tPageFieldBaseKey}.fields.everyone`)}
              </Space>
              <CustomDivider />
            </>
          )}

          {/* 2nd parameters will use as key, values pair */}
          {renderApprovalRequester('department', 'departments')}
          <CustomDivider />

          {renderApprovalRequester('departmentManager', 'supervisor_department')}
          <CustomDivider />

          {renderApprovalRequester('role', 'roles')}
          <CustomDivider />

          {renderApprovalRequester('selectMember', 'users')}

          {type !== 'check' && type !== 'submit' && (
            <>
              <CustomDivider />
              <Col span={7}>
                <Space>
                  <Switch onChange={check => handleChange(check, 'submitter')} checked={isCheck('submitter')} />
                  {t(`${tPageFieldBaseKey}.fields.submitter`)}
                </Space>
              </Col>
            </>
          )}
        </Flex>
      </Card>

      {/* Render all modals */}
      {modalConfigs.map(config => (
        <React.Fragment key={config.key}>{config.component}</React.Fragment>
      ))}
    </>
  );
};
