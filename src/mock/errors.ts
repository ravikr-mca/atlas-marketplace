// Typed API errors, mirroring the HTTP semantics the real Laravel API would use so the
// client's error handling (401 -> sign in again, 403 -> explain, 409/422 -> inline) is
// written once against the same codes it will see in production.
export type ApiErrorCode =
  | 'UNAUTHENTICATED' // 401 — no session
  | 'SESSION_EXPIRED' // 401 — session existed but idled out
  | 'INVALID_CREDENTIALS' // 401
  | 'ACCOUNT_LOCKED' // 423
  | 'SSO_REQUIRED' // 403 — staff must sign in through Entra ID, not a password
  | 'FORBIDDEN' // 403 — role/ownership
  | 'NOT_ACCREDITED' // 403 — organization not VERIFIED
  | 'NOT_FOUND' // 404
  | 'ILLEGAL_TRANSITION' // 409
  | 'FUND_NOT_OPEN' // 409
  | 'DUPLICATE_ACTIVE' // 409
  | 'VALIDATION'; // 422

const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_LOCKED: 423,
  SSO_REQUIRED: 403,
  FORBIDDEN: 403,
  NOT_ACCREDITED: 403,
  NOT_FOUND: 404,
  ILLEGAL_TRANSITION: 409,
  FUND_NOT_OPEN: 409,
  DUPLICATE_ACTIVE: 409,
  VALIDATION: 422,
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
