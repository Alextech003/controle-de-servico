
import { createClient } from '@supabase/supabase-js';
import { Service, User, ServiceType, Company, ServiceStatus, CancelledBy, UserRole, Reimbursement, ReimbursementType, ReimbursementStatus } from '../types';

// =========================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =========================================================================

const SUPABASE_URL = 'https://ixlvpojlqtkrsklvigfw.supabase.co';

// ⚠️ IMPORTANTE: SUBSTITUA O TEXTO ABAIXO PELA SUA CHAVE 'anon' 'public' DO SUPABASE
const SUPABASE_KEY = 'sb_publishable_auyAV6NE0ut649mZoCaVVg_kLGEDhK0'; 

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
  cancelledBy: s.cancelled_by as CancelledBy
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
  cancelled_by: s.cancelledBy
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
