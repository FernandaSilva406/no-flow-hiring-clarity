import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, MessageSquare, Users, Calendar, Target, Sparkles } from "lucide-react";
import { NoFlowNav } from "@/components/no-flow-nav";
import { findVaga, type Vaga, type Etapa } from "@/lib/mock-vagas";
import { supabase } from "@/integrations/supabase/client";
import { type VagaRow } from "@/lib/vagas-db";

function rowToVaga(r: VagaRow): Vaga {
  const order: Array<{ key: VagaRow["status"]; nome: string; descricao: string }> = [
    { key: "abertura", nome: "Abertura da vaga", descricao: "Vaga criada e alinhada com o gestor." },
    { key: "aprovacao_people", nome: "Aprovação People", descricao: "Validação pelo time de People." },
    { key: "aprovacao_financeiro", nome: "Aprovação Financeiro", descricao: "Validação orçamentária." },
    { key: "hunting", nome: "Hunting", descricao: "Prospecção ativa de candidatos." },
    { key: "papo_people", nome: "Papo com People", descricao: "Entrevistas com People." },
    { key: "case", nome: "Case técnico", descricao: "Resolução do desafio prático." },
    { key: "papo_gestor", nome: "Papo com Gestor", descricao: "Entrevista com o gestor responsável." },
    { key: "proposta", nome: "Proposta", descricao: "Envio e negociação da proposta." },
    { key: "fechada", nome: "Fechada", descricao: "Vaga preenchida." },
  ];
  const filtered = r.tem_case ? order : order.filter((o) => o.key !== "case");
  const currentIdx = filtered.findIndex((o) => o.key === r.status);
  const etapas: Etapa[] = filtered.map((o, i) => ({
    id: o.key,
    nome: o.nome,
    descricao: o.descricao,
    status: i < currentIdx ? "concluido" : i === currentIdx ? "atual" : "pendente",
    diasNaEtapa: i === currentIdx ? Math.max(1, Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 86400000)) : undefined,
    concluidoEm: i < currentIdx ? "—" : undefined,
  }));
  const diasAberta = Math.max(1, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000));
  return {
    codigo: r.codigo,
    nome: r.nome,
    area: r.area ?? "—",
    gestor: r.gestor,
    recruiter: r.recruiter,
    status: r.status === "fechada" ? "Fechada" : "Em andamento",
    candidatosAbordados: r.candidatos_abordados || 1,
    entrevistasRealizadas: r.candidatos_papo_people + r.candidatos_papo_gestor,
    diasAberta,
    slaPercent: 90,
    etapas,
    comentarios: [],
  };
}

export const Route = createFileRoute("/vaga/$codigo")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.codigo} — No Flow` },
      { name: "description", content: `Acompanhe o processo seletivo da vaga ${params.codigo}.` },
    ],
  }),
  ssr: false,
  loader: async ({ params }) => {
    const { data } = await supabase.from("vagas").select("*").eq("codigo", params.codigo).maybeSingle();
    if (data) return { vaga: rowToVaga(data as VagaRow) };
    const vaga = findVaga(params.codigo);
    if (!vaga) throw notFound();
    return { vaga };
  },
  component: VagaPage,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <NoFlowNav />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-3xl font-bold">Vaga não encontrada</h1>
        <p className="mt-2 text-muted-foreground">Verifique o código e tente novamente.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-brand-lilac font-semibold">
          <ArrowLeft className="size-4" /> Voltar para a busca
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-12 text-center text-destructive">{error.message}</div>
  ),
});


function VagaPage() {
  const { vaga } = Route.useLoaderData();
  const totalEtapas = vaga.etapas.length;
  const concluidas = vaga.etapas.filter((e: Etapa) => e.status === "concluido").length;
  const progresso = Math.round(((concluidas + 0.5) / totalEtapas) * 100);

  return (
    <div className="min-h-screen">
      <NoFlowNav />
      <main className="mx-auto max-w-5xl px-6 py-12 animate-fade-up">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Nova busca
        </Link>

        <HeaderCard vaga={vaga} progresso={progresso} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <Timeline vaga={vaga} />
          <SidePanel vaga={vaga} />
        </div>
      </main>
    </div>
  );
}

function HeaderCard({ vaga, progresso }: { vaga: Vaga; progresso: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-lilac">
            {vaga.area} · <span className="font-mono">{vaga.codigo}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{vaga.nome}</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Gestor: <strong className="text-foreground">{vaga.gestor}</strong></span>
            <span>Recruiter: <strong className="text-foreground">{vaga.recruiter}</strong></span>
          </div>
        </div>
        <span className="rounded-full bg-brand-pink/10 px-3 py-1 text-xs font-bold text-brand-pink">
          {vaga.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={<Users className="size-4" />} label="Abordados" value={vaga.candidatosAbordados} />
        <Kpi icon={<MessageSquare className="size-4" />} label="Entrevistas" value={vaga.entrevistasRealizadas} />
        <Kpi icon={<Calendar className="size-4" />} label="Aberta há" value={`${vaga.diasAberta}d`} />
        <Kpi icon={<Target className="size-4" />} label="SLA" value={`${vaga.slaPercent}%`} tone={vaga.slaPercent < 80 ? "warn" : "ok"} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
          <span>Progresso geral</span>
          <span>{progresso}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: "neutral" | "ok" | "warn" }) {
  const toneCls = tone === "warn" ? "text-destructive" : tone === "ok" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function Timeline({ vaga }: { vaga: Vaga }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <Sparkles className="size-5 text-brand-pink" /> Progresso do processo
      </h2>
      <div className="relative space-y-3">
        <div className="absolute bottom-4 left-4 top-4 w-px bg-border" />
        {vaga.etapas.map((etapa, idx) => (
          <EtapaItem key={etapa.id} etapa={etapa} idx={idx} />
        ))}
      </div>
    </div>
  );
}

function EtapaItem({ etapa, idx }: { etapa: Etapa; idx: number }) {
  if (etapa.status === "atual") {
    return (
      <div className="relative pl-12 animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
        <div className="absolute left-1.5 top-3 grid size-5 place-items-center rounded-full border-2 border-brand-pink bg-card">
          <span className="size-2 animate-pulse rounded-full bg-brand-pink" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border-2 border-brand-pink/30 bg-gradient-to-r from-brand-pink/5 to-transparent p-6">
          <div className="pointer-events-none absolute inset-0 animate-shimmer" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-brand-pink">{etapa.nome}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{etapa.descricao}</p>
            </div>
            <span className="rounded-full bg-gradient-brand px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              <Clock className="-mt-px mr-1 inline size-3" />
              Há {etapa.diasNaEtapa} dias
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (etapa.status === "concluido") {
    return (
      <div className="relative pl-12">
        <div className="absolute left-2.5 top-3 grid size-3.5 place-items-center rounded-full bg-brand-lilac ring-4 ring-card">
          <Check className="size-2.5 text-white" strokeWidth={3.5} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <span className="font-medium text-foreground/70">{etapa.nome}</span>
          <span className="text-xs text-muted-foreground">{etapa.concluidoEm} · concluído</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-12">
      <div className="absolute left-3 top-3.5 size-2.5 rounded-full bg-border ring-4 ring-card" />
      <div className="rounded-2xl border border-dashed border-border p-4 opacity-60">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{etapa.nome}</span>
          <span className="text-xs text-muted-foreground">A seguir</span>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ vaga }: { vaga: Vaga }) {
  return (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Funil de conversão</h3>
        <div className="space-y-4">
          <FunnelRow label="Abordados" value={vaga.candidatosAbordados} pct={100} />
          <FunnelRow label="Triagem" value={Math.round(vaga.candidatosAbordados * 0.3)} pct={30} />
          <FunnelRow label="Entrevistas" value={vaga.entrevistasRealizadas} pct={Math.round((vaga.entrevistasRealizadas / vaga.candidatosAbordados) * 100)} />
          <FunnelRow label="Finalistas" value={Math.max(1, Math.round(vaga.entrevistasRealizadas * 0.25))} pct={6} />
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-brand p-6 text-white shadow-brand-glow">
        <div className="text-xs font-bold uppercase tracking-widest opacity-80">Dica do recruiter</div>
        <p className="mt-2 text-sm font-medium">
          Feedbacks rápidos (até 48h) aceleram o fechamento em até 30%. O processo está fluindo dentro do SLA esperado.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Comentários internos</h3>
        {vaga.comentarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem comentários ainda.</p>
        ) : (
          <ul className="space-y-4">
            {vaga.comentarios.map((c, i) => (
              <li key={i} className="text-sm">
                <p className="text-foreground/80 italic">"{c.texto}"</p>
                <p className="mt-1 text-xs text-muted-foreground">— {c.autor} · {c.quando}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function FunnelRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold">
        <span className="uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
