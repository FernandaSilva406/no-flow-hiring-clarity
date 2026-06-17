
CREATE TABLE public.notificacoes_leitura (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notificacoes_leitura TO authenticated;
GRANT ALL ON public.notificacoes_leitura TO service_role;
ALTER TABLE public.notificacoes_leitura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário gerencia sua própria leitura" ON public.notificacoes_leitura
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tr_notificacoes_leitura_updated
  BEFORE UPDATE ON public.notificacoes_leitura
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.vaga_comentarios;
