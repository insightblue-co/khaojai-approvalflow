import { ApprovalHeaderType } from '../interface';

import requesterRaw from '../../assets/approval/requester.svg';
import approverRaw from '../../assets/approval/approver.svg';
import ccToRaw from '../../assets/approval/cc_to.svg';
import processingRaw from '../../assets/approval/processing.svg';
import reviseRaw from '../../assets/approval/revise.svg';
import conditionRaw from '../../assets/approval/condition.svg';
import nextApprovalRaw from '../../assets/approval/next_approval.svg';
import endRaw from '../../assets/approval/end.svg';
import integrationRaw from '../../assets/approval/integration.svg';

/** RFC 2397-safe data URL for inline SVG (avoids broken `<img src>` with raw `data:image/svg+xml,<svg...`). */
function svgToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

const requester = svgToDataUrl(requesterRaw);
const approver = svgToDataUrl(approverRaw);
const ccTo = svgToDataUrl(ccToRaw);
const processing = svgToDataUrl(processingRaw);
const revise = svgToDataUrl(reviseRaw);
const condition = svgToDataUrl(conditionRaw);
const nextApproval = svgToDataUrl(nextApprovalRaw);
const end = svgToDataUrl(endRaw);
const integration = svgToDataUrl(integrationRaw);

export const getHeaderTypeByString = (headerType: string) => {
  if (headerType.match(/^submit\d*$/)) {
    return ApprovalHeaderType.SUBMIT;
  }
  if (headerType.match(/^check\d*$/)) {
    return ApprovalHeaderType.APPROVER;
  }
  if (headerType.match(/^approve\d*$/)) {
    return ApprovalHeaderType.CC_TO;
  }
  if (headerType.match(/^approved\d*$/)) {
    return ApprovalHeaderType.PROCESSING;
  }
  if (headerType.match(/^revise\d*$/)) {
    return ApprovalHeaderType.REVISE;
  }
  if (headerType.match(/^condition\d*$/)) {
    return ApprovalHeaderType.CONDITION;
  }
  if (headerType.match(/^next\d*$/)) {
    return ApprovalHeaderType.NEXT_APPROVAL;
  }
  if (headerType.match(/^end\d*$/)) {
    return ApprovalHeaderType.END;
  }
  if (headerType.match(/^integration\d*$/)) {
    return ApprovalHeaderType.INTEGRATION;
  }
  return ApprovalHeaderType.NOT_IMPLEMENTED;
};

export const getImagePathByHeaderType = (headerType: ApprovalHeaderType): string => {
  switch (headerType) {
    case ApprovalHeaderType.SUBMIT:
      return requester;
    case ApprovalHeaderType.APPROVER:
      return approver;
    case ApprovalHeaderType.CC_TO:
      return ccTo;
    case ApprovalHeaderType.PROCESSING:
      return processing;
    case ApprovalHeaderType.REVISE:
      return revise;
    case ApprovalHeaderType.CONDITION:
      return condition;
    case ApprovalHeaderType.NEXT_APPROVAL:
      return nextApproval;
    case ApprovalHeaderType.END:
      return end;
    case ApprovalHeaderType.INTEGRATION:
      return integration;
    default:
      return requester;
  }
};

export const getTextByHeaderType = (headerType: ApprovalHeaderType) => {
  switch (headerType) {
    case ApprovalHeaderType.SUBMIT:
      return 'submit';
    case ApprovalHeaderType.APPROVER:
      return 'approver';
    case ApprovalHeaderType.CC_TO:
      return 'cc_to';
    case ApprovalHeaderType.PROCESSING:
      return 'processing';
    case ApprovalHeaderType.REVISE:
      return 'revise';
    case ApprovalHeaderType.CONDITION:
      return 'condition';
    case ApprovalHeaderType.NEXT_APPROVAL:
      return 'next_approval';
    case ApprovalHeaderType.END:
      return 'end';
    case ApprovalHeaderType.INTEGRATION:
      return 'integration';
    default:
      return 'Not implemented';
  }
};
