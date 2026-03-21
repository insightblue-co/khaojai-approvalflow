import { Step } from '../interface';

/**
 * Find all possible paths from start step to any END step
 */
export const findAllPaths = (
  startId: string, 
  stepsMap: Map<string, Step>, 
  visited: Set<string> = new Set()
): string[][] => {
  if (visited.has(startId)) return [];
  
  const step = stepsMap.get(startId);
  if (!step) return [];
  
  // If this is an END step, return the path
  if (step.step_type === 'END') {
    return [[startId]];
  }
  
  // If no nexts, this is a dead end
  if (!step.nexts || step.nexts.length === 0) {
    return [];
  }
  
  const newVisited = new Set([...visited, startId]);
  const allPaths: string[][] = [];
  
  step.nexts.forEach(next => {
    const pathsFromNext = findAllPaths(next.step_id, stepsMap, newVisited);
    pathsFromNext.forEach(path => {
      allPaths.push([startId, ...path]);
    });
  });
  
  return allPaths;
};

/**
 * Find the longest path from all possible paths
 */
export const findLongestPath = (allPaths: string[][]): string[] => {
  return allPaths.reduce((longest, current) => 
    current.length > longest.length ? current : longest, []
  );
};

/**
 * Group remaining steps by their level (distance from start)
 */
export const groupStepsByLevel = (
  remainingSteps: Step[], 
  allPaths: string[][]
): Map<number, Step[]> => {
  const stepLevels = new Map<number, Step[]>();
  
  remainingSteps.forEach(step => {
    // Find the shortest path to this step to determine its level
    const pathsToStep = allPaths.filter(path => path.includes(step.step_id));
    if (pathsToStep.length > 0) {
      const shortestPath = pathsToStep.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
      );
      const level = shortestPath.indexOf(step.step_id);
      
      if (!stepLevels.has(level)) {
        stepLevels.set(level, []);
      }
      stepLevels.get(level)!.push(step);
    }
  });
  
  return stepLevels;
};

/**
 * Calculate position for side steps (alternating left and right)
 */
export const calculateSideStepPosition = (
  index: number,
  stepWidth: number,
  centerX: number,
  defaultWidth: number,
  horizontalSpacing: number,
  leftX: number,
  rightX: number
): { x: number, newLeftX: number, newRightX: number } => {
  let x: number;
  let newLeftX = leftX;
  let newRightX = rightX;
  
  // Alternate between left and right
  if (index % 2 === 0) {
    x = leftX - stepWidth;
    newLeftX = x - horizontalSpacing;
  } else {
    x = rightX;
    newRightX = x + stepWidth + horizontalSpacing;
  }
  
  return { x, newLeftX, newRightX };
};

/**
 * Find edge label from action buttons based on conditions
 */
export const findEdgeLabel = (
  step: Step,
  next: { step_id: string, condition_groups?: any[] | null }
): string => {
  let edgeLabel = '';
  
  if (step.action_buttons && next.condition_groups) {
    const actionConditions = next.condition_groups
      .flatMap(group => group.conditions)
      .filter(condition => condition.field === "request.step.action");
    
    if (actionConditions.length > 0) {
      const matchingButtons = step.action_buttons.filter(button =>
        actionConditions.some(condition => condition.value === button.value)
      );
      
      if (matchingButtons.length > 0) {
        edgeLabel = matchingButtons.map(btn => btn.display_name).join(' / ');
      }
    }
  }
  
  return edgeLabel;
};
