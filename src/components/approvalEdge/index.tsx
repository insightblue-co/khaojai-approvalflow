import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, type Edge, type EdgeProps } from '@xyflow/react';
import { Button } from 'antd';
import { useState, type FC } from 'react';
import { useTheme } from 'styled-components';
import { ApproveBoxActions } from '../approveBox/ApproveBoxActions';

type EdgeData = {
  label: string;
  isCondition?: boolean;
  rightToRightIndex?: number;
  leftToLeftIndex?: number;
  isHighlighted?: boolean;
};

const CustomEdge: FC<EdgeProps<Edge<EdgeData>>> = props => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, label } = props;

  const theme = useTheme();

  // Check if this is a right-to-right connection by checking the edge props
  const isRightToRight = sourcePosition === 'right' && targetPosition === 'right';
  const isLeftToLeft = sourcePosition === 'left' && targetPosition === 'left';

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isRightToRight || isLeftToLeft) {
    // Calculate offset based on the edge index (for multiple right-to-right edges to same target)
    let offsetX = 0;
    if (isRightToRight) {
      const edgeIndex = data?.rightToRightIndex ?? 0;
      offsetX = 50 + edgeIndex * 50;
    } else {
      const edgeIndex = data?.leftToLeftIndex ?? 0;
      offsetX = -50 - edgeIndex * 50;
    }

    // Check if target is an end node (simplified path)
    const targetId = (props as any).target;
    const isEndNode = targetId && targetId.includes('end');

    if (isEndNode) {
      // Simplified path for end nodes: right → straight down → left
      edgePath = `M ${sourceX},${sourceY} L ${sourceX + offsetX},${sourceY} L ${sourceX + offsetX},${targetY} L ${targetX},${targetY}`;

      // Position label at the vertical section
      labelX = sourceX + offsetX;
      labelY = (sourceY + targetY) / 2;
    } else {
      // Complex path for non-end nodes: right → down → left → down → left
      const midY = (sourceY + targetY) / 2;
      edgePath = `M ${sourceX},${sourceY} L ${sourceX + offsetX},${sourceY} L ${sourceX + offsetX},${midY} L ${targetX + offsetX},${midY} L ${targetX + offsetX},${targetY} L ${targetX},${targetY}`;

      // Position label at the right side vertical section
      labelX = sourceX + offsetX;
      labelY = midY;
    }
  } else {
    // Use default smooth step path
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition || Position.Bottom,
      targetPosition: targetPosition || Position.Top
    });
  }

  const [showAction, setShowAction] = useState(false);

  // Apply highlight styling if this edge is highlighted
  const isHighlighted = data?.isHighlighted ?? false;
  const edgeStyle = isHighlighted
    ? { stroke: theme.colors.primary_02, strokeWidth: 2 }
    : { stroke: '#b1b1b7', strokeWidth: 1 };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        {(!data?.isCondition || label) && (
          <div
            className='button-edge__label nodrag nopan'
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 1 // Add base z-index
            }}
          >
            {label && (
              <div
                style={{
                  background: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #d9d9d9',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#666',
                  whiteSpace: 'nowrap'
                }}
              >
                {label}
              </div>
            )}
            {/* Only show + button if this edge is NOT from action button (no label) */}
            {!label && (
              <div style={{ position: 'relative' }}>
                <Button
                  style={{
                    pointerEvents: 'auto',
                    borderRadius: 34,
                    width: 34,
                    height: 34,
                    color: theme.colors.primary_02,
                    zIndex: 2 // Higher than parent
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setShowAction(!showAction);
                  }}
                >
                  {showAction ? '-' : '+'}
                </Button>
                {showAction && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '0%',
                      marginLeft: '8px',
                      zIndex: 9999,
                      pointerEvents: 'auto' // Enable interactions
                    }}
                  >
                    <ApproveBoxActions id={id} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
