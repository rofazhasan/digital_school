import db from '@/lib/db';

export interface AuditLogParams {
  arenaId: string;
  studentProfileId: string;
  action: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logArenaAction(params: AuditLogParams) {
  try {
    return await db.arenaAuditLog.create({
      data: {
        arenaId: params.arenaId,
        studentProfileId: params.studentProfileId,
        action: params.action,
        fieldName: params.fieldName ?? null,
        oldValue: params.oldValue ? String(params.oldValue) : null,
        newValue: params.newValue ? String(params.newValue) : null,
        reason: params.reason ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err);
    return null;
  }
}
