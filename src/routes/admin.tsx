import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp, AlertTriangle, Filter, ExternalLink, Lock, Plus, Loader2, Trash2, MessageSquare, ChevronDown, Pencil, CheckCircle2, Snowflake } from "lucide-react";
import { NoFlowNav } from "@/components/no-flow-nav";
import { VAGAS } from "@/lib/mock-vagas";
import { useHasRole } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_OPTIONS, statusLabel, type VagaRow, type VagaStatus } from "@/lib/vagas-db";
import { VagaComentarios } from "@/components/vaga-comentarios";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel TA — No Flow" },
      { name: "description", content: "Indicadores estratégicos de Talent Acquisition." },
    ],
  }),
  ssr: false,
  component: AdminGuard,
});

function AdminGuard() {
  const { hasRole, user, loading } = useHasRole("talent_acquisition");

  if (loading) {
    return (
      <div className="min-h-screen">
        <NoFlowNav />
        <div className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  if (!hasRole) {
    return (
      <div className="min-h-screen">
        <NoFlowNav />
        <main className="mx-auto max-w-md px-6 py-24 animate-fade-up">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-pink/10 text-brand-pink">
              <Lock className="size-5" />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Acesso restrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este painel é exclusivo do time de Talent Acquisition.
            </p>
            <Link to="/" className="mt-6 inline-block text-xs font-semibold text-brand-lilac hover:underline">
              ← Voltar para busca
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <AdminPage />;
}

const STAGE_TIMES = [
  { stage: "Abertura", days: 1 },
  { stage: "Aprov. People", days: 2 },
  { stage: "Aprov. Financeiro", days: 3 },
  { stage: "Hunting", days: 12 },
  { stage: "Papo People", days: 4 },
  { stage: "Case", days: 5 },
  { stage: "Papo Gestor", days: 18, gargalo: true },
  { stage: "Proposta", days: 3 },
];

// Status considerados "aprovados pelo financeiro" (já passaram pela aprovação financeira)
const STATUS_POS_FINANCEIRO: VagaStatus[] = [
  "hunting",
  "papo_people",
  "case",
  "papo_gestor",
  "proposta",
  "fechada",
  "congelada",
];
const STATUS_ATIVAS: VagaStatus[] = ["hunting", "papo_people", "case", "papo_gestor", "proposta"];

function AdminPage() {
  const [areaFiltro, setAreaFiltro] = useState<string>("Todas");
  const [dbVagas, setDbVagas] = useState<VagaRow[]>([]);

  useEffect(() => {
    let alive = true;
    async function fetchVagas() {
      const { data } = await supabase
        .from("vagas")
        .select("*")
        .order("created_at", { ascending: false });
      if (alive && data) setDbVagas(data as VagaRow[]);
    }
    fetchVagas();
    const channel = supabase
      .channel("admin-vagas")
      .on("postgres_changes", { event: "*", schema: "public", table: "vagas" }, () => fetchVagas())
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const vagasAprovadasFin = useMemo(
    () => dbVagas.filter((v) => STATUS_POS_FINANCEIRO.includes(v.status)),
    [dbVagas],
  );

  const areas = useMemo(() => {
    const set = new Set<string>();
    VAGAS.forEach((v) => set.add(v.area));
    dbVagas.forEach((v) => v.area && set.add(v.area));
    return ["Todas", ...Array.from(set)];
  }, [dbVagas]);

  const vagasFiltradas = areaFiltro === "Todas" ? VAGAS : VAGAS.filter((v) => v.area === areaFiltro);
  const dbVagasFiltradas = useMemo(
    () =>
      areaFiltro === "Todas"
        ? vagasAprovadasFin
        : vagasAprovadasFin.filter((v) => (v.area ?? "") === areaFiltro),
    [vagasAprovadasFin, areaFiltro],
  );
  const dbAtivas = useMemo(
    () => dbVagasFiltradas.filter((v) => STATUS_ATIVAS.includes(v.status)),
    [dbVagasFiltradas],
  );

  const kanbanCols: { nome: string; vagas: VagaRow[] }[] = [
    { nome: "Hunting", vagas: dbAtivas.filter((v) => v.status === "hunting") },
    {
      nome: "Entrevistas",
      vagas: dbAtivas.filter((v) => v.status === "papo_people" || v.status === "case" || v.status === "papo_gestor"),
    },
    { nome: "Proposta", vagas: dbAtivas.filter((v) => v.status === "proposta") },
    { nome: "Fechadas", vagas: dbVagasFiltradas.filter((v) => v.status === "fechada") },
  ];

  return (
    <div className="min-h-screen">
      <NoFlowNav />
      <main className="mx-auto max-w-6xl px-6 py-12 animate-fade-up">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-lilac">Painel Executivo</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Indicadores de Talent Acquisition</h1>
            <p className="mt-1 text-muted-foreground">Visualização em tempo real da performance de recrutamento.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                className="bg-transparent font-medium outline-none"
              >
                {areas.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand-glow">
              <Download className="size-4" /> Exportar
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="SLA médio fechamento" value="30" unit="dias" delta="meta da operação" trend="flat" />
          <KpiCard label="Vagas abertas" value={String(vagasFiltradas.length)} unit="" delta="8 em fase final" trend="flat" />
          <KpiCard label="Taxa de aceite" value="94" unit="%" delta="+3pp" trend="up" />
          <KpiCard label="Maior gargalo" value="Papo Gestor" unit="" delta="média 18 dias" trend="warn" highlight />
        </div>

        {/* Charts row */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold">Tempo médio por etapa</h2>
              <span className="text-xs text-muted-foreground">últimos 90 dias</span>
            </div>
            <div className="space-y-3">
              {STAGE_TIMES.map((s) => {
                const max = Math.max(...STAGE_TIMES.map((x) => x.days));
                const pct = (s.days / max) * 100;
                return (
                  <div key={s.stage} className="flex items-center gap-4">
                    <span className="w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {s.stage}
                    </span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-lg ${s.gargalo ? "bg-brand-pink" : "bg-brand-lilac"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-20 text-right text-sm font-bold ${s.gargalo ? "text-brand-pink" : "text-foreground"}`}>
                      {s.days}d {s.gargalo && "⚠"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-bold">Performance por recruiter</h2>
            <div className="space-y-3">
              {[
                { nome: "Fernanda Silva", vagas: 6, sla: 92 },
                { nome: "Lilian Borges", vagas: 4, sla: 88 },
              ].map((r) => (
                <div key={r.nome} className="rounded-2xl border border-border bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{r.nome}</span>
                    <span className="text-xs text-muted-foreground">{r.vagas} vagas</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${r.sla}%` }} />
                    </div>
                    <span className="text-xs font-bold">{r.sla}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Minhas vagas (DB) */}
        <MinhasVagas />

        {/* Kanban */}

        <section className="mt-8">
          <h2 className="mb-4 font-bold">Kanban de vagas ativas</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {kanbanCols.map((col) => (
              <div key={col.nome} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.nome}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{col.vagas.length}</span>
                </div>
                <div className="space-y-2">
                  {col.vagas.map((v) => {
                    const diasAberta = Math.max(
                      0,
                      Math.floor((Date.now() - new Date(v.created_at).getTime()) / 86400000),
                    );
                    return (
                      <Link
                        key={v.id}
                        to="/vaga/$codigo"
                        params={{ codigo: v.codigo }}
                        className="block rounded-xl border border-border bg-background/60 p-3 transition-all hover:border-brand-lilac/40 hover:shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-tight">{v.nome}</span>
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{v.codigo}</div>
                        <div className="mt-3 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{diasAberta}d aberta</span>
                          <span className="font-bold text-brand-lilac">{statusLabel(v.status)}</span>
                        </div>
                      </Link>
                    );
                  })}
                  {col.vagas.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma vaga</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Table */}
        <section className="mt-8 rounded-3xl border border-border bg-card shadow-soft">
          <div className="border-b border-border p-6">
            <h2 className="font-bold">Todas as vagas</h2>
            <p className="text-xs text-muted-foreground">Vagas aprovadas pelo financeiro.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Código</th>
                  <th className="px-6 py-3 text-left font-bold">Vaga</th>
                  <th className="px-6 py-3 text-left font-bold">Área</th>
                  <th className="px-6 py-3 text-left font-bold">Recruiter</th>
                  <th className="px-6 py-3 text-right font-bold">Dias</th>
                  <th className="px-6 py-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {dbVagasFiltradas.map((v) => {
                  const diasAberta = Math.max(
                    0,
                    Math.floor((Date.now() - new Date(v.created_at).getTime()) / 86400000),
                  );
                  return (
                    <tr key={v.id} className="border-t border-border transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4 font-mono text-xs text-brand-lilac">
                        <Link to="/vaga/$codigo" params={{ codigo: v.codigo }} className="hover:underline">
                          {v.codigo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{v.nome}</td>
                      <td className="px-6 py-4 text-muted-foreground">{v.area ?? "—"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{v.recruiter}</td>
                      <td className="px-6 py-4 text-right font-semibold">{diasAberta}</td>
                      <td className="px-6 py-4 text-right font-bold text-brand-lilac">{statusLabel(v.status)}</td>
                    </tr>
                  );
                })}
                {dbVagasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Nenhuma vaga aprovada pelo financeiro ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label, value, unit, delta, trend, highlight,
}: { label: string; value: string; unit: string; delta: string; trend: "up" | "down" | "flat" | "warn"; highlight?: boolean }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : trend === "warn" ? AlertTriangle : null;
  const tone = trend === "up" || trend === "down" ? "text-success" : trend === "warn" ? "text-brand-pink" : "text-muted-foreground";
  return (
    <div className={`rounded-3xl border p-6 shadow-soft ${highlight ? "border-brand-lilac/30 bg-gradient-to-br from-brand-lilac/5 to-card" : "border-border bg-card"}`}>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${highlight ? "text-brand-lilac" : ""}`}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${tone}`}>
        {Icon && <Icon className="size-3" />} {delta}
      </div>
    </div>
  );
}

function MinhasVagas() {
  const [vagas, setVagas] = useState<VagaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openComentarios, setOpenComentarios] = useState<string | null>(null);

  const emptyForm = {
    codigo: "",
    nome: "",
    gestor: "",
    recruiter: "",
    area: "",
    tem_case: false,
    candidatos_abordados: 0,
    candidatos_papo_people: 0,
    candidatos_papo_gestor: 0,
    candidatos_case: 0,
    status: "abertura" as VagaStatus,
  };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vagas")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setVagas(data as VagaRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setErr(null);
  }

  function startEdit(v: VagaRow) {
    setEditingId(v.id);
    setForm({
      codigo: v.codigo,
      nome: v.nome,
      gestor: v.gestor,
      recruiter: v.recruiter,
      area: v.area ?? "",
      tem_case: v.tem_case,
      candidatos_abordados: v.candidatos_abordados,
      candidatos_papo_people: v.candidatos_papo_people,
      candidatos_papo_gestor: v.candidatos_papo_gestor,
      candidatos_case: v.candidatos_case,
      status: v.status,
    });
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const payload = { ...form, area: form.area || null };
    const { error } = editingId
      ? await supabase.from("vagas").update(payload).eq("id", editingId)
      : await supabase.from("vagas").insert(payload);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setShowForm(false);
    resetForm();
    load();
  }

  async function updateStatus(id: string, status: VagaStatus) {
    setVagas((vs) => vs.map((v) => (v.id === id ? { ...v, status, freeze_motivo: status === "congelada" ? v.freeze_motivo : null } : v)));
    const patch: { status: VagaStatus; freeze_motivo?: null } = { status };
    if (status !== "congelada") patch.freeze_motivo = null;
    await supabase.from("vagas").update(patch).eq("id", id);
  }

  async function fecharVaga(v: VagaRow) {
    if (v.status === "fechada") return;
    if (!confirm(`Fechar a vaga "${v.nome}"?`)) return;
    await updateStatus(v.id, "fechada");
  }

  async function congelarVaga(v: VagaRow) {
    const motivo = window.prompt(
      v.status === "congelada"
        ? `Atualizar motivo do congelamento de "${v.nome}":`
        : `Por que a vaga "${v.nome}" será congelada?`,
      v.freeze_motivo ?? "",
    );
    if (motivo === null) return;
    const motivoTrim = motivo.trim();
    if (!motivoTrim) {
      alert("É obrigatório informar um motivo para congelar a vaga.");
      return;
    }
    setVagas((vs) => vs.map((x) => (x.id === v.id ? { ...x, status: "congelada", freeze_motivo: motivoTrim } : x)));
    await supabase.from("vagas").update({ status: "congelada", freeze_motivo: motivoTrim }).eq("id", v.id);
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta vaga?")) return;
    await supabase.from("vagas").delete().eq("id", id);
    load();
  }

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="font-bold">Minhas vagas</h2>
          <p className="text-xs text-muted-foreground">Vagas cadastradas por você. Altere o status para refletir na tela do gestor.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand-glow"
        >
          <Plus className="size-4" /> {showForm ? "Cancelar" : editingId ? "Editar vaga" : "Nova vaga"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="grid gap-4 border-b border-border p-6 md:grid-cols-2 animate-fade-up">
          <Field label="Código" required>
            <input required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className={inputCls} placeholder="VAGA-001" />
          </Field>
          <Field label="Nome da vaga" required>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} placeholder="Desenvolvedor(a) Full Stack Sr." />
          </Field>
          <Field label="Gestor responsável" required>
            <input required value={form.gestor} onChange={(e) => setForm({ ...form, gestor: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Recrutador responsável" required>
            <input required value={form.recruiter} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Área">
            <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} placeholder="Tecnologia" />
          </Field>
          <Field label="Status inicial">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VagaStatus })} className={inputCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Candidatos abordados">
            <input type="number" min={0} value={form.candidatos_abordados} onChange={(e) => setForm({ ...form, candidatos_abordados: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Seguiram p/ papo People">
            <input type="number" min={0} value={form.candidatos_papo_people} onChange={(e) => setForm({ ...form, candidatos_papo_people: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Seguiram p/ papo Gestor">
            <input type="number" min={0} value={form.candidatos_papo_gestor} onChange={(e) => setForm({ ...form, candidatos_papo_gestor: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Em case">
            <input type="number" min={0} value={form.candidatos_case} onChange={(e) => setForm({ ...form, candidatos_case: Number(e.target.value) })} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.tem_case} onChange={(e) => setForm({ ...form, tem_case: e.target.checked })} />
            Esta vaga possui etapa de case
          </label>
          {err && <p className="md:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-glow disabled:opacity-60">
              {saving && <Loader2 className="size-4 animate-spin" />} {editingId ? "Salvar alterações" : "Salvar vaga"}
            </button>
          </div>
        </form>
      )}

      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>
        ) : vagas.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma vaga cadastrada. Clique em "Nova vaga" para começar.</p>
        ) : (
          <div className="space-y-4">
            {vagas.map((v) => {
              const open = openComentarios === v.id;
              return (
                <div key={v.id} className="rounded-2xl border border-border bg-background/60 p-5 shadow-soft transition-all hover:border-brand-lilac/30">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to="/vaga/$codigo" params={{ codigo: v.codigo }} className="font-mono text-xs text-brand-lilac hover:underline">{v.codigo}</Link>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${v.status === "fechada" ? "bg-success/10 text-success" : v.status === "congelada" ? "bg-brand-lilac/10 text-brand-lilac" : "bg-muted text-muted-foreground"}`}>
                          {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold">{v.nome}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span><span className="font-semibold text-foreground/80">Gestor:</span> {v.gestor}</span>
                        <span><span className="font-semibold text-foreground/80">Recruiter:</span> {v.recruiter}</span>
                        <span><span className="font-semibold text-foreground/80">Área:</span> {v.area ?? "—"}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <MetricBadge label="Abord." value={v.candidatos_abordados} />
                        <MetricBadge label="People" value={v.candidatos_papo_people} />
                        <MetricBadge label="Gestor" value={v.candidatos_papo_gestor} />
                        <MetricBadge label="Case" value={v.tem_case ? v.candidatos_case : null} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      <select
                        value={v.status}
                        onChange={(e) => updateStatus(v.id, e.target.value as VagaStatus)}
                        className="w-full cursor-pointer rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-brand-lilac md:w-auto"
                      >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Ações explícitas */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <ActionButton onClick={() => startEdit(v)} icon={<Pencil className="size-4" />} label="Editar" tone="default" />
                    <ActionButton onClick={() => setOpenComentarios(open ? null : v.id)} icon={<MessageSquare className="size-4" />} label="Comentários" tone={open ? "active" : "default"} />
                    <ActionButton
                      onClick={() => fecharVaga(v)}
                      disabled={v.status === "fechada"}
                      icon={<CheckCircle2 className="size-4" />}
                      label="Fechar vaga"
                      tone="success"
                    />
                    <ActionButton
                      onClick={() => congelarVaga(v)}
                      icon={<Snowflake className="size-4" />}
                      label={v.status === "congelada" ? "Atualizar motivo" : "Congelar vaga"}
                      tone={v.status === "congelada" ? "active" : "lilac"}
                    />
                    <ActionButton onClick={() => remove(v.id)} icon={<Trash2 className="size-4" />} label="Excluir" tone="danger" />
                  </div>

                  {v.status === "congelada" && v.freeze_motivo && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-lilac/20 bg-brand-lilac/5 px-3 py-2 text-xs">
                      <Snowflake className="mt-0.5 size-3.5 shrink-0 text-brand-lilac" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-brand-lilac">Vaga congelada — </span>
                        <span className="text-foreground/90">{v.freeze_motivo}</span>
                      </div>
                    </div>
                  )}

                  {open && (
                    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                      <VagaComentarios vagaCodigo={v.codigo} mode="ta" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-lilac";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-brand-pink"> *</span>}
      </label>
      {children}
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="font-bold">{value ?? "—"}</span>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  tone,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  tone: "default" | "success" | "danger" | "lilac" | "active";
}) {
  const toneClasses = {
    default: "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
    success: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30",
    danger: "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30",
    lilac: "border-brand-lilac/30 text-brand-lilac hover:bg-brand-lilac/10",
    active: "border-brand-lilac/40 bg-brand-lilac/10 text-brand-lilac",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${toneClasses[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}


