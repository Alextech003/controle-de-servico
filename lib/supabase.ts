
import { createClient } from '@supabase/supabase-js';
import { Service, User, ServiceType, Company, ServiceStatus, CancelledBy, UserRole, Reimbursement, ReimbursementType, ReimbursementStatus, Tracker, TrackerStatus } from '../types';

// =========================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =========================================================================

// 1. A URL do seu projeto Supabase
const SUPABASE_URL = 'https://ixlvpojlqtkrsklvigfw.supabase.co';

// 2. A CHAVE API (Configurada e Pronta!)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bHZwb2pscXRrcnNrbHZpZ2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODA5NTYsImV4cCI6MjA4MzY1Njk1Nn0.5QR_D93ZV9l9z619JP4HaJRin3AolfdmjqAVbqPO2j4'; 

// Cria a conexão.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================================================
// MAPPERS (Converte dados do Banco Snake_Case para o App CamelCase e vice-versa)
// =========================================================================

export const mapServiceFromDB = (s: any): Service => ({
  id: s.id,
  date: s.date,
  customerName: s.customer_name,
  neighborhood: s.neighborhood || '',
  type: s.type as ServiceType,
  company: s.company as Company,
  vehicle: s.vehicle || '',
  plate: s.plate,
  value: Number(s.value),
  status: s.status as ServiceStatus,
  technicianId: s.technician_id,
  technicianName: s.technician_name,
  cancellationReason: s.cancellation_reason,
  cancelledBy: s.cancelled_by as CancelledBy,
  imei: s.imei // Mapeando IMEI
});

export const mapServiceToDB = (s: Partial<Service>) => ({
  id: s.id,
  date: s.date,
  customer_name: s.customerName,
  neighborhood: s.neighborhood,
  type: s.type,
  company: s.company,
  vehicle: s.vehicle,
  plate: s.plate,
  value: s.value,
  status: s.status,
  technician_id: s.technicianId,
  technician_name: s.technicianName,
  cancellation_reason: s.cancellationReason,
  cancelled_by: s.cancelledBy,
  imei: s.imei // Salvando IMEI
});

export const mapUserFromDB = (u: any): User => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  password: u.password,
  role: u.role as UserRole,
  isActive: u.is_active,
  avatar: u.avatar
});

export const mapUserToDB = (u: Partial<User>) => ({
  id: u.id,
  name: u.name,
  phone: u.phone,
  password: u.password,
  role: u.role,
  is_active: u.isActive,
  avatar: u.avatar
});

export const mapReimbursementFromDB = (r: any): Reimbursement => ({
  id: r.id,
  date: r.date,
  type: r.type as ReimbursementType,
  description: r.description,
  value: Number(r.value),
  receiptUrl: r.receipt_url,
  status: r.status as ReimbursementStatus,
  technicianId: r.technician_id,
  technicianName: r.technician_name
});

export const mapReimbursementToDB = (r: Partial<Reimbursement>) => ({
  id: r.id,
  date: r.date,
  type: r.type,
  description: r.description,
  value: r.value,
  receipt_url: r.receiptUrl,
  status: r.status,
  technician_id: r.technicianId,
  technician_name: r.technicianName
});

export const mapTrackerFromDB = (t: any): Tracker => ({
  id: t.id,
  date: t.date,
  model: t.model,
  imei: t.imei,
  company: t.company as Company, // Adicionado mapeamento de empresa
  status: t.status as TrackerStatus,
  technicianId: t.technician_id,
  technicianName: t.technician_name,
  installationDate: t.installation_date
});

export const mapTrackerToDB = (t: Partial<Tracker>) => ({
  id: t.id,
  date: t.date,
  model: t.model,
  imei: t.imei,
  company: t.company, // Adicionado mapeamento de empresa
  status: t.status,
  technician_id: t.technicianId,
  technician_name: t.technicianName,
  installation_date: t.installationDate
});
