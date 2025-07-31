export class AuditLogger {
    logs = [];
    log(action, details, userId, userUrn, ipAddress, userAgent) {
        const entry = {
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
    getLogsByUser(userId) {
        return this.logs.filter(log => log.userId === userId);
    }
    getLogsByAction(action) {
        return this.logs.filter(log => log.action === action);
    }
    getAllLogs() {
        return [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getLogs(limit) {
        const sorted = this.getAllLogs();
        return limit ? sorted.slice(0, limit) : sorted;
    }
    getLogsInTimeRange(startDate, endDate) {
        return this.logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
    }
    // Actions constants for consistency
    static ACTIONS = {
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
    };
}
export const auditLogger = new AuditLogger();
//# sourceMappingURL=audit-logger.js.map