import { Button, Flex, Form, Radio } from 'antd';
import * as SolarIconSet from 'solar-icon-set';
import { ApprovalLevelsProps } from '../interface';
import { CustomApprovalRequester } from './customApprovalRequester';
import { createDefaultRule } from '../../approver';

// Constants
const DEFAULT_QUALIFICATION_VALUE = 'and';

export const ApprovalLevels = ({
  t,
  tPageFieldBaseKey,
  type,
  theme,
  hideConditionMap
}: ApprovalLevelsProps & {
  hideConditionMap: Record<string, boolean>;
}) => {
  return (
    <Form.List name='rules'>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field, index) => {
            const currentLevel = index + 1; // Start from level 1
            const isLastLevel = index === fields.length - 1;
            const shouldHideCondition = hideConditionMap[field.name] || false;

            return (
              <div key={`${field.key}-${shouldHideCondition ? 'hidden' : 'shown'}`}>
                <Form.Item
                  label={
                    <Flex align='center' justify='space-between' style={{ width: '100vh' }}>
                      <span>{t(`${tPageFieldBaseKey}.fields.${type}Index`, { index: currentLevel })}</span>
                      {fields.length > 1 && (
                        <Button
                          type='text'
                          icon={
                            <SolarIconSet.TrashBinTrash color={theme.colors.neutral_05} size={24} iconStyle='Outline' />
                          }
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Flex>
                  }
                  {...field}
                  name={[field.name, 'rules']}
                  rules={[{ required: true, message: 'This field is required' }]}
                >
                  <CustomApprovalRequester type={type} />
                </Form.Item>

                {/* If not approval, show condition options */}
                <Flex gap={16} align='start'>
                  {!shouldHideCondition && (
                    <Form.Item
                      {...field}
                      name={[field.name, 'condition']}
                      initialValue={DEFAULT_QUALIFICATION_VALUE}
                      key={`condition-${field.name}-${shouldHideCondition}`}
                    >
                      <Radio.Group>
                        <Radio.Button value='and'>{t(`${tPageFieldBaseKey}.fields.matchAll`)}</Radio.Button>
                        <Radio.Button value='or'>{t(`${tPageFieldBaseKey}.fields.matchSome`)}</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {!type.match(/^approve\d*$/) && isLastLevel && currentLevel < 9 && (
                    <div style={{ marginBottom: '20px' }}>
                      <Button icon={<SolarIconSet.AddCircle />} onClick={() => add(createDefaultRule())}>
                        {t(`${tPageFieldBaseKey}.fields.${type}Index`, { index: currentLevel + 1 })}
                      </Button>
                    </div>
                  )}
                </Flex>
              </div>
            );
          })}
        </>
      )}
    </Form.List>
  );
};
