export interface AuthTokenPayload {
  sub: string; // userId
  tenantId: string;
  tenantSlug: string;
  roleKey: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}
