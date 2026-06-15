import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp, AlertTriangle, Filter, ExternalLink } from "lucide-react";
import { NoFlowNav } from "@/components/no-flow-nav";
import { VAGAS } from "@/lib/mock-vagas";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel TA — No Flow" },
      { name: "description", content: "Indicadores estratégicos de Talent Acquisition." },
    ],
  }),
  component: AdminPage,
});

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

function AdminPage() {
  const [areaFiltro, setAreaFiltro] = useState<string>("Todas");
  const areas = useMemo(() => ["Todas", ...Array.from(new Set(VAGAS.map((v) => v.area)))], []);
  const vagasFiltradas = areaFiltro === "Todas" ? VAGAS : VAGAS.filter((v) => v.area === areaFiltro);

  const stages = ["Hunting", "Entrevistas", "Proposta", "Fechadas"];
  const kanbanCols = stages.map((s, i) => ({
    nome: s,
    vagas: vagasFiltradas.filter((_, idx) => idx % stages.length === i),
  }));

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
          <KpiCard label="Tempo médio fechamento" value="32" unit="dias" delta="-12% vs mês ant." trend="down" />
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
                { nome: "Ana Mendes", vagas: 6, sla: 92 },
                { nome: "Marcos Vinícius", vagas: 4, sla: 88 },
                { nome: "Juliana Reis", vagas: 3, sla: 96 },
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
                  {col.vagas.map((v) => (
                    <Link
                      key={v.codigo}
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
                        <span className="text-muted-foreground">{v.diasAberta}d aberta</span>
                        <span className={`font-bold ${v.slaPercent < 80 ? "text-destructive" : "text-success"}`}>SLA {v.slaPercent}%</span>
                      </div>
                    </Link>
                  ))}
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
                  <th className="px-6 py-3 text-right font-bold">SLA</th>
                </tr>
              </thead>
              <tbody>
                {vagasFiltradas.map((v) => (
                  <tr key={v.codigo} className="border-t border-border transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono text-xs text-brand-lilac">
                      <Link to="/vaga/$codigo" params={{ codigo: v.codigo }} className="hover:underline">
                        {v.codigo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium">{v.nome}</td>
                    <td className="px-6 py-4 text-muted-foreground">{v.area}</td>
                    <td className="px-6 py-4 text-muted-foreground">{v.recruiter}</td>
                    <td className="px-6 py-4 text-right font-semibold">{v.diasAberta}</td>
                    <td className={`px-6 py-4 text-right font-bold ${v.slaPercent < 80 ? "text-destructive" : "text-success"}`}>
                      {v.slaPercent}%
                    </td>
                  </tr>
                ))}
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
