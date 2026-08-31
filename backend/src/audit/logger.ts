import { getDb } from '../db/database';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  audit_id: string;
  actor_id: string;
  actor_name?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  prev_hash: string;
  record_hash: string;
  created_at: string;
}

/**
 * Writes a new entry to the audit log, chaining it to the previous entry's hash.
 */
export async function writeAuditLog(
  actorId: string,
  entityType: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  field: string | null,
  oldValue: string | null,
  newValue: string | null
): Promise<string> {
  const db = await getDb();

  // Get the latest log entry to fetch its hash as prev_hash
  const latestLog = await db.get(
    'SELECT record_hash FROM audit_logs ORDER BY created_at DESC, audit_id DESC LIMIT 1'
  );

  const prevHash = latestLog ? (latestLog as any).record_hash : '0000000000000000000000000000000000000000000000000000000000000000';
  const auditId = uuidv4();
  const createdAt = new Date().toISOString();

  // Calculate the SHA-256 hash
  // Payload formula: prev_hash + actor_id + entity_type + entity_id + action + field + old_value + new_value + timestamp
  const payload = prevHash + actorId + entityType + entityId + action + (field || '') + (oldValue || '') + (newValue || '') + createdAt;
  const recordHash = crypto.createHash('sha256').update(payload).digest('hex');

  await db.run(
    `INSERT INTO audit_logs (
      audit_id, actor_id, entity_type, entity_id, action, field, old_value, new_value, prev_hash, record_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      actorId,
      entityType,
      entityId,
      action,
      field,
      oldValue,
      newValue,
      prevHash,
      recordHash,
      createdAt
    ]
  );

  return auditId;
}

/**
 * Validates the entire audit log hash chain to ensure no tampering has occurred.
 */
export async function verifyAuditChain(): Promise<{
  verified: boolean;
  brokenIndex: number | null;
  errorMsg: string;
  totalRecordsCount: number;
}> {
  const db = await getDb();
  // Fetch in ascending order to reconstruct the chain from the beginning
  const records = await db.all<AuditLogEntry[]>(
    'SELECT * FROM audit_logs ORDER BY created_at ASC, audit_id ASC'
  );

  let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Check 1: Verify that this record's prev_hash matches the prior record's record_hash
    if (record.prev_hash !== expectedPrevHash) {
      return {
        verified: false,
        brokenIndex: i,
        errorMsg: `Hash link broken at index ${i} (ID: ${record.audit_id}). Prev hash was expected to be ${expectedPrevHash} but found ${record.prev_hash}`,
        totalRecordsCount: records.length,
      };
    }

    // Check 2: Recompute the SHA-256 hash of this record to verify it hasn't been modified
    const payload = record.prev_hash + record.actor_id + record.entity_type + record.entity_id + record.action + (record.field || '') + (record.old_value || '') + (record.new_value || '') + record.created_at;
    const computedHash = crypto.createHash('sha256').update(payload).digest('hex');

    if (record.record_hash !== computedHash) {
      return {
        verified: false,
        brokenIndex: i,
        errorMsg: `Content mismatch at index ${i} (ID: ${record.audit_id}). Stored hash: ${record.record_hash}, Computed: ${computedHash}`,
        totalRecordsCount: records.length,
      };
    }

    // The current record's hash is the expected prev_hash for the next record
    expectedPrevHash = record.record_hash;
  }

  return {
    verified: true,
    brokenIndex: null,
    errorMsg: '',
    totalRecordsCount: records.length,
  };
}
