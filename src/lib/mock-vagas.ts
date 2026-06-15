export type EtapaStatus = "concluido" | "atual" | "pendente";

export interface Etapa {
  id: string;
  nome: string;
  descricao: string;
  status: EtapaStatus;
  diasNaEtapa?: number;
  concluidoEm?: string;
}

export interface Vaga {
  codigo: string;
  nome: string;
  area: string;
  gestor: string;
  recruiter: string;
  candidatosAbordados: number;
  entrevistasRealizadas: number;
  diasAberta: number;
  slaPercent: number;
  status: "Em andamento" | "Congelada" | "Fechada";
  etapas: Etapa[];
  comentarios: { autor: string; texto: string; quando: string }[];
}

const ETAPAS_BASE = [
  { id: "abertura", nome: "Abertura da vaga", descricao: "Vaga criada e briefing alinhado com o gestor." },
  { id: "people", nome: "Aprovação de People", descricao: "Validação do escopo, senioridade e remuneração." },
  { id: "financeiro", nome: "Aprovação do Financeiro", descricao: "Orçamento confirmado pelo CFO." },
  { id: "hunting", nome: "Recrutamento / Hunting", descricao: "Abordagem ativa em LinkedIn, indicações e base." },
  { id: "papo-people", nome: "Papo com People", descricao: "Entrevista cultural e de fit com a recruiter." },
  { id: "case", nome: "Case / Teste técnico", descricao: "Desafio prático enviado ao candidato." },
  { id: "papo-gestor", nome: "Papo com gestor", descricao: "Conversa técnica e de alinhamento." },
  { id: "aprovado", nome: "Candidato aprovado", descricao: "Decisão final e validação interna." },
  { id: "proposta-enviada", nome: "Proposta enviada", descricao: "Carta proposta entregue ao candidato." },
  { id: "proposta-aceita", nome: "Proposta aceita", descricao: "Aceite formal recebido." },
  { id: "fim", nome: "Fim do processo", descricao: "Onboarding agendado." },
];

function buildEtapas(atualIdx: number, diasAtual: number): Etapa[] {
  return ETAPAS_BASE.map((e, idx) => {
    if (idx < atualIdx) {
      return { ...e, status: "concluido" as const, concluidoEm: `Há ${atualIdx - idx + 2} dias` };
    }
    if (idx === atualIdx) {
      return { ...e, status: "atual" as const, diasNaEtapa: diasAtual };
    }
    return { ...e, status: "pendente" as const };
  });
}

export const VAGAS: Vaga[] = [
  {
    codigo: "CRM-2026-045",
    nome: "Gerente de CRM Pleno",
    area: "Marketing",
    gestor: "Ricardo Souza",
    recruiter: "Ana Mendes",
    candidatosAbordados: 142,
    entrevistasRealizadas: 12,
    diasAberta: 18,
    slaPercent: 92,
    status: "Em andamento",
    etapas: buildEtapas(3, 4),
    comentarios: [
      { autor: "Ana Mendes", texto: "Mapeamos 15 perfis de Edtech esta manhã. Iniciando abordagens.", quando: "Hoje, 10:42" },
      { autor: "Ricardo Souza", texto: "Time aberto para entrevistas a partir de quinta.", quando: "Ontem" },
    ],
  },
  {
    codigo: "ENG-2025-088",
    nome: "Tech Lead Backend",
    area: "Engenharia",
    gestor: "André Luis",
    recruiter: "Marcos Vinícius",
    candidatosAbordados: 87,
    entrevistasRealizadas: 9,
    diasAberta: 26,
    slaPercent: 78,
    status: "Em andamento",
    etapas: buildEtapas(6, 3),
    comentarios: [
      { autor: "Marcos Vinícius", texto: "Dois candidatos finalistas — feedback do gestor até amanhã.", quando: "Hoje, 09:10" },
    ],
  },
  {
    codigo: "DES-2026-012",
    nome: "Product Designer Senior",
    area: "Produto",
    gestor: "Camila Faria",
    recruiter: "Ana Mendes",
    candidatosAbordados: 64,
    entrevistasRealizadas: 6,
    diasAberta: 11,
    slaPercent: 100,
    status: "Em andamento",
    etapas: buildEtapas(4, 2),
    comentarios: [],
  },
  {
    codigo: "SAL-2025-440",
    nome: "Head de Vendas",
    area: "Comercial",
    gestor: "Marina Mendes",
    recruiter: "Ana Mendes",
    candidatosAbordados: 210,
    entrevistasRealizadas: 18,
    diasAberta: 42,
    slaPercent: 62,
    status: "Em andamento",
    etapas: buildEtapas(8, 5),
    comentarios: [],
  },
  {
    codigo: "MKT-2024-012",
    nome: "Analista de Performance",
    area: "Marketing",
    gestor: "Ricardo Souza",
    recruiter: "Marcos Vinícius",
    candidatosAbordados: 55,
    entrevistasRealizadas: 4,
    diasAberta: 7,
    slaPercent: 100,
    status: "Em andamento",
    etapas: buildEtapas(1, 2),
    comentarios: [],
  },
];

export function findVaga(codigo: string): Vaga | undefined {
  return VAGAS.find((v) => v.codigo.toLowerCase() === codigo.trim().toLowerCase());
}
