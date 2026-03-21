import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { applyEdgeChanges, applyNodeChanges, Controls, EdgeTypes, ReactFlow, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Popover, Tooltip, Switch } from 'antd';
import { PlusOutlined, ReloadOutlined, AimOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import CustomEdge from './approvalEdge';
import { ApproveBox } from './approveBox/ApproveBox';
import { ApprovalFlowBoxProps, ApprovalFlowData, ApprovalFlowEdge, ApprovalFlowNode, Step } from './interface';
import { ConditionBox } from './conditionBox/ConditionBox';
import { AddConditionBox } from './conditionBox/AddConditionBox';
import { createEdge, createNode, createSideEdge, inferNodeType, LAYOUT } from '../approver';
import { findEdgeLabel } from './utils/flowLayoutUtils';
import { ApproveBoxActions } from './approveBox/ApproveBoxActions';
import { ApprovalHeaderType } from './interface';
import { useApprovalFlowContext } from '../context/ApprovalFlowContext';
import { ImportFlowJsonModal } from './ImportFlowJsonModal';
import { ExportFlowJsonModal } from './ExportFlowJsonModal';
import type { MapApprovalApiOptions } from '../mapApprovalApiToFlowData';

// Styled Components
const AddNodeButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: scale(1.1);
  }
`;

const RecalculateButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 80px;
  z-index: 10;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: scale(1.1);
  }
`;

const AutoRepositionButton = styled.div`
  position: absolute;
  top: 20px;
  right: 140px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  font-weight: 500;
`;

const JsonActionsContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  gap: 8px;
  font-family: inherit;
`;

const FlowCanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  font-family: inherit;
  --xy-node-font-family: inherit;
  --xy-edge-label-font-family: inherit;
`;

// Helper Functions
const getNodeWidth = (step: Step): number => {
  return step.step_type === 'END' ? LAYOUT.endNodeWidth : LAYOUT.defaultWidth;
};

const calculateChildrenLayout = (parentX: number, parentWidth: number, children: Step[]): number[] => {
  if (children.length === 0) return [];

  if (children.length === 1) {
    const childWidth = getNodeWidth(children[0]);
    const parentCenterX = parentX + parentWidth / 2;
    return [parentCenterX - childWidth / 2];
  }

  const positions: number[] = [];
  const childWidths = children.map(getNodeWidth);

  if (children.find(child => child.node_type === 'Condition')) {
    // Multiple children - center the group
    const totalWidth =
      childWidths.reduce((sum, width) => sum + width, 0) + (children.length - 1) * LAYOUT.horizontalSpacing;
    const parentCenterX = parentX + parentWidth / 2;
    const startX = parentCenterX - totalWidth / 2;

    let currentX = startX;
    childWidths.forEach(width => {
      positions.push(currentX);
      currentX += width + LAYOUT.horizontalSpacing;
    });
  } else {
    childWidths.forEach(() => positions.push(parentX));
  }

  return positions;
};

const normalizeSteps = (steps: Step[]): void => {
  steps.forEach(step => {
    if (!step.node_type) {
      step.node_type = inferNodeType(step.step_type);
    }

    if (step.step_type === 'ADD_CONDITION' && step.nexts) {
      step.nexts.forEach((next: any, index: number) => {
        if (!next._virtual_condition_id) {
          const conditionBaseId = `condition${step.step_id.slice(-1)}`;
          next._virtual_condition_id = `${conditionBaseId}_${index + 1}`;
        }
      });
    }
  });
};

const createVirtualSteps = (
  flow: ApprovalFlowData
): { virtualSteps: Map<string, Step>; existingVirtualNodes: Map<string, Step> } => {
  const virtualSteps = new Map<string, Step>();
  const existingVirtualNodes = new Map<string, Step>();
  const existingVirtualGroupCounts = new Map<string, number>();

  // Collect existing virtual nodes
  flow.steps.forEach(step => {
    if ((step as any)._is_virtual) {
      existingVirtualNodes.set(step.step_id, step);
    }
  });

  // Track counts per ADD_CONDITION node
  flow.steps.forEach(step => {
    if (step.step_type === 'ADD_CONDITION' && step.nexts) {
      const virtualConditionIds = step.nexts.map((next: any) => next._virtual_condition_id).filter(Boolean);
      const existingCount = virtualConditionIds.filter(id => existingVirtualNodes.has(id)).length;
      existingVirtualGroupCounts.set(step.step_id, existingCount);
    }
  });

  // Create virtual nodes
  flow.steps.forEach(step => {
    if (step.step_type === 'ADD_CONDITION' && step.nexts) {
      const currentConditionCount = step.nexts.filter((next: any) => next._virtual_condition_id).length;
      const previousConditionCount = existingVirtualGroupCounts.get(step.step_id) || 0;
      const groupSizeChanged = currentConditionCount !== previousConditionCount;

      step.nexts.forEach((next: any) => {
        if (next._virtual_condition_id) {
          const virtualNexts =
            next._virtual_nexts?.length > 0
              ? next._virtual_nexts.map((stepId: string) => ({ condition_groups: null, step_id: stepId }))
              : [{ condition_groups: null, step_id: next.step_id }];

          const existingVirtualNode = existingVirtualNodes.get(next._virtual_condition_id);

          const virtualStep: Step = {
            pre_actions: null,
            post_actions: null,
            nexts: virtualNexts,
            step_id: next._virtual_condition_id,
            name: 'condition',
            description: '',
            status: 'CONDITION',
            form_id: null,
            form_name: null,
            form_data_permissions: null,
            action_buttons: null,
            step_type: 'CONDITIONAL',
            approval_type: 'MANUAL_APPROVE',
            approvers: [],
            approve_require: 'ANY',
            ccs: [],
            node_type: 'Condition',
            _is_virtual: true,
            position_x: !groupSizeChanged ? existingVirtualNode?.position_x : undefined,
            position_y: !groupSizeChanged ? existingVirtualNode?.position_y : undefined
          } as any;

          virtualSteps.set(next._virtual_condition_id, virtualStep);
        }
      });
    }
  });

  return { virtualSteps, existingVirtualNodes };
};

const buildNodeTree = (
  startStepId: string,
  stepsMap: Map<string, Step>,
  nodes: ApprovalFlowNode[],
  visitedNodes: Set<string>,
  centerX: number,
  autoReposition: boolean = true
): void => {
  const buildTree = (stepId: string, calculatedX: number, calculatedY: number): void => {
    if (visitedNodes.has(stepId)) return;

    const step = stepsMap.get(stepId);
    if (!step) return;

    visitedNodes.add(stepId);

    const hasStoredPosition = step.position_x !== undefined && step.position_y !== undefined;
    const x = hasStoredPosition ? step.position_x! : calculatedX;
    const y = hasStoredPosition ? step.position_y! : calculatedY;

    if (!hasStoredPosition && autoReposition) {
      step.position_x = x;
      step.position_y = y;
    }

    const isEndNode = step.step_type === 'END';
    const node = createNode(step, nodes.length, x, y, isEndNode);
    nodes.push(node);

    if (!step.nexts || step.nexts.length === 0) return;

    // Get children to render
    const childrenToRender =
      step.step_type === 'ADD_CONDITION'
        ? (step.nexts.map((next: any) => stepsMap.get(next._virtual_condition_id)).filter(Boolean) as Step[])
        : (step.nexts.map(next => stepsMap.get(next.step_id)).filter(Boolean) as Step[]);

    if (childrenToRender.length === 0) return;

    // Handle positioning
    // If parent has stored position, respect children's stored positions first
    if (hasStoredPosition) {
      const childrenHavePositions = childrenToRender.every(
        child => child.position_x !== undefined && child.position_y !== undefined
      );

      // Always use stored positions if they exist, regardless of autoReposition setting
      if (childrenHavePositions) {
        childrenToRender.forEach(child => {
          buildTree(child.step_id, child.position_x!, child.position_y!);
        });
        return;
      } else if (!autoReposition) {
        // If auto reposition is off, use existing positions or keep current calculated positions
        childrenToRender.forEach(child => {
          const childX = child.position_x !== undefined ? child.position_x! : x;
          const childY = child.position_y !== undefined ? child.position_y! : y + LAYOUT.verticalSpacing;
          buildTree(child.step_id, childX, childY);
        });
        return;
      } else {
        // Only calculate new positions if auto reposition is on and children don't have positions
        const childPositions = childrenToRender.map(
          (_, index) => x + index * (LAYOUT.defaultWidth + LAYOUT.horizontalSpacing)
        );
        const nextY = y + LAYOUT.verticalSpacing;
        childrenToRender.forEach((child, index) => {
          buildTree(child.step_id, childPositions[index], nextY);
        });
      }
    } else {
      // Parent doesn't have stored position
      if (autoReposition) {
        const nodeWidth = getNodeWidth(step);
        const childPositions = calculateChildrenLayout(x, nodeWidth, childrenToRender);
        const nextY = calculatedY + LAYOUT.verticalSpacing;

        childrenToRender.forEach(child => {
          child.position_x = undefined;
          child.position_y = undefined;
        });

        childrenToRender.forEach((child, index) => {
          buildTree(child.step_id, childPositions[index], nextY);
        });
      } else {
        // If auto reposition is off, use existing positions or keep current calculated positions
        childrenToRender.forEach(child => {
          const childX = child.position_x !== undefined ? child.position_x! : x;
          const childY = child.position_y !== undefined ? child.position_y! : calculatedY + LAYOUT.verticalSpacing;
          buildTree(child.step_id, childX, childY);
        });
      }
    }
  };

  buildTree(startStepId, centerX, 0);
};

const addStandaloneNodes = (flow: ApprovalFlowData, nodes: ApprovalFlowNode[], visitedNodes: Set<string>): void => {
  flow.steps.forEach(step => {
    if (visitedNodes.has(step.step_id)) return;
    if ((step as any)._is_virtual) return;

    const hasNexts = step.nexts && step.nexts.length > 0;
    const isReferenced = flow.steps.some(s => s.nexts?.some((n: any) => n.step_id === step.step_id));

    if (!hasNexts && !isReferenced) {
      const x = step.position_x || 0;
      const y = step.position_y || 0;
      const isEndNode = step.step_type === 'END';
      const node = createNode(step, nodes.length, x, y, isEndNode);
      nodes.push(node);
      visitedNodes.add(step.step_id);
    }
  });
};

const createFlowEdges = (flow: ApprovalFlowData, stepsMap: Map<string, Step>): ApprovalFlowEdge[] => {
  const edgeMap = new Map<string, { edge: ApprovalFlowEdge; hasLabel: boolean }>();

  flow.steps.forEach(step => {
    if (!step.nexts || step.nexts.length === 0) return;

    const hasActionButtons = step.action_buttons && step.action_buttons.length > 0;

    step.nexts.forEach((next: any, index: number) => {
      const targetId =
        step.step_type === 'ADD_CONDITION' && next._virtual_condition_id ? next._virtual_condition_id : next.step_id;

      const hasConditions = next.condition_groups?.length > 0;
      const hasLogicCondition = next.logic_condition !== null && next.logic_condition !== undefined;

      // Skip edge creation for action buttons without conditions, except for INTEGRATION step type
      // INTEGRATION steps use action_buttons to store next steps, so we should create edges
      if (hasActionButtons && !hasConditions && !hasLogicCondition && step.step_type !== 'INTEGRATION') return;

      const edgeId = `${step.step_id}-${targetId}`;
      const targetStep = stepsMap.get(targetId);

      if (targetStep) {
        const edgeLabel = findEdgeLabel(step, next);
        const hasLabel = edgeLabel.length > 0;
        const existingEdge = edgeMap.get(edgeId);

        if (!existingEdge || (hasLabel && !existingEdge.hasLabel)) {
          const isConditionBranch = step.step_type === 'ADD_CONDITION';
          const newEdge =
            hasLabel && index > 0
              ? createSideEdge(step.step_id, targetId, isConditionBranch, edgeLabel, index % 2 === 0 ? 'left' : 'right')
              : createEdge(step.step_id, targetId, isConditionBranch, edgeLabel);

          edgeMap.set(edgeId, { edge: newEdge, hasLabel });
        }
      }
    });
  });

  // Assign indices to side edges
  const rightToRightEdges: ApprovalFlowEdge[] = [];
  const leftToLeftEdges: ApprovalFlowEdge[] = [];

  edgeMap.forEach(({ edge }) => {
    if (edge.sourceHandle === 'right' && edge.targetHandle === 'right') {
      rightToRightEdges.push(edge);
    } else if (edge.sourceHandle === 'left' && edge.targetHandle === 'left') {
      leftToLeftEdges.push(edge);
    }
  });

  rightToRightEdges.forEach((edge, index) => {
    edge.data = edge.data || { isCondition: false };
    edge.data.rightToRightIndex = index;
  });

  leftToLeftEdges.forEach((edge, index) => {
    edge.data = edge.data || { isCondition: false };
    edge.data.leftToLeftIndex = index;
  });

  return Array.from(edgeMap.values()).map(({ edge }) => edge);
};

export type ApprovalFlowProps = {
  initialImportText?: string;
  exportFileName?: string;
  importMapOptions?: MapApprovalApiOptions;
  showJsonControls?: boolean;
};

// Main Component
export const ApprovalFlow: React.FC<ApprovalFlowProps> = ({
  initialImportText,
  exportFileName,
  importMapOptions,
  showJsonControls = true
}) => {
  const { flow: approvalFlow, setFlow: setApprovalFlow } = useApprovalFlowContext();
  const { t } = useTranslation('approval-setting');

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddNodePopoverOpen, setIsAddNodePopoverOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [shouldFitView, setShouldFitView] = useState(true);
  const [nodes, setNodes] = useState<ApprovalFlowNode[]>([]);
  const [edges, setEdges] = useState<ApprovalFlowEdge[]>([]);
  const [autoReposition, setAutoReposition] = useState<boolean>(true);
  const hasInitializedAutoReposition = useRef<boolean>(false);
  const currentFlowName = useRef<string>('');

  useEffect(() => {
    if (approvalFlow) {
      // Reset initialization flag when flow name changes (different approval)
      if (currentFlowName.current !== approvalFlow.name) {
        hasInitializedAutoReposition.current = false;
        currentFlowName.current = approvalFlow.name;
      }
      
      // On initial load, check if steps have stored positions from database
      // If they do, disable auto reposition to preserve saved positions
      if (!hasInitializedAutoReposition.current) {
        const hasStoredPositions = approvalFlow.steps.some(
          step => step.position_x !== undefined && step.position_y !== undefined && 
                  step.position_x !== null && step.position_y !== null
        );
        
        if (hasStoredPositions) {
          setAutoReposition(false);
        }
        hasInitializedAutoReposition.current = true;
      }
      
      setFlowData(approvalFlow);
      setShouldFitView(true);
    }
  }, [approvalFlow.name, approvalFlow.start_step_id, approvalFlow.form_name, JSON.stringify(approvalFlow.steps)]);

  // Event Handlers
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setEdges(
      currentEdges =>
        currentEdges.map(edge => ({
          ...edge,
          data: { ...edge.data, isHighlighted: edge.source === nodeId }
        })) as ApprovalFlowEdge[]
    );
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(nds => applyNodeChanges(changes, nds) as ApprovalFlowNode[]);

      changes.forEach(change => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          const node = nodes.find(n => n.id === change.id);
          if (!node?.data?.type) return;

          const updatedFlow = { ...approvalFlow };
          const stepToUpdate = updatedFlow.steps.find(step => step.step_id === node.data.type);

          if (stepToUpdate) {
            stepToUpdate.position_x = change.position.x;
            stepToUpdate.position_y = change.position.y;
            setApprovalFlow(updatedFlow);
          }
        }
      });
    },
    [nodes, approvalFlow, setApprovalFlow]
  );

  const onEdgesChange = (changes: any) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  };

  const onPaneClick = () => {
    setSelectedNodeId(null);
    setEdges(
      currentEdges =>
        currentEdges.map(edge => ({
          ...edge,
          data: { ...edge.data, isHighlighted: false }
        })) as ApprovalFlowEdge[]
    );
  };

  // Recalculate all node positions
  const handleRecalculatePositions = () => {
    if (!approvalFlow) return;

    const updatedFlow = { ...approvalFlow };

    // Reset all positions except for first node
    updatedFlow.steps = updatedFlow.steps.map((step, index) => {
      if (step.step_id === approvalFlow.start_step_id) {
        // Set first node to center position
        return {
          ...step,
          position_x: window.innerWidth / 2 - LAYOUT.defaultWidth / 2,
          position_y: 0
        };
      } else {
        // Set all other nodes to undefined to force recalculation
        return {
          ...step,
          position_x: undefined,
          position_y: undefined
        };
      }
    });

    setApprovalFlow(updatedFlow);
  };

  // Main flow data processing
  const setFlowData = useCallback(
    (flow: ApprovalFlowData) => {
      if (!flow.start_step_id) {
        console.error('Flow must have a start_step_id');
        return;
      }

      normalizeSteps(flow.steps);

      const stepsMap = new Map<string, Step>();
      flow.steps.forEach(step => stepsMap.set(step.step_id, step));

      const { virtualSteps } = createVirtualSteps(flow);
      virtualSteps.forEach((step, id) => stepsMap.set(id, step));

      const realSteps = flow.steps.filter(step => !(step as any)._is_virtual);
      const allSteps = [...realSteps, ...Array.from(virtualSteps.values())];
      const uniqueStepsMap = new Map<string, Step>();
      allSteps.forEach(step => uniqueStepsMap.set(step.step_id, step));
      flow.steps = Array.from(uniqueStepsMap.values());

      const newNodes: ApprovalFlowNode[] = [];
      const visitedNodes = new Set<string>();
      const centerX = window.innerWidth / 2 - LAYOUT.defaultWidth / 2;

      buildNodeTree(flow.start_step_id, stepsMap, newNodes, visitedNodes, centerX, autoReposition);
      addStandaloneNodes(flow, newNodes, visitedNodes);

      const newEdges = createFlowEdges(flow, stepsMap);

      setNodes(newNodes);
      setEdges(newEdges);
      setApprovalFlow(flow);
    },
    [setApprovalFlow, autoReposition]
  );

  // Memoized values
  const nodeTypes = useMemo(
    () => ({
      ApprovalFlow: (nodeProps: { id: string; data: ApprovalFlowBoxProps }) => (
        <ApproveBox
          {...(nodeProps as any)}
          isSelected={selectedNodeId === nodeProps.id}
          onNodeClick={() => handleNodeClick(nodeProps.id)}
        />
      ),
      Condition: (nodeProps: { id: string; data: ApprovalFlowBoxProps }) => (
        <ConditionBox
          {...(nodeProps as any)}
          isSelected={selectedNodeId === nodeProps.id}
          onNodeClick={() => handleNodeClick(nodeProps.id)}
        />
      ),
      AddCondition: (nodeProps: { id: string; data: ApprovalFlowBoxProps }) => (
        <AddConditionBox
          {...(nodeProps as any)}
          isSelected={selectedNodeId === nodeProps.id}
          onNodeClick={() => handleNodeClick(nodeProps.id)}
        />
      )
    }),
    [selectedNodeId, handleNodeClick]
  );

  const edgeTypes: EdgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  return (
    <FlowCanvasContainer>
      {showJsonControls && (
        <JsonActionsContainer>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportOpen(true)}>
            {t('_approvalGroup.actions.importFlowJson', { defaultValue: 'Import JSON' })}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => setIsExportOpen(true)}>
            {t('_approvalGroup.actions.exportFlowJson', { defaultValue: 'Export JSON' })}
          </Button>
        </JsonActionsContainer>
      )}

      <Tooltip
        title={
          autoReposition
            ? t('approveBoxFlow.actions.autoRepositionOn', 'Auto Reposition: ON')
            : t('approveBoxFlow.actions.autoRepositionOff', 'Auto Reposition: OFF')
        }
        placement='left'
      >
        <AutoRepositionButton>
          <AimOutlined />
          <span>
            {autoReposition
              ? t('approveBoxFlow.actions.autoReposition', 'Auto Reposition')
              : t('approveBoxFlow.actions.manualPosition', 'Manual Position')}
          </span>
          <Switch checked={autoReposition} onChange={setAutoReposition} size='small' />
        </AutoRepositionButton>
      </Tooltip>

      <Tooltip title={t('approveBoxFlow.actions.recalculateLayout', 'Recalculate Layout')} placement='left'>
        <RecalculateButton type='default' icon={<ReloadOutlined />} onClick={handleRecalculatePositions} size='large' />
      </Tooltip>

      <Popover
        content={
          <div onClick={() => setIsAddNodePopoverOpen(false)}>
            <ApproveBoxActions
              id='standalone'
              isStandalone={true}
              actionsFilter={[
                ApprovalHeaderType.APPROVER,
                ApprovalHeaderType.CC_TO,
                ApprovalHeaderType.PROCESSING,
                ApprovalHeaderType.REVISE,
                ApprovalHeaderType.INTEGRATION,
                ApprovalHeaderType.END
              ]}
            />
          </div>
        }
        title={t('approveBoxFlow.actions.addNode')}
        trigger='click'
        open={isAddNodePopoverOpen}
        onOpenChange={setIsAddNodePopoverOpen}
        placement='bottomRight'
      >
        <AddNodeButton type='primary' icon={<PlusOutlined />} size='large' />
      </Popover>

      <ReactFlow
        key={`${approvalFlow.name}-${approvalFlow.start_step_id}-${approvalFlow.steps.length}`}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={onPaneClick}
        nodesDraggable={true}
        fitView={shouldFitView}
        fitViewOptions={{ padding: 1 }}
      >
        <Controls />
      </ReactFlow>

      <ImportFlowJsonModal
        open={isImportOpen}
        onCancel={() => setIsImportOpen(false)}
        onApply={setApprovalFlow}
        mapOptions={importMapOptions}
        initialText={initialImportText}
      />
      <ExportFlowJsonModal
        open={isExportOpen}
        onCancel={() => setIsExportOpen(false)}
        flow={approvalFlow}
        fileName={exportFileName}
      />
    </FlowCanvasContainer>
  );
};
