"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./db/database");
const engine_1 = require("./rules/engine");
const logger_1 = require("./audit/logger");
async function runTests() {
    console.log('--- STARTING AIIA-CTMS BACKEND TESTS ---');
    try {
        // 1. Initialize DB
        await (0, database_1.initDb)();
        console.log('✔ Database initialized and seeded.');
        // 2. Test Rules Engine deadline calculation
        const onsetStr = '2026-08-26T12:00:00.000Z';
        const saeDeadline = await (0, engine_1.calculateDeadline)('SAE', onsetStr);
        const expectedSaeDeadline = new Date(onsetStr);
        expectedSaeDeadline.setHours(expectedSaeDeadline.getHours() + 24);
        if (new Date(saeDeadline).getTime() === expectedSaeDeadline.getTime()) {
            console.log('✔ Rules Engine: SAE deadline offset (24h) calculated correctly.');
        }
        else {
            throw new Error(`Rules Engine failed: Expected ${expectedSaeDeadline.toISOString()}, got ${saeDeadline}`);
        }
        const aeDeadline = await (0, engine_1.calculateDeadline)('AE', onsetStr);
        const expectedAeDeadline = new Date(onsetStr);
        expectedAeDeadline.setHours(expectedAeDeadline.getHours() + 168);
        if (new Date(aeDeadline).getTime() === expectedAeDeadline.getTime()) {
            console.log('✔ Rules Engine: AE deadline offset (168h) calculated correctly.');
        }
        else {
            throw new Error(`Rules Engine failed: Expected ${expectedAeDeadline.toISOString()}, got ${aeDeadline}`);
        }
        // 3. Test Audit Logger Chain Verification
        const db = await (0, database_1.getDb)();
        const cleanVerification = await (0, logger_1.verifyAuditChain)();
        if (cleanVerification.verified) {
            console.log(`✔ Audit Logger: Chain verified. Checked ${cleanVerification.totalRecordsCount} records.`);
        }
        else {
            throw new Error(`Audit Logger failed on clean chain: ${cleanVerification.errorMsg}`);
        }
        // 4. Test Tamper Detection
        console.log('Testing tamper detection...');
        const auditId = await (0, logger_1.writeAuditLog)('u_pi', 'Subject', 'SUB-TEST-99', 'UPDATE', 'enrollment_status', 'Screened', 'Randomized');
        const postLogVerification = await (0, logger_1.verifyAuditChain)();
        if (!postLogVerification.verified) {
            throw new Error(`Audit Logger failed after new write: ${postLogVerification.errorMsg}`);
        }
        // Manual database tampering injection
        await db.run("UPDATE audit_logs SET new_value = 'TAMPERED_STATUS_DATA' WHERE audit_id = ?", [auditId]);
        const tamperedVerification = await (0, logger_1.verifyAuditChain)();
        if (!tamperedVerification.verified) {
            console.log(`✔ Audit Logger: Tampering successfully detected! Message: "${tamperedVerification.errorMsg}"`);
        }
        else {
            throw new Error('Audit Logger failed: Tampering was not detected by verification engine!');
        }
        // Restore database state for subsequent runs
        await db.run('DELETE FROM audit_logs WHERE audit_id = ?', [auditId]);
        console.log('✔ Database state restored.');
        console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY ---');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ TEST FAILURE:', err.message);
        process.exit(1);
    }
}
runTests();
