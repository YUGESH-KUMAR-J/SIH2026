"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFhirPatient = getFhirPatient;
exports.getFhirResearchStudy = getFhirResearchStudy;
exports.getFhirAdverseEvent = getFhirAdverseEvent;
const database_1 = require("../db/database");
async function getFhirPatient(subjectId) {
    const db = await (0, database_1.getDb)();
    const subject = await db.get(`SELECT s.*, o.name as org_name, o.org_id
     FROM subjects s
     JOIN sites si ON si.site_id = s.site_id
     JOIN studies st ON st.study_id = si.study_id
     JOIN organizations o ON o.org_id = st.org_id
     WHERE s.subject_id = ?`, [subjectId]);
    if (!subject)
        return null;
    return {
        resourceType: 'Patient',
        id: subject.subject_id,
        active: subject.enrollment_status !== 'Withdrawn',
        name: [
            {
                use: 'anonymous',
                text: `De-identified Subject ${subject.subject_id}`,
            },
        ],
        gender: 'unknown',
        birthDate: null,
        extension: [
            {
                url: 'http://hl7.org/fhir/StructureDefinition/patient-enrollmentDate',
                valueDateTime: subject.enrollment_date,
            },
            {
                url: 'http://aiia.gov.in/StructureDefinition/ayurveda-dosha-profile',
                valueString: subject.dosha_profile || 'Not assessed',
            },
        ],
        managingOrganization: {
            reference: `Organization/${subject.org_id}`,
            display: subject.org_name,
        },
    };
}
async function getFhirResearchStudy(studyId) {
    const db = await (0, database_1.getDb)();
    const study = await db.get('SELECT * FROM studies WHERE study_id = ?', [studyId]);
    if (!study)
        return null;
    return {
        resourceType: 'ResearchStudy',
        id: study.study_id,
        title: study.title,
        status: study.status === 'Active' ? 'active' : study.status === 'Closed' ? 'completed' : 'draft',
        identifier: study.ctri_reg_number
            ? [
                {
                    use: 'official',
                    system: 'http://ctri.nic.in',
                    value: study.ctri_reg_number,
                },
            ]
            : [],
        phase: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
                    code: study.phase.toLowerCase(),
                    display: study.phase,
                },
            ],
        },
        category: [
            {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                        code: 'RCT',
                        display: 'Randomized Controlled Trial',
                    },
                ],
            },
        ],
        focus: [
            {
                coding: [
                    {
                        system: 'http://snomed.info/sct',
                        code: 'clinical-research',
                        display: study.therapeutic_area,
                    },
                ],
            },
        ],
        period: {
            start: study.start_date,
            end: study.end_date,
        },
    };
}
async function getFhirAdverseEvent(aeId) {
    const db = await (0, database_1.getDb)();
    const ae = await db.get('SELECT * FROM ae_events WHERE ae_id = ?', [aeId]);
    if (!ae)
        return null;
    return {
        resourceType: 'AdverseEvent',
        id: ae.ae_id,
        actuality: 'actual',
        category: [
            {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/adverse-event-category',
                        code: ae.event_type.toLowerCase(),
                        display: ae.event_type === 'SAE' ? 'Serious Adverse Event' : 'Adverse Event',
                    },
                ],
            },
        ],
        subject: {
            reference: `Patient/${ae.subject_id}`,
        },
        study: {
            reference: `ResearchStudy/${ae.study_id}`,
        },
        date: ae.onset_datetime,
        severity: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/adverse-event-severity',
                    code: ae.severity.toLowerCase(),
                    display: ae.severity,
                },
            ],
        },
        outcome: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/adverse-event-outcome',
                    code: ae.status.toLowerCase(),
                    display: ae.status,
                },
            ],
        },
        recorder: {
            reference: `Practitioner/${ae.reported_by}`,
        },
        suspectedEntity: [
            {
                instance: {
                    display: `Causality: ${ae.causality}`,
                },
            },
        ],
        description: ae.description,
    };
}
