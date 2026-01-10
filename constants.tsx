
import { User, UserRole, Service, ServiceStatus, ServiceType, Company, CancelledBy } from './types';

export const MOCK_USERS: User[] = [
  { id: 'master_main', name: 'ADM', phone: '00000000000', role: UserRole.MASTER, isActive: true, password: '29031992' },
  { id: '1', name: 'Alex Master', phone: '21999999999', role: UserRole.MASTER, isActive: true, password: '123' },
  { id: '2', name: 'Mariana Admin', phone: '21988888888', role: UserRole.ADMIN, isActive: true, password: '123' },
  { id: '3', name: 'José Técnico', phone: '21977777777', role: UserRole.TECHNICIAN, isActive: true, password: '123' },
  { id: '4', name: 'Lucas Silva', phone: '21966666666', role: UserRole.TECHNICIAN, isActive: true, password: '123' },
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    date: '2024-01-08',
    customerName: 'ALBERTO MAIA ALVES',
    neighborhood: 'ITAGUAÍ',
    type: ServiceType.INSTALACAO,
    company: Company.AIROCLUBE,
    vehicle: 'FORD ECOSPORT',
    plate: 'LUY2565',
    value: 50,
    status: ServiceStatus.REALIZADO,
    technicianId: '3',
    technicianName: 'José Técnico'
  },
  {
    id: 's2',
    date: '2024-01-08',
    customerName: 'ANNA CLARA ELEUTERIO MESQUITA',
    neighborhood: 'CAMPO GRANDE',
    type: ServiceType.MANUTENCAO,
    company: Company.AIROCLUBE,
    vehicle: 'HONDA CITY',
    plate: 'LPV4I99',
    value: 50,
    status: ServiceStatus.REALIZADO,
    technicianId: '3',
    technicianName: 'José Técnico'
  },
  {
    id: 's3',
    date: '2024-01-07',
    customerName: 'LUCAS DE ARAUJO FERNANDES',
    neighborhood: 'CAMPO GRANDE',
    type: ServiceType.INSTALACAO,
    company: Company.AIROTRACKER,
    vehicle: 'VOLVO NL10',
    plate: 'KQI4J50',
    value: 50,
    status: ServiceStatus.REALIZADO,
    technicianId: '4',
    technicianName: 'Lucas Silva'
  },
  {
    id: 's4',
    date: '2024-01-07',
    customerName: 'MARIA DA PENHA',
    neighborhood: 'GUARATIBA',
    type: ServiceType.RETIRADA,
    company: Company.AIROTRACKER,
    vehicle: 'FIAT PALIO',
    plate: 'KXP4589',
    value: 50,
    status: ServiceStatus.CANCELADO,
    technicianId: '4',
    technicianName: 'Lucas Silva',
    cancellationReason: 'Cliente não estava no local',
    cancelledBy: CancelledBy.TECNICO
  }
];
