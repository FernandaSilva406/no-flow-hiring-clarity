import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NoFlowNav } from "@/components/no-flow-nav";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — No Flow" },
      { name: "description", content: "Acesso restrito ao time de Talent Acquisition." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr("Credenciais inválidas. Verifique e-mail e senha.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen">
      <NoFlowNav />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16 animate-fade-up">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-lilac">Acesso restrito</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Entrar no No Flow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel exclusivo do time de Talent Acquisition.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-brand-lilac"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-brand-lilac"
              />
            </div>
            {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-brand-glow transition-opacity disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Voltar para busca de vagas
          </Link>
        </div>
      </main>
    </div>
  );
}
