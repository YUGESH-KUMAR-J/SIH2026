"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDeadline = calculateDeadline;
exports.checkDeadlinesAndEscalate = checkDeadlinesAndEscalate;
const database_1 = require("../db/database");
const logger_1 = require("../audit/logger");
const uuid_1 = require("uuid");
/**
 * Calculates the deadline for a safety event based on its type and rules in the database.
 */
async function calculateDeadline(eventType, onsetDatetimeStr) {
    const db = await (0, database_1.getDb)();
    const rule = await db.get('SELECT deadline_offset_hours FROM deadline_rules WHERE event_type = ? AND active = 1 LIMIT 1', [eventType]);
    const offsetHours = rule ? rule.deadline_offset_hours : 24; // Default 24h for SAE, 168h for AE
    const onsetDate = new Date(onsetDatetimeStr);
    onsetDate.setHours(onsetDate.getHours() + offsetHours);
    return onsetDate.toISOString();
}
/**
 * Inspects all open safety events and triggers escalations if they pass thresholds.
 */
async function checkDeadlinesAndEscalate() {
    const db = await (0, database_1.getDb)();
    // Find all open events (AE or SAE)
    const openEvents = await db.all(`SELECT ae.*, dr.deadline_offset_hours, dr.escalation_thresholds_pct, dr.escalation_chain
     FROM ae_events ae
     JOIN deadline_rules dr ON dr.event_type = ae.event_type AND dr.active = 1
     WHERE ae.status = 'Open'`);
    const now = new Date();
    for (const event of openEvents) {
        const onsetTime = new Date(event.onset_datetime).getTime();
        const deadlineTime = new Date(event.report_deadline).getTime();
        const totalDurationMs = deadlineTime - onsetTime;
        const timeElapsedMs = now.getTime() - onsetTime;
        const elapsedPct = (timeElapsedMs / totalDurationMs) * 100;
        // Parse rules
        const thresholds = JSON.parse(event.escalation_thresholds_pct); // e.g. [50, 80, 100]
        const chain = JSON.parse(event.escalation_chain); // e.g. ["PI", "IEC", "Sponsor", "NPvCC"]
        let targetLevel = 0;
        for (let i = 0; i < thresholds.length; i++) {
            if (elapsedPct >= thresholds[i]) {
                targetLevel = i + 1; // 50% -> Level 1, 80% -> Level 2, 100% -> Level 3
            }
        }
        // If target escalation level is higher than current level, perform escalation
        if (targetLevel > event.escalation_level) {
            console.log(`Escalating safety event ${event.ae_id} from level ${event.escalation_level} to ${targetLevel}`);
            // Who should be notified at this target level?
            // chain[0] = PI, chain[1] = IEC, chain[2] = Sponsor, chain[3] = NPvCC
            const notifiedRole = chain[targetLevel] || chain[chain.length - 1];
            // Update event escalation level
            let newStatus = event.status;
            if (targetLevel >= thresholds.length) { // Passed 100% threshold
                newStatus = 'Breached';
            }
            // Start transaction or sequential writes
            await db.run('BEGIN TRANSACTION');
            try {
                // Update ae_events
                await db.run('UPDATE ae_events SET escalation_level = ?, status = ? WHERE ae_id = ?', [targetLevel, newStatus, event.ae_id]);
                // Audit log the update
                await (0, logger_1.writeAuditLog)('u_pv', // System / PV Actor ID representing background escalation
                'AE_Event', event.ae_id, 'UPDATE', 'escalation_level', event.escalation_level.toString(), targetLevel.toString());
                if (newStatus === 'Breached') {
                    await (0, logger_1.writeAuditLog)('u_pv', 'AE_Event', event.ae_id, 'UPDATE', 'status', 'Open', 'Breached');
                    // Update compliance score for this trial
                    await db.run(`UPDATE compliance_scores
             SET status = 'Breached', computed_at = ?
             WHERE study_id = ? AND checkpoint = 'SAE Reporting Timeliness'`, [now.toISOString(), event.study_id]);
                }
                // Insert escalation log
                const escalationId = (0, uuid_1.v4)();
                await db.run('INSERT INTO escalation_logs (escalation_id, ae_id, level, notified_role, notified_at, resolved) VALUES (?, ?, ?, ?, ?, 0)', [escalationId, event.ae_id, targetLevel, notifiedRole, now.toISOString()]);
                // Send notifications to all users of the notified role
                const usersToNotify = await db.all(`SELECT u.user_id FROM users u
           JOIN user_roles ur ON ur.user_id = u.user_id
           JOIN roles r ON r.role_id = ur.role_id
           WHERE r.role_name = ?`, [notifiedRole]);
                for (const user of usersToNotify) {
                    const notificationId = (0, uuid_1.v4)();
                    const message = `URGENT safety event notification: Trial safety event ${event.event_type} (${event.severity}) for subject ${event.subject_id} has escalated to Level ${targetLevel} (${notifiedRole}). Time elapsed: ${elapsedPct.toFixed(1)}%.`;
                    await db.run('INSERT INTO notifications (notification_id, user_id, type, message, read, created_at) VALUES (?, ?, ?, ?, 0, ?)', [notificationId, user.user_id, 'Escalation', message, now.toISOString()]);
                }
                await db.run('COMMIT');
            }
            catch (err) {
                await db.run('ROLLBACK');
                console.error(`Failed to execute escalation for event ${event.ae_id}:`, err);
            }
        }
    }
}
