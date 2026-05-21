-- Prior Auth Clinical Guidelines
-- Reference table the AI agent calls via Supabase REST connector
-- to retrieve the documentation requirements for a given procedure code.

CREATE TABLE IF NOT EXISTS prior_auth_clinical_guidelines (
  id uuid primary key default gen_random_uuid(),
  procedure_code text not null unique,
  procedure_name text not null,
  mbs_item_number text,
  body_region text,
  required_clinical_history jsonb not null,
  red_flag_conditions jsonb,
  minimum_conservative_treatment_weeks integer,
  evidence_basis text,
  approval_criteria text,
  typical_turnaround_days integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_prior_auth_guidelines_active
  ON prior_auth_clinical_guidelines (procedure_code)
  WHERE is_active = true;

-- View exposing only the fields the agent's "check_clinical_guidelines" tool needs.
CREATE OR REPLACE VIEW v_prior_auth_clinical_guidelines AS
SELECT
  procedure_code,
  procedure_name,
  mbs_item_number,
  body_region,
  required_clinical_history,
  red_flag_conditions,
  minimum_conservative_treatment_weeks,
  evidence_basis,
  approval_criteria,
  typical_turnaround_days
FROM prior_auth_clinical_guidelines
WHERE is_active = true;
