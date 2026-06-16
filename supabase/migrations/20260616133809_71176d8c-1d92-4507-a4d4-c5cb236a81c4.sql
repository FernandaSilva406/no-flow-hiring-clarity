
CREATE TYPE public.comentario_origem AS ENUM ('ta', 'gestor');

CREATE TABLE public.vaga_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  origem public.comentario_origem NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vaga_comentarios_vaga_id_idx ON public.vaga_comentarios(vaga_id);

GRANT SELECT ON public.vaga_comentarios TO anon;
GRANT SELECT, INSERT ON public.vaga_comentarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaga_comentarios TO authenticated;
GRANT ALL ON public.vaga_comentarios TO service_role;

ALTER TABLE public.vaga_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios sao publicos para leitura"
  ON public.vaga_comentarios FOR SELECT
  USING (true);

CREATE POLICY "Gestor pode comentar identificado"
  ON public.vaga_comentarios FOR INSERT
  TO anon
  WITH CHECK (origem = 'gestor' AND length(btrim(autor)) > 0 AND length(btrim(texto)) > 0);

CREATE POLICY "Visitante autenticado pode comentar como gestor"
  ON public.vaga_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (
    (origem = 'gestor' AND length(btrim(autor)) > 0 AND length(btrim(texto)) > 0)
    OR (origem = 'ta' AND public.has_role(auth.uid(), 'talent_acquisition'::app_role))
  );

CREATE POLICY "TA pode deletar comentarios"
  ON public.vaga_comentarios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'talent_acquisition'::app_role));
