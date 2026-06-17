import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHasRole } from "@/lib/use-auth";

export type ComentarioRow = {
  id: string;
  vaga_id: string | null;
  vaga_codigo: string | null;
  autor: string;
  texto: string;
  origem: "ta" | "gestor";
  created_at: string;
};

export function VagaComentarios({
  vagaCodigo,
  mode,
}: {
  vagaCodigo: string;
  mode: "ta" | "gestor";
}) {

  const { user } = useAuth();
  const { hasRole } = useHasRole("talent_acquisition");
  const [items, setItems] = useState<ComentarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [autor, setAutor] = useState("");
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("vaga_comentarios")
      .select("*")
      .eq("vaga_id", vagaId)
      .order("created_at", { ascending: false });
    if (data) setItems(data as ComentarioRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vagaId]);

  useEffect(() => {
    if (mode === "ta" && user?.email && !autor) {
      setAutor(user.email.split("@")[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mode]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const autorTrim = autor.trim();
    const textoTrim = texto.trim();
    if (!autorTrim) {
      setErr("Por favor, identifique-se com seu nome antes de comentar.");
      return;
    }
    if (!textoTrim) {
      setErr("Escreva um comentário.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("vaga_comentarios").insert({
      vaga_id: vagaId,
      autor: autorTrim,
      texto: textoTrim,
      origem: mode,
    });
    setSending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setTexto("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este comentário?")) return;
    await supabase.from("vaga_comentarios").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          <input
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            placeholder={mode === "gestor" ? "Seu nome (obrigatório)" : "Seu nome"}
            required
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-lilac"
          />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              mode === "ta"
                ? "Atualize o gestor sobre candidatos, próximos passos…"
                : "Deixe um comentário para o time de TA"
            }
            required
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-lilac"
          />
        </div>
        {err && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand-glow disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Enviar
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            <Loader2 className="mx-auto size-4 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" /> Nenhum comentário ainda.
          </p>
        ) : (
          items.map((c) => (
            <div
              key={c.id}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-background/40 p-3 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-foreground">{c.autor}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.origem === "ta"
                        ? "bg-brand-lilac/15 text-brand-lilac"
                        : "bg-brand-pink/10 text-brand-pink"
                    }`}
                  >
                    {c.origem === "ta" ? "TA" : "Gestor"}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">{c.texto}</p>
              </div>
              {hasRole && (
                <button
                  onClick={() => remove(c.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="Excluir comentário"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
