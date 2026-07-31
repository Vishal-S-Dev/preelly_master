/**
 * Chat offer + Preelly inspection handshake helpers.
 * Mirrors Preelly web ChatInboxPage message conventions (plain-text protocol).
 */

export const OFFER_RE = /^💰\s*Offer:\s*AED\s*([\d,.]+)/i;
export const ACCEPT_RE = /^✅\s*Offer accepted(?:\s+for\s+AED\s*([\d,.]+))?/i;
export const REJECT_RE = /^❌\s*Offer rejected/i;

export const PREELLY_REQ_RE = /^🔍\s*Preelly Inspection Conditions/i;
export const PREELLY_APPROVE_RE = /^✅\s*Preelly Inspection Approved/i;
export const PREELLY_REJECT_RE = /^❌\s*Preelly Inspection Rejected/i;

export const PREELLY_REQ_HEADER = '🔍 Preelly Inspection Conditions';
export const PREELLY_APPROVE_MSG = '✅ Preelly Inspection Approved';
export const PREELLY_REJECT_MSG = '❌ Preelly Inspection Rejected';

export function parseOfferAmount(text?: string | null): { raw: string; value: number } | null {
  const match = OFFER_RE.exec(String(text ?? '').trim());
  if (!match) {
    return null;
  }
  const raw = match[1];
  const value = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return { raw, value };
}

export function parseOfferAccepted(text?: string | null): { amount: number | null; label: string | null } | null {
  const trimmed = String(text ?? '').trim();
  if (!ACCEPT_RE.test(trimmed)) {
    return null;
  }
  const match = /AED\s*([\d,.]+)/i.exec(trimmed);
  if (!match) {
    return { amount: null, label: null };
  }
  const label = match[1];
  const value = Number(String(label).replace(/,/g, ''));
  return {
    amount: Number.isFinite(value) && value > 0 ? value : null,
    label,
  };
}

export function isAcceptMessage(text?: string | null): boolean {
  return ACCEPT_RE.test(String(text ?? '').trim());
}

export function isRejectMessage(text?: string | null): boolean {
  return REJECT_RE.test(String(text ?? '').trim());
}

export function isOfferAction(text?: string | null): boolean {
  return Boolean(parseOfferAmount(text)) || isAcceptMessage(text) || isRejectMessage(text);
}

export function isPreellyRequest(text?: string | null): boolean {
  return PREELLY_REQ_RE.test(String(text ?? '').trim());
}

export function isPreellyApprove(text?: string | null): boolean {
  return PREELLY_APPROVE_RE.test(String(text ?? '').trim());
}

export function isPreellyReject(text?: string | null): boolean {
  return PREELLY_REJECT_RE.test(String(text ?? '').trim());
}

export function isPreellyResponse(text?: string | null): boolean {
  return isPreellyApprove(text) || isPreellyReject(text);
}

export function buildOfferMessage(amount: number): string {
  return `💰 Offer: AED ${amount.toLocaleString('en-US')}`;
}

export function buildOfferAcceptedMessage(amount: number): string {
  return `✅ Offer accepted for AED ${amount.toLocaleString('en-US')}`;
}

export function buildPreellyRequestText(conditions: string[], comment?: string): string {
  let text = PREELLY_REQ_HEADER;
  for (const c of conditions) {
    text += `\n• ${c}`;
  }
  if (comment?.trim()) {
    text += `\nComment: ${comment.trim()}`;
  }
  return text;
}

export function parsePreellyRequest(text?: string | null): {
  conditions: string[];
  comment: string;
} {
  const lines = String(text ?? '').split('\n');
  const conditions = lines
    .filter(l => l.trim().startsWith('•'))
    .map(l => l.replace(/^\s*•\s*/, '').trim())
    .filter(Boolean);
  const commentLine = lines.find(l => /^\s*comment:/i.test(l));
  const comment = commentLine ? commentLine.replace(/^\s*comment:\s*/i, '').trim() : '';
  return { conditions, comment };
}

/**
 * An offer is locked once any later offer / accept / reject exists in the thread.
 * Derived purely from message order so it survives refresh (matches web).
 */
export function computeLockedOfferIds(
  messages: Array<{ id: string; text?: string | null; type?: string }>,
): Set<string> {
  const set = new Set<string>();
  messages.forEach((m, i) => {
    if (m.type === 'call') {
      return;
    }
    if (!parseOfferAmount(m.text)) {
      return;
    }
    if (messages.slice(i + 1).some(mm => mm.type !== 'call' && isOfferAction(mm.text))) {
      set.add(m.id);
    }
  });
  return set;
}

export type PreellyRequestStatus = 'approved' | 'rejected';

/**
 * Status for each Preelly request = first approve/reject response after it.
 */
export function computePreellyStatusById(
  messages: Array<{ id: string; text?: string | null; type?: string }>,
): Map<string, PreellyRequestStatus> {
  const map = new Map<string, PreellyRequestStatus>();
  messages.forEach((m, i) => {
    if (m.type === 'call' || !isPreellyRequest(m.text)) {
      return;
    }
    const resp = messages.slice(i + 1).find(mm => mm.type !== 'call' && isPreellyResponse(mm.text));
    if (resp) {
      map.set(m.id, isPreellyApprove(resp.text) ? 'approved' : 'rejected');
    }
  });
  return map;
}

export function derivePreellyConditions(product: {
  features?: Array<{ values?: string[] } | null> | null;
  productMultiAttributes?: Array<{
    fieldKey?: string;
    fieldValues?: string[];
  } | null> | null;
} | null | undefined): string[] {
  const values: string[] = [];

  const multiAttrs = Array.isArray(product?.productMultiAttributes)
    ? product.productMultiAttributes
    : [];
  for (const attr of multiAttrs) {
    if (attr?.fieldKey === 'categoryPath') {
      continue;
    }
    if (Array.isArray(attr?.fieldValues)) {
      values.push(...attr.fieldValues);
    }
  }

  const groups = Array.isArray(product?.features) ? product.features : [];
  for (const group of groups) {
    if (Array.isArray(group?.values)) {
      values.push(...group.values);
    }
  }

  return [...new Set(values.map(v => String(v).trim()).filter(Boolean))];
}
