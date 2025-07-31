export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  userUrn?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private logs: AuditLogEntry[] = [];

  log(action: string, details: Record<string, any>, userId?: string, userUrn?: string, ipAddress?: string, userAgent?: string) {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      userId,
      userUrn,
      details,
      ipAddress,
      userAgent,
    };

    this.logs.push(entry);
  }

  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  getLogsByAction(action: string): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  getAllLogs(): AuditLogEntry[] {
    return [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLogs(limit?: number) {
    const sorted = this.getAllLogs();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  getLogsInTimeRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  // Actions constants for consistency
  static readonly ACTIONS = {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
    VOTE_SUBMITTED: 'VOTE_SUBMITTED',
    VOTE_ATTEMPT_DUPLICATE: 'VOTE_ATTEMPT_DUPLICATE',
    RESULTS_VIEWED: 'RESULTS_VIEWED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    
    // Admin actions
    ADMIN_ADD_STUDENT: 'ADMIN_ADD_STUDENT',
    ADMIN_BULK_ADD_STUDENTS: 'ADMIN_BULK_ADD_STUDENTS',
    ADMIN_DELETE_STUDENT: 'ADMIN_DELETE_STUDENT',
    ADMIN_EDIT_STUDENT: 'ADMIN_EDIT_STUDENT',
  } as const;
}

export const auditLogger = new AuditLogger();
