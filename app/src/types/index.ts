// Client property data
export interface Property {
  Address: string;
  ServiceType: string;
  Fee: string;
  Invoice: string;
  RenewalDate: string;
  Condo: string;
  CondoContact: string;
  CondoPayment: string;
  Insurance: string;
  Tenant: string;
  TenantContact: string;
  Rent: string;
  LeaseStart: string;
  LeaseEnd: string;
  Observations: string;
}

// Annual status tracking
export interface YearlyStatus {
  fundos: boolean;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  seguro: boolean;
  faturacao: boolean;
}

// Renewal workflow tracking
export interface RenewalStatus {
  mensagemEnviada: boolean;
  pagamentoRecebido: boolean;
  faturado: boolean;
}

// Client data from JSON
export interface Client {
  File: string;
  Name: string;
  FolderLink: string;
  Email: string;
  AlternativeEmails?: string[];
  NIF: string;
  Agent: string;
  Bank: string;
  Source: string;
  Active: boolean;
  RenewalMonth?: number; // 1-12
  Properties: Property[];
  status2026?: YearlyStatus;
  renewal2026?: RenewalStatus;
}

// Simple todo/task
export interface Todo {
  id: string;
  clientFile?: string;  // optional link to client
  text: string;
  done: boolean;
  createdAt: string;
}

// Payment tracking (documents workflow)
export interface Payment {
  id: string;
  clientFile: string;
  clientName: string;
  description: string;
  createdAt: string;
  fatura: boolean;
  comprovativo: boolean;
  recibo: boolean;
  enviado: boolean;
  dossie: boolean;
}

// Task status
export type TarefaStatus = 'Pendente' | 'Em progresso' | 'Aguardar Resposta' | 'Concluído';

// Who we're waiting on
export type EnviadoA = 'Técnico' | 'Senhorio' | 'Condo' | 'Inquilino' | 'Seguradora' | 'Outro';

// Task data
export interface Tarefa {
  id: string;
  createdAt: string;
  clientFile: string;
  clientName: string;
  description: string;
  status: TarefaStatus;
  sentTo?: EnviadoA;
  sentDate?: string;
  followUpDate?: string;
  documents?: string;
  notes?: string;
}
