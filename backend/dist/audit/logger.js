"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
exports.verifyAuditChain = verifyAuditChain;
const database_1 = require("../db/database");
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
/**
 * Writes a new entry to the audit log, chaining it to the previous entry's hash.
 */
async function writeAuditLog(actorId, entityType, entityId, action, field, oldValue, newValue) {
    const db = await (0, database_1.getDb)();
    // Get the latest log entry to fetch its hash as prev_hash
    const latestLog = await db.get('SELECT record_hash FROM audit_logs ORDER BY created_at DESC, audit_id DESC LIMIT 1');
    const prevHash = latestLog ? latestLog.record_hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const auditId = (0, uuid_1.v4)();
    const createdAt = new Date().toISOString();
    // Calculate the SHA-256 hash
    // Payload formula: prev_hash + actor_id + entity_type + entity_id + action + field + old_value + new_value + timestamp
    const payload = prevHash + actorId + entityType + entityId + action + (field || '') + (oldValue || '') + (newValue || '') + createdAt;
    const recordHash = crypto.createHash('sha256').update(payload).digest('hex');
    await db.run(`INSERT INTO audit_logs (
      audit_id, actor_id, entity_type, entity_id, action, field, old_value, new_value, prev_hash, record_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
    ]);
    return auditId;
}
/**
 * Validates the entire audit log hash chain to ensure no tampering has occurred.
 */
async function verifyAuditChain() {
    const db = await (0, database_1.getDb)();
    // Fetch in ascending order to reconstruct the chain from the beginning
    const records = await db.all('SELECT * FROM audit_logs ORDER BY created_at ASC, audit_id ASC');
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
