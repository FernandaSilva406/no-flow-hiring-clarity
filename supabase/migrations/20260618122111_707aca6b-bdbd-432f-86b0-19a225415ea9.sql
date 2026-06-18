ALTER TYPE public.vaga_status ADD VALUE IF NOT EXISTS 'congelada';
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS freeze_motivo text;