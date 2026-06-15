import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { NoFlowNav } from "@/components/no-flow-nav";
import { findVaga, VAGAS } from "@/lib/mock-vagas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "No Flow — Acompanhe sua vaga em tempo real" },
      { name: "description", content: "Sistema interno QuestEdu para acompanhamento de vagas de Talent Acquisition." },
    ],
  }),
  component: SearchPage,
});

const STORAGE_KEY = "noflow:recent";

function SearchPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentes, setRecentes] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecentes(JSON.parse(raw));
    } catch {}
  }, []);

  const buscar = (valor: string) => {
    const v = valor.trim();
    if (!v) return;
    setErro(null);
    setLoading(true);
    setTimeout(() => {
      const vaga = findVaga(v);
      if (!vaga) {
        setLoading(false);
        setErro(`Nenhuma vaga encontrada para "${v}". Tente: ${VAGAS[0].codigo}`);
        return;
      }
      const novos = [vaga.codigo, ...recentes.filter((c) => c !== vaga.codigo)].slice(0, 5);
      setRecentes(novos);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(novos)); } catch {}
      navigate({ to: "/vaga/$codigo", params: { codigo: vaga.codigo } });
    }, 600);
  };

  return (
    <div className="min-h-screen">
      <NoFlowNav />

      {/* decor */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 size-[480px] rounded-full bg-brand-pink/10 blur-[120px]" />
        <div className="absolute top-40 -right-40 size-[480px] rounded-full bg-brand-lilac/10 blur-[140px]" />
      </div>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 pb-32 text-center animate-fade-up">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-pink/10 px-3 py-1 text-xs font-bold text-brand-pink">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-pink opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-pink" />
          </span>
          TALENT ACQUISITION · QUESTEDU
        </div>

        <h1 className="text-balance text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Acompanhe sua vaga em <br />
          <span className="text-gradient-brand">tempo real.</span>
        </h1>

        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Digite o código da vaga para acompanhar o processo seletivo e ver exatamente em qual etapa estamos.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); buscar(codigo); }}
          className="relative mt-12 w-full max-w-2xl"
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-brand opacity-20 blur-2xl" />
          <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
            <div className="pl-4 text-muted-foreground">
              <Search className="size-5" />
            </div>
            <input
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErro(null); }}
              placeholder="Ex: CRM-2026-045"
              className="flex-1 bg-transparent px-2 py-4 font-mono text-lg outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-4 font-semibold text-white shadow-brand-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <>Acompanhar vaga <ArrowRight className="size-4" /></>}
            </button>
          </div>
          {erro && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-destructive animate-fade-up">
              <AlertCircle className="size-4" /> {erro}
            </div>
          )}
        </form>

        {(recentes.length > 0 || true) && (
          <div className="mt-12 w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {recentes.length > 0 ? "Buscas recentes" : "Experimente"}
            </span>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {(recentes.length > 0 ? recentes : VAGAS.slice(0, 3).map((v) => v.codigo)).map((c) => (
                <button
                  key={c}
                  onClick={() => { setCodigo(c); buscar(c); }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/70 transition-all hover:border-brand-lilac/40 hover:text-brand-lilac"
                >
                  <span className="font-mono text-xs opacity-60">#</span> {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
