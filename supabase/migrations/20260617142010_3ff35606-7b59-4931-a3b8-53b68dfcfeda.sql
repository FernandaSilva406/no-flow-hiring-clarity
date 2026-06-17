
ALTER TABLE public.vaga_comentarios DROP CONSTRAINT IF EXISTS vaga_comentarios_vaga_id_fkey;
ALTER TABLE public.vaga_comentarios ADD COLUMN IF NOT EXISTS vaga_codigo text;
UPDATE public.vaga_comentarios c SET vaga_codigo = v.codigo FROM public.vagas v WHERE c.vaga_id = v.id AND c.vaga_codigo IS NULL;
ALTER TABLE public.vaga_comentarios ALTER COLUMN vaga_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS vaga_comentarios_vaga_codigo_idx ON public.vaga_comentarios(vaga_codigo);
