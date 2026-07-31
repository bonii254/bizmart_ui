export interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
}

export type AuditLogEntry = LoginLog | ChangeLog;

interface BaseLog {
  timestamp: string;
}

export interface LoginLog extends BaseLog {
  email: string;
  event: "LOGIN_SUCCESS" | "LOGIN_FAIL";
  ip: string;
  path: string;
  status: "success" | "failed";
  user_agent: string;
  user_id?: string;
}

export interface ChangeLog extends BaseLog {
  action: "UPDATE" | "CREATE" | "DELETE";
  actor_id: string;
  target_name: string;
  actor_name?: string;
  entity: string;
  target_id: string;
  changes: Record<string, { before: any; after: any }>;
}