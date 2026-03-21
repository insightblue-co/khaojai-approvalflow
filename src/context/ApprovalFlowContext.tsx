import { approvalFlow_1 } from '../components/approvalData/flow-1';
import { ApprovalFlowData } from '../components/interface';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppState {
  flow: ApprovalFlowData;
  setFlow: (flow: ApprovalFlowData) => void;
}

const ApprovalFlowContext = createContext<AppState | undefined>(undefined);

export const ApprovalFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flow, setFlow] = useState<ApprovalFlowData>(approvalFlow_1);

  return <ApprovalFlowContext.Provider value={{ flow, setFlow }}>{children}</ApprovalFlowContext.Provider>;
};

export const useApprovalFlowContext = () => {
  const context = useContext(ApprovalFlowContext);
  if (!context) {
    throw new Error('useApprovalFlowContext must be used within an ApprovalFlowProvider');
  }
  return context;
};
