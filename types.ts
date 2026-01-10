
export enum UserRole {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN'
}

export enum ServiceStatus {
  REALIZADO = 'REALIZADO',
  CANCELADO = 'CANCELADO'
}

export enum CancelledBy {
  CLIENTE = 'CLIENTE',
  TECNICO = 'TÉCNICO',
  CENTRAL = 'CENTRAL'
}

export enum ServiceType {
  INSTALACAO = 'Instalação',
  RETIRADA = 'Retirada',
  MANUTENCAO = 'Manutenção'
}

export enum Company {
  AIROCLUBE = 'Airoclube',
  AIROTRACKER = 'Airotracker',
  CARTRAC = 'Cartrac'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

export interface Service {
  id: string;
  date: string;
  customerName: string;
  neighborhood: string;
  type: ServiceType;
  company: Company;
  vehicle: string;
  plate: string;
  value: number;
  status: ServiceStatus;
  technicianId: string;
  technicianName: string;
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
}
