import { Button, Flex, Input } from 'antd';
import * as SolarIconSet from 'solar-icon-set';
import { useTheme } from 'styled-components';
import { TitleEditorProps } from '../interface';

export const TitleEditor = ({ isEditing, title, onTitleChange, onToggleEdit }: TitleEditorProps) => {
  const theme = useTheme();

  if (isEditing) {
    return (
      <Flex gap={4} align='center'>
        <Input defaultValue={title} onChange={e => onTitleChange(e.target.value)} autoFocus />
        <Button
          type='link'
          icon={<SolarIconSet.Diskette color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
          onClick={onToggleEdit}
          style={{ cursor: 'pointer' }}
        />
      </Flex>
    );
  }

  return (
    <Flex gap={4} align='center'>
      {title}
      <Button
        type='link'
        icon={<SolarIconSet.Pen2 color={theme.colors.primary_02} size={18} iconStyle='Outline' />}
        onClick={onToggleEdit}
        style={{ cursor: 'pointer' }}
      />
    </Flex>
  );
};
