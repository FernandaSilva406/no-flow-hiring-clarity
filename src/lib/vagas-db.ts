export const STATUS_OPTIONS = [
  { value: "abertura", label: "Abertura" },
  { value: "aprovacao_people", label: "Aprovação People" },
  { value: "aprovacao_financeiro", label: "Aprovação Financeiro" },
  { value: "hunting", label: "Hunting" },
  { value: "papo_people", label: "Papo com People" },
  { value: "case", label: "Case" },
  { value: "papo_gestor", label: "Papo com Gestor" },
  { value: "proposta", label: "Proposta" },
  { value: "fechada", label: "Fechada" },
  { value: "congelada", label: "Congelada" },
] as const;

export type VagaStatus = (typeof STATUS_OPTIONS)[number]["value"];

export const statusLabel = (s: string) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;

export type VagaRow = {
  id: string;
  codigo: string;
  nome: string;
  gestor: string;
  recruiter: string;
  area: string | null;
  tem_case: boolean;
  candidatos_abordados: number;
  candidatos_papo_people: number;
  candidatos_papo_gestor: number;
  candidatos_case: number;
  status: VagaStatus;
  created_at: string;
  updated_at: string;
};
