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

// Client data from JSON
export interface Client {
  File: string;
  Name: string;
  FolderLink: string;
  Email: string;
  NIF: string;
  Agent: string;
  Bank: string;
  Source: string;
  Active: boolean;
  Properties: Property[];
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
