import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/lib/use-auth";

type NotifItem = {
  id: string;
  autor: string;
  texto: string;
  origem: "ta" | "gestor";
  created_at: string;
  vaga_codigo: string | null;
  vaga_nome: string | null;
};

export function NotificationsBell() {
  const { hasRole, user, loading } = useHasRole("talent_acquisition");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function load() {
    const { data: comentarios } = await supabase
      .from("vaga_comentarios")
      .select("id, autor, texto, origem, created_at, vaga_codigo")
      .not("vaga_codigo", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!comentarios) return;
    const codigos = Array.from(new Set(comentarios.map((c) => c.vaga_codigo!).filter(Boolean)));
    const vagasMap = new Map<string, string>();
    if (codigos.length) {
      const { data: vagas } = await supabase
        .from("vagas")
        .select("codigo, nome")
        .in("codigo", codigos);
      vagas?.forEach((v) => vagasMap.set(v.codigo, v.nome));
    }
    setItems(
      comentarios.map((c) => ({
        id: c.id,
        autor: c.autor,
        texto: c.texto,
        origem: c.origem as "ta" | "gestor",
        created_at: c.created_at,
        vaga_codigo: c.vaga_codigo,
        vaga_nome: vagasMap.get(c.vaga_codigo!) ?? null,
      })),
    );
  }

  async function loadLastRead() {
    if (!user) return;
    const { data } = await supabase
      .from("notificacoes_leitura")
      .select("last_read_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setLastRead(data?.last_read_at ?? null);
  }

  useEffect(() => {
    if (!hasRole) return;
    load();
    loadLastRead();
    const ch = supabase
      .channel("notif-comentarios")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vaga_comentarios" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRole, user?.id]);

  async function markRead() {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from("notificacoes_leitura")
      .upsert({ user_id: user.id, last_read_at: now }, { onConflict: "user_id" });
    setLastRead(now);
  }

  if (loading || !hasRole) return null;

  const unread = items.filter(
    (i) => i.origem === "gestor" && (!lastRead || new Date(i.created_at) > new Date(lastRead)),
  ).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markRead();
        }}
        className="relative grid size-9 place-items-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Notificações"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-brand-pink px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-bold">Notificações</h3>
            <p className="text-xs text-muted-foreground">Comentários recentes nas vagas</p>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Nenhum comentário ainda.
              </p>
            ) : (
              items.map((i) => (
                <Link
                  key={i.id}
                  to="/vaga/$codigo"
                  params={{ codigo: i.vaga_codigo! }}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-bold text-brand-lilac">{i.vaga_codigo}</span>
                    <span className="text-muted-foreground">
                      {new Date(i.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-semibold">{i.vaga_nome ?? "Vaga"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{i.autor}</span>
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        i.origem === "ta"
                          ? "bg-brand-lilac/15 text-brand-lilac"
                          : "bg-brand-pink/10 text-brand-pink"
                      }`}
                    >
                      {i.origem === "ta" ? "TA" : "Gestor"}
                    </span>
                    <span className="ml-1">comentou</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{i.texto}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
