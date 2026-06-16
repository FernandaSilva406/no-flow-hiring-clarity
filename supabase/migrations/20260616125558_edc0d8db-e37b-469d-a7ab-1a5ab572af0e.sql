
CREATE TYPE public.vaga_status AS ENUM ('abertura','aprovacao_people','aprovacao_financeiro','hunting','papo_people','case','papo_gestor','proposta','fechada');

CREATE TABLE public.vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  gestor TEXT NOT NULL,
  recruiter TEXT NOT NULL,
  area TEXT,
  tem_case BOOLEAN NOT NULL DEFAULT false,
  candidatos_abordados INT NOT NULL DEFAULT 0,
  candidatos_papo_people INT NOT NULL DEFAULT 0,
  candidatos_papo_gestor INT NOT NULL DEFAULT 0,
  candidatos_case INT NOT NULL DEFAULT 0,
  status public.vaga_status NOT NULL DEFAULT 'abertura',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vagas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT ALL ON public.vagas TO service_role;

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vagas são públicas para leitura" ON public.vagas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "TA pode inserir vagas" ON public.vagas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'talent_acquisition'));
CREATE POLICY "TA pode atualizar vagas" ON public.vagas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'talent_acquisition')) WITH CHECK (public.has_role(auth.uid(), 'talent_acquisition'));
CREATE POLICY "TA pode deletar vagas" ON public.vagas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'talent_acquisition'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON public.vagas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
