
export enum InvoiceStatus {
  PAID = 'paid',
  PENDING = 'pending',
  OVERDUE = 'overdue',
  DRAFT = 'draft'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  dueDate: string;
  createdAt: number;
  tax: number;
  notes?: string;
}

export interface BusinessProfile {
  name: string;
  email: string;
  address: string;
  currency: string;
  logoUrl?: string;
}

export type ViewType = 'landing' | 'auth' | 'dashboard' | 'invoices' | 'clients' | 'settings' | 'profile' | 'data-entry';

export interface UserState {
  isLoggedIn: boolean;
  isPro: boolean;
  profile: BusinessProfile;
}
