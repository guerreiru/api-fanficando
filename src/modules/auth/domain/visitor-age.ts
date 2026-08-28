import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  VISITOR_AGE_ACK_DEFAULT_MAX_AGE_MS,
  VISITOR_AGE_ACK_VERSION,
  VISITOR_AGE_INPUTS,
} from './auth.constants';

export type VisitorAgeAckPayload = {
  v: number;
  tiers: number[];
  exp: number;
};

export function resolveVisitorAckTierFromInput(
  requiredAge: number,
): 16 | 18 | null {
  if (requiredAge === 18) {
    return 18;
  }
  if (requiredAge === 16 || requiredAge === 14 || requiredAge === 12) {
    return 16;
  }
  return null;
}

export function isVisitorAgeInput(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    VISITOR_AGE_INPUTS.includes(value as (typeof VISITOR_AGE_INPUTS)[number])
  );
}

export function signVisitorAgeAck(
  payload: VisitorAgeAckPayload,
  secret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  const signature = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function parseVisitorAgeAckTiers(
  rawValue: string | undefined,
  secret: string,
): number[] {
  if (!rawValue) {
    return [];
  }

  const separatorIndex = rawValue.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return [];
  }

  const encoded = rawValue.slice(0, separatorIndex);
  const signature = rawValue.slice(separatorIndex + 1);
  const expectedSignature = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return [];
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Partial<VisitorAgeAckPayload>;
    if (payload?.v !== VISITOR_AGE_ACK_VERSION) {
      return [];
    }
    if (!Number.isFinite(payload.exp) || Number(payload.exp) < Date.now()) {
      return [];
    }

    return Array.isArray(payload.tiers)
      ? payload.tiers.filter((tier) => tier === 16 || tier === 18)
      : [];
  } catch {
    return [];
  }
}

export function buildVisitorAgeAckCookieValue(
  existingTiers: Iterable<number>,
  tier: 16 | 18,
  secret: string,
  maxAgeMs = VISITOR_AGE_ACK_DEFAULT_MAX_AGE_MS,
): { value: string; tiers: number[] } {
  const tiers = [
    ...new Set(
      [...existingTiers, tier].filter((item) => item === 16 || item === 18),
    ),
  ].sort((left, right) => left - right);

  return {
    tiers,
    value: signVisitorAgeAck(
      {
        v: VISITOR_AGE_ACK_VERSION,
        tiers,
        exp: Date.now() + maxAgeMs,
      },
      secret,
    ),
  };
}
