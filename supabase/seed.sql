-- Seed data for prior_auth_clinical_guidelines
-- Three procedures: MRI Lumbar (Scenario A/B anchor), MRI Brain, Knee Arthroscopy.

INSERT INTO prior_auth_clinical_guidelines (
  procedure_code, procedure_name, mbs_item_number, body_region,
  required_clinical_history, red_flag_conditions,
  minimum_conservative_treatment_weeks, evidence_basis,
  approval_criteria, typical_turnaround_days
) VALUES
(
  'MRI-LUMBAR',
  'MRI Lumbar Spine — Non-contrast',
  '63151',
  'Lumbar Spine',
  '[
    {
      "field_id": "duration_of_symptoms_weeks",
      "label": "Duration of symptoms",
      "description": "Documented duration of low back pain or radicular symptoms, expressed in weeks.",
      "minimum_value": 6,
      "unit": "weeks",
      "is_mandatory": true
    },
    {
      "field_id": "physiotherapy_history",
      "label": "Physiotherapy history",
      "description": "Documented course of supervised physiotherapy attempted, including duration, modalities (manual therapy, exercise prescription, etc.) and outcomes.",
      "minimum_duration_weeks": 6,
      "is_mandatory": true
    },
    {
      "field_id": "neurological_examination",
      "label": "Neurological examination findings",
      "description": "Documented neurological exam — power, sensation, reflexes, straight-leg raise — performed within the last 4 weeks.",
      "is_mandatory": true
    },
    {
      "field_id": "pain_scale",
      "label": "Pain score",
      "description": "Current pain rating on a Numeric Pain Rating Scale (0-10) or Visual Analog Scale.",
      "is_mandatory": true
    },
    {
      "field_id": "red_flag_screening",
      "label": "Red flag screening",
      "description": "Explicit screening for cauda equina syndrome, suspected malignancy, infection, fracture, and progressive neurological deficit.",
      "is_mandatory": true
    }
  ]'::jsonb,
  '[
    "cauda_equina_syndrome",
    "suspected_spinal_malignancy",
    "post_trauma_within_4_weeks",
    "progressive_neurological_deficit",
    "suspected_spinal_infection"
  ]'::jsonb,
  6,
  'RACGP Red Book; Choosing Wisely Australia — Imaging for low back pain',
  'Approve when documented conservative management of at least 6 weeks (including supervised physiotherapy) has been completed without resolution, AND a neurological examination has been performed. Any documented red flag condition bypasses the conservative-management requirement and approves immediately.',
  2
),
(
  'MRI-BRAIN',
  'MRI Brain — Non-contrast',
  '63001',
  'Brain',
  '[
    {
      "field_id": "headache_pattern_duration_weeks",
      "label": "Headache pattern and duration",
      "description": "Documented headache pattern (new vs. chronic, frequency, character) and duration in weeks.",
      "is_mandatory": true
    },
    {
      "field_id": "neurological_examination",
      "label": "Neurological examination findings",
      "description": "Documented neurological exam including cranial nerves, fundoscopy, motor and sensory assessment performed within the last 4 weeks.",
      "is_mandatory": true
    },
    {
      "field_id": "red_flag_screening",
      "label": "Red flag screening",
      "description": "Explicit screening for sudden-onset thunderclap headache, new focal neurological deficit, papilloedema, immunocompromise, and systemic symptoms (fever, weight loss).",
      "is_mandatory": true
    },
    {
      "field_id": "prior_imaging",
      "label": "Prior imaging",
      "description": "Any previous CT or MRI of the brain with date and findings.",
      "is_mandatory": false
    }
  ]'::jsonb,
  '[
    "thunderclap_headache",
    "new_focal_neurological_deficit",
    "papilloedema",
    "first_seizure_adult",
    "post_trauma_with_loss_of_consciousness"
  ]'::jsonb,
  NULL,
  'ACR Appropriateness Criteria — Headache; RACGP Headache guidelines',
  'Approve when a documented neurological examination has been performed AND the referral demonstrates clinical features warranting cross-sectional imaging (new neurological deficit, change in chronic headache pattern, or red flag features). Red flag conditions bypass all requirements and approve immediately.',
  2
),
(
  'KNEE-ARTHROSCOPY',
  'Knee Arthroscopy — Diagnostic / Debridement',
  '49557',
  'Knee',
  '[
    {
      "field_id": "duration_of_symptoms_weeks",
      "label": "Duration of symptoms",
      "description": "Documented duration of knee pain or mechanical symptoms in weeks.",
      "minimum_value": 12,
      "unit": "weeks",
      "is_mandatory": true
    },
    {
      "field_id": "conservative_management_history",
      "label": "Conservative management history",
      "description": "Documented course of conservative treatment: physiotherapy, activity modification, NSAIDs, and/or intra-articular injection — with duration and outcomes.",
      "minimum_duration_weeks": 12,
      "is_mandatory": true
    },
    {
      "field_id": "imaging_findings",
      "label": "Imaging findings",
      "description": "Recent knee X-ray AND MRI report findings (e.g., meniscal tear pattern, chondral defect, loose body).",
      "is_mandatory": true
    },
    {
      "field_id": "functional_assessment",
      "label": "Functional assessment",
      "description": "Documented impact on activities of daily living and/or validated score (e.g., KOOS, IKDC, Oxford Knee Score).",
      "is_mandatory": true
    },
    {
      "field_id": "mechanical_symptoms",
      "label": "Mechanical symptoms",
      "description": "Presence/absence of locking, catching, or true mechanical block to motion.",
      "is_mandatory": true
    }
  ]'::jsonb,
  '[
    "locked_knee_mechanical_block",
    "suspected_septic_arthritis",
    "acute_fracture",
    "suspected_acl_pcl_rupture_acute"
  ]'::jsonb,
  12,
  'Australian Orthopaedic Association; Choosing Wisely Australia — Arthroscopy for degenerative knee disease',
  'Approve when at least 12 weeks of documented conservative management has failed, MRI demonstrates a surgically addressable lesion, AND functional impairment is documented. Mechanical block or red flag conditions bypass the conservative-management requirement.',
  5
)
ON CONFLICT (procedure_code) DO UPDATE SET
  procedure_name = EXCLUDED.procedure_name,
  mbs_item_number = EXCLUDED.mbs_item_number,
  body_region = EXCLUDED.body_region,
  required_clinical_history = EXCLUDED.required_clinical_history,
  red_flag_conditions = EXCLUDED.red_flag_conditions,
  minimum_conservative_treatment_weeks = EXCLUDED.minimum_conservative_treatment_weeks,
  evidence_basis = EXCLUDED.evidence_basis,
  approval_criteria = EXCLUDED.approval_criteria,
  typical_turnaround_days = EXCLUDED.typical_turnaround_days;
