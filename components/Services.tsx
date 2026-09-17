
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit, X, Save, 
  MessageSquare, Table as TableIcon,
  ArrowRight, CopyPlus, Loader2,
  Users as UsersIcon, Check, XCircle, ChevronLeft, ChevronRight,
  MapPin, CalendarDays, Car, Barcode, Box, DollarSign,
  ScanBarcode, Cpu, RefreshCw, LogOut as LogOutIcon, ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { 
  Service, ServiceStatus, ServiceType, Company, 
  User, UserRole, CancelledBy, Tracker, TrackerStatus
} from '../types';

interface ServicesProps {
  services: Service[];
  currentUser: User;
  users: User[];
  onSaveService: (service: Service) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  viewingTechnicianId: string | null;
  onClearFilter: () => void;
  onFilterByTech: (id: string) => void;
  trackers?: Tracker[];
}

const TRACKER_MODELS = [
  "Suntech 310",
  "Suntech 8310",
  "Nonus N4",
  "Genérico J16",
  "Lumiar LT32",
  "Lumiar LT32-PRO",
  "Queclink GV55",
  "Queclink GV57",
  "NT20",
  "TR05"
];

const Services: React.FC<ServicesProps> = ({ 
  services, currentUser, users, onSaveService, onDeleteService, 
  viewingTechnicianId, onClearFilter, onFilterByTech, trackers = []
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingReason, setViewingReason] = useState<Service | null>(null);
  const [viewingImproductiveReason, setViewingImproductiveReason] = useState<Service | null>(null);
  
  // Alterado: Agora armazena o SERVIÇO inteiro para ver Instalado E Retirado
  const [viewingServiceEquipment, setViewingServiceEquipment] = useState<Service | null>(null);
  
  // Controle do Autocomplete do IMEI
  const [showImeiSuggestions, setShowImeiSuggestions] = useState(false);
  
  // Estado para controlar qual item está sendo deletado (confirmação visual)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'realized' | 'improductive' | 'cancelled'>('realized');
  const [isSaving, setIsSaving] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Estatísticas do mês para os botões de filtro e destaque da conferente
  const monthlyStats = useMemo(() => {
    const monthServices = services.filter(s => {
      const sDate = new Date(s.date + 'T12:00:00');
      return sDate.getMonth() === selectedMonth && sDate.getFullYear() === selectedYear;
    });
    const realized = monthServices.filter(s => s.status === ServiceStatus.REALIZADO).length;
    const improductive = monthServices.filter(s => s.status === ServiceStatus.IMPRODUTIVO).length;
    const cancelled = monthServices.filter(s => s.status === ServiceStatus.CANCELADO).length;
    return {
      total: monthServices.length,
      realized,
      improductive,
      realizedWithImproductive: realized + improductive,
      cancelled
    };
  }, [services, selectedMonth, selectedYear]);

  // Funções de navegação do mês
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev - 1;
      if (newMonth < 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      const newMonth = prev + 1;
      if (newMonth > 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return newMonth;
    });
  };

  const initialFormState: Partial<Service> = {
    date: new Date().toISOString().split('T')[0],
    status: ServiceStatus.REALIZADO,
    value: 0.00,
    type: ServiceType.INSTALACAO,
    company: Company.AIROCLUBE,
    customerName: '',
    neighborhood: '',
    vehicle: '',
    plate: '',
    cancellationReason: '',
    cancelledBy: undefined,
    improductiveReason: '',
    imei: '',
    hasExchange: false,
    removedImei: '',
    removedModel: '',
    removedCompany: Company.AIROCLUBE
  };

  const [formData, setFormData] = useState<Partial<Service>>(initialFormState);

  // Lógica de Autocomplete do IMEI
  const suggestedTrackers = useMemo(() => {
    // Se não tiver digitando nada, não mostra
    if (!formData.imei) return [];

    // Identifica quem é o técnico responsável pelo serviço atual
    // Se for um novo serviço, é o usuário atual (ou o admin não está filtrando)
    // Se for edição, é o técnico dono do serviço
    const targetTechId = editingService ? editingService.technicianId : (viewingTechnicianId || currentUser.id);

    return trackers.filter(t => 
      t.status === TrackerStatus.DISPONIVEL && // Só disponíveis
      t.technicianId === targetTechId && // Só do estoque do técnico
      t.imei.includes(formData.imei!) // Que contém o texto digitado
    ).slice(0, 5); // Limita a 5 sugestões
  }, [trackers, formData.imei, editingService, viewingTechnicianId, currentUser.id]);

  const handleSelectImei = (tracker: Tracker) => {
    setFormData({ ...formData, imei: tracker.imei });
    setShowImeiSuggestions(false);
  };

  // Funções de Máscara de Moeda (Igual a Reimbursements)
  const formatCurrencyValue = (value: number) => {
    if (value === undefined || value === null) return '0,00';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) rawValue = '0';
    const floatValue = parseInt(rawValue, 10) / 100;
    setFormData({ ...formData, value: floatValue });
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const sDate = new Date(s.date + 'T12:00:00');
      const matchesMonth = sDate.getMonth() === selectedMonth && sDate.getFullYear() === selectedYear;
      const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || 
                            (activeFilter === 'realized' && (s.status === ServiceStatus.REALIZADO || s.status === ServiceStatus.IMPRODUTIVO)) || 
                            (activeFilter === 'improductive' && s.status === ServiceStatus.IMPRODUTIVO) ||
                            (activeFilter === 'cancelled' && s.status === ServiceStatus.CANCELADO);
      return matchesMonth && matchesSearch && matchesFilter;
    });
  }, [services, searchTerm, activeFilter, selectedMonth, selectedYear]);

  // Agrupamento por Data para a visualização
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
        if (!groups[service.date]) {
            groups[service.date] = [];
        }
        groups[service.date].push(service);
    });
    // Retorna ordenado (as chaves do objeto não garantem ordem, então vamos manipular no render)
    return groups;
  }, [filteredServices]);

  // Helper para estilos de badge (Tipo de Serviço)
  const getTypeStyle = (type: ServiceType) => {
    switch (type) {
        case ServiceType.INSTALACAO: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case ServiceType.MANUTENCAO: return 'bg-amber-100 text-amber-700 border-amber-200';
        case ServiceType.RETIRADA: return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper para estilos de badge (Empresa)
  const getCompanyStyle = (company: Company) => {
      switch (company) {
          case Company.AIROCLUBE: return 'bg-purple-100 text-purple-700 border-purple-200';
          case Company.CARTRAC: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
          case Company.AIROTRACKER: return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  const handleExportExcel = () => {
    const headers = "Data;Cliente;Bairro;Tipo;Empresa;Veículo;Placa;Valor;Status;Motivo Improdutivo / Cancelamento;IMEI;Técnico\n";
    const csv = filteredServices.map(s => {
      const reason = s.status === ServiceStatus.IMPRODUTIVO 
        ? (s.improductiveReason || '') 
        : s.status === ServiceStatus.CANCELADO 
        ? `${s.cancellationReason || ''} (${s.cancelledBy || ''})` 
        : '';
      return `${s.date};${s.customerName};${s.neighborhood};${s.type};${s.company};${s.vehicle};${s.plate};${s.value.toFixed(2)};${s.status};${reason.replace(/;/g, ',')};${s.imei || ''};${s.technicianName}`;
    }).join("\n");
    const blob = new Blob(["\ufeff" + headers + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `servicos_${months[selectedMonth]}_${selectedYear}.csv`;
    link.click();
  };

  const handleSave = async (keepOpen: boolean = false) => {
    if (!formData.customerName || !formData.date || !formData.plate) {
      alert("Por favor, preencha o Nome do Cliente, Data e Placa."); 
      return;
    }

    if (formData.status === ServiceStatus.IMPRODUTIVO && !formData.improductiveReason?.trim()) {
      alert("Por favor, informe o motivo pelo qual o serviço ficou improdutivo.");
      return;
    }

    setIsSaving(true);

    const serviceToSave: Service = {
        ...initialFormState,
        ...formData,
        id: editingService ? editingService.id : Math.random().toString(36).substring(2, 11),
        technicianId: editingService ? editingService.technicianId : currentUser.id,
        technicianName: editingService ? editingService.technicianName : currentUser.name
    } as Service;

    await onSaveService(serviceToSave);
    setIsSaving(false);
    
    if (keepOpen) { 
      setFormData(prev => ({
        ...prev,
        vehicle: '', 
        plate: '',
        imei: '',
        improductiveReason: '',
        hasExchange: false,
        removedImei: '',
        removedModel: ''
      }));
      setEditingService(null); 
    } else { 
      setShowForm(false); 
      setEditingService(null); 
    }
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmingDeleteId(id);
  };

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onDeleteService(id);
    setConfirmingDeleteId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);
  };

  const openEquipmentModal = (e: React.MouseEvent, service: Service) => {
      e.stopPropagation();
      setViewingServiceEquipment(service);
  };

  const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  const canEdit = currentUser.role !== UserRole.ADMIN;

  // Renderização condicional dos campos de retirada
  const shouldShowRemovalFields = formData.type === ServiceType.RETIRADA || (formData.type === ServiceType.MANUTENCAO && formData.hasExchange);

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {isAdmin && (
        <aside className="hidden lg:flex w-56 bg-white border-r border-slate-100 p-6 flex-col space-y-6 overflow-y-auto print:hidden">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center">
            <UsersIcon className="mr-2 text-[#00AEEF]" size={20} /> Equipe
          </h2>
          <button onClick={onClearFilter} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all font-bold ${!viewingTechnicianId ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}>
            <span className="text-xs">Todos</span>
            {!viewingTechnicianId && <ArrowRight size={14} />}
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          {users.filter(u => u.role === UserRole.TECHNICIAN).map(tech => (
            <button key={tech.id} onClick={() => onFilterByTech(tech.id)} className={`w-full flex items-center space-x-3 p-3 rounded-2xl border transition-all ${viewingTechnicianId === tech.id ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] flex items-center justify-center font-black text-[10px]">{tech.name.charAt(0)}</div>
              <p className="font-black text-[10px] uppercase truncate">{tech.name}</p>
            </button>
          ))}
        </aside>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 print:p-0 bg-slate-50/30">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Serviços</h1>
            <p className="text-slate-500 font-medium text-xs">Relatório Detalhado</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
             <div className="flex items-center justify-between space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors group">
                  <ChevronLeft size={18} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                </button>
                <div className="px-2 text-center min-w-[100px] font-black uppercase text-[10px] text-slate-800">{months[selectedMonth]} {selectedYear}</div>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors group">
                  <ChevronRight size={18} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                </button>
             </div>

             <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center space-x-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">
                  <FileText size={16} className="text-[#00AEEF]" /> <span className="hidden lg:inline">PDF</span>
                </button>
                <button onClick={handleExportExcel} className="flex items-center space-x-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">
                  <TableIcon size={16} className="text-emerald-500" /> <span className="hidden lg:inline">Excel</span>
                </button>
                {canEdit && (
                  <button onClick={() => { setEditingService(null); setFormData(initialFormState); setShowForm(true); }} className="px-4 py-2.5 bg-[#0A192F] text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
                    <Plus size={16} className="inline mr-1 text-[#00AEEF]" /> <span className="hidden lg:inline">Novo</span>
                  </button>
                )}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Buscar por cliente, placa ou bairro..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 shadow-sm text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl space-x-1 shadow-sm">
              <button 
                onClick={() => setActiveFilter('realized')} 
                className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeFilter === 'realized' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Realizados</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeFilter === 'realized' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {monthlyStats.realizedWithImproductive}
                </span>
              </button>

              <button 
                onClick={() => setActiveFilter('improductive')} 
                className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeFilter === 'improductive' ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400' : 'text-amber-800 bg-amber-50/50 hover:bg-amber-100'
                }`}
                title="Filtrar apenas serviços improdutivos para conferência"
              >
                <AlertTriangle size={12} className={activeFilter === 'improductive' ? 'text-slate-950' : 'text-amber-600'} />
                <span>Improdutivos</span>
                {monthlyStats.improductive > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeFilter === 'improductive' ? 'bg-slate-950 text-amber-400' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {monthlyStats.improductive}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveFilter('cancelled')} 
                className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeFilter === 'cancelled' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Cancelados</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeFilter === 'cancelled' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {monthlyStats.cancelled}
                </span>
              </button>
          </div>
        </div>

        {/* Banner de Destaque da Conferente para Serviços Improdutivos */}
        {monthlyStats.improductive > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 bg-amber-50 border-2 border-amber-300/80 rounded-2xl text-amber-900 shadow-sm print:hidden animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                  <span>Atenção Conferente</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                    {monthlyStats.improductive} serviço{monthlyStats.improductive > 1 ? 's' : ''} improdutivo{monthlyStats.improductive > 1 ? 's' : ''} no mês
                  </span>
                </p>
                <p className="text-[11px] text-amber-800 font-semibold">
                  Identificados com fundo e tarja amarela na tabela abaixo para validação e pagamento do técnico.
                </p>
              </div>
            </div>
            {activeFilter !== 'improductive' && (
              <button
                type="button"
                onClick={() => setActiveFilter('improductive')}
                className="self-start sm:self-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1 cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle size={12} />
                <span>Ver Apenas Improdutivos</span>
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden print:border-slate-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">Data</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 whitespace-nowrap">Cliente</th>
                  <th className="px-3 py-3 whitespace-nowrap">Bairro</th>
                  <th className="px-2 py-3 text-center whitespace-nowrap">Tipo</th>
                  <th className="px-2 py-3 text-center whitespace-nowrap">Empresa</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Veículo</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Placa</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Valor</th>
                  <th className="px-3 py-3 print:hidden text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.keys(groupedServices).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</td>
                  </tr>
                ) : (
                  Object.keys(groupedServices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                    <React.Fragment key={date}>
                        {/* Linha Divisória de Data */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={10} className="px-3 py-2">
                                <div className="flex items-center w-full">
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                    <div className="px-3 py-1 bg-white border border-blue-100 rounded-full flex items-center space-x-2 shadow-sm mx-4">
                                        <CalendarDays size={12} className="text-[#00AEEF]" />
                                        <span className="text-[10px] font-black text-slate-700 uppercase">
                                            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                </div>
                            </td>
                        </tr>

                        {/* Serviços do Dia */}
                        {groupedServices[date].map((s) => {
                          const isImproductive = s.status === ServiceStatus.IMPRODUTIVO;
                          const isCancelled = s.status === ServiceStatus.CANCELADO;

                          return (
                            <tr 
                              key={s.id} 
                              className={`transition-colors group border-l-4 ${
                                isImproductive 
                                  ? 'bg-amber-50/90 hover:bg-amber-100/90 border-l-amber-500 shadow-[inset_0_1px_0_rgba(245,158,11,0.2)]' 
                                  : isCancelled 
                                  ? 'bg-rose-50/40 hover:bg-rose-50/80 border-l-rose-400 opacity-80' 
                                  : 'hover:bg-slate-50/80 border-l-transparent'
                              }`}
                            >
                                <td className="px-3 py-2 text-[10px] font-bold text-slate-400 whitespace-nowrap">{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                
                                {/* Coluna de Status com Super Destaque para Improdutivo */}
                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                  {isImproductive ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-amber-500 text-slate-950 border border-amber-600 shadow-sm animate-pulse tracking-wider">
                                      <AlertTriangle size={11} className="text-slate-950 flex-shrink-0" />
                                      IMPRODUTIVO
                                    </span>
                                  ) : isCancelled ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                                      CANCELADO
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      REALIZADO
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-2 text-[10px] uppercase max-w-[150px]" title={s.customerName}>
                                  <p className="font-black text-slate-800 truncate">{s.customerName}</p>
                                  {isImproductive && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingImproductiveReason(s)}
                                      className="inline-flex items-center gap-1 text-[8px] font-black text-amber-900 uppercase bg-amber-200/90 hover:bg-amber-300 px-1.5 py-0.5 rounded mt-0.5 border border-amber-400 transition-colors cursor-pointer text-left"
                                      title="Clique para ver o motivo pelo qual ficou improdutivo"
                                    >
                                      <span>⚠️</span>
                                      <span className="truncate max-w-[120px]">
                                        {s.improductiveReason ? `Motivo: ${s.improductiveReason}` : 'Improdutivo • Recebível'}
                                      </span>
                                    </button>
                                  )}
                                </td>

                                <td className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase max-w-[100px] truncate" title={s.neighborhood}>
                                    <div className="flex items-center">
                                        <MapPin size={10} className="text-slate-300 mr-1" />
                                        {s.neighborhood}
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-center whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${getTypeStyle(s.type)}`}>
                                        {s.type.substring(0, 10)}{s.type.length > 10 ? '.' : ''}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-center whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${getCompanyStyle(s.company)}`}>
                                        {s.company.substring(0, 10)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-center whitespace-nowrap max-w-[250px] truncate" title={s.vehicle}>
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded max-w-full truncate">
                                        {s.vehicle || '-'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                    {/* PLACA COM ESTILO PERSONALIZADO: Fundo Cinza Médio, Letra Preta, Borda */}
                                    <span className="inline-block px-2 py-0.5 bg-[#cbd5e1] text-black border border-[#94a3b8] rounded text-[10px] font-black uppercase tracking-widest shadow-sm min-w-[70px]">
                                        {s.plate}
                                    </span>
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                    {isImproductive ? (
                                      <div>
                                        <span className="inline-block px-2 py-0.5 rounded bg-amber-200/90 border border-amber-400 text-[11px] font-black text-amber-950 shadow-xs">
                                          R$ {s.value.toFixed(2)}
                                        </span>
                                        <span className="block text-[8px] font-bold text-amber-700 uppercase tracking-tighter mt-0.5">
                                          Improdutivo
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-black text-slate-900">
                                        {s.value === 0 ? '' : `R$${s.value.toFixed(2)}`}
                                      </span>
                                    )}
                                </td>

                                <td className="px-3 py-2 print:hidden whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-1">
                                    {s.status === ServiceStatus.CANCELADO && (
                                      <button 
                                        type="button"
                                        onClick={() => setViewingReason(s)} 
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Ver motivo do cancelamento"
                                      >
                                        <MessageSquare size={14} />
                                      </button>
                                    )}

                                    {s.status === ServiceStatus.IMPRODUTIVO && (
                                      <button 
                                        type="button"
                                        onClick={() => setViewingImproductiveReason(s)} 
                                        className="p-1.5 text-amber-600 bg-amber-100/60 hover:bg-amber-100 rounded-lg transition-all ring-1 ring-amber-300"
                                        title="Ver motivo do serviço improdutivo"
                                      >
                                        <AlertTriangle size={14} />
                                      </button>
                                    )}
                                    
                                    {/* Botão de Ver Equipamento (Instalação, Troca ou Retirada) */}
                                    {(s.imei || s.removedImei) && (
                                        <button 
                                            onClick={(e) => openEquipmentModal(e, s)}
                                            className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                            title="Ver Equipamentos (Instalado/Retirado)"
                                        >
                                            <ScanBarcode size={14} />
                                        </button>
                                    )}

                                    {canEdit && (
                                        <>
                                        {confirmingDeleteId === s.id ? (
                                            <div className="flex items-center bg-rose-50 rounded-lg p-0.5 animate-in zoom-in duration-200">
                                            <button onClick={(e) => confirmDelete(e, s.id)} className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors mr-1">
                                                <Check size={12} strokeWidth={3} />
                                            </button>
                                            <button onClick={cancelDelete} className="p-1 text-slate-500 hover:bg-slate-200 rounded hover:text-slate-700 transition-colors">
                                                <XCircle size={12} />
                                            </button>
                                            </div>
                                        ) : (
                                            <>
                                            <button type="button" onClick={() => {setEditingService(s); setFormData(s); setShowForm(true);}} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Edit size={14} />
                                            </button>
                                            <button type="button" onClick={(e) => initiateDelete(e, s.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                            </>
                                        )}
                                        </>
                                    )}
                                    </div>
                                </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 backdrop-blur-md p-4 print:hidden overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{editingService ? 'Editar Registro' : 'Lançar Novo Serviço'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 md:p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-6 md:p-10 space-y-6 md:space-y-8 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Nome Completo do Cliente *</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black uppercase" value={formData.customerName || ''} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Data *</label>
                  <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black [color-scheme:light]" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Bairro / Região</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black uppercase" value={formData.neighborhood || ''} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Veículo (Marca/Modelo)</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black uppercase" value={formData.vehicle || ''} onChange={(e) => setFormData({...formData, vehicle: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Placa *</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black uppercase" value={formData.plate || ''} onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Valor do Serviço R$ *</label>
                  <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black" 
                        value={formatCurrencyValue(formData.value || 0)} 
                        onChange={handleCurrencyChange} 
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Empresa</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value as Company})}>
                    {Object.values(Company).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Tipo de Serviço</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ServiceType})}>
                    {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Status Final *</label>
                  <select 
                    className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-black text-sm transition-all ${
                      formData.status === ServiceStatus.REALIZADO 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : formData.status === ServiceStatus.IMPRODUTIVO 
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/50' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`} 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as ServiceStatus})}
                  >
                    <option value={ServiceStatus.REALIZADO}>✅ REALIZADO</option>
                    <option value={ServiceStatus.IMPRODUTIVO}>⚠️ IMPRODUTIVO (RECEBÍVEL PELO TÉCNICO)</option>
                    <option value={ServiceStatus.CANCELADO}>❌ CANCELADO</option>
                  </select>

                  {formData.status === ServiceStatus.IMPRODUTIVO && (
                    <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-black uppercase tracking-wide text-amber-950">Serviço Improdutivo • Remuneração do Técnico</p>
                        <p className="font-medium text-amber-800 mt-1 leading-relaxed">
                          O técnico receberá o valor preenchido no campo <strong>"Valor do Serviço R$"</strong>. 
                          Esse serviço constará na listagem com <strong>tarja amarela em destaque</strong> para que a conferente identifique e valide o pagamento imediatamente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- LÓGICA DE INSTALAÇÃO (IMEI) --- */}
                {(formData.type === ServiceType.INSTALACAO || (formData.type === ServiceType.MANUTENCAO && formData.hasExchange)) && (
                    <div className="relative">
                      <label className="block text-xs font-black text-emerald-600 uppercase mb-3 ml-1">
                          {formData.type === ServiceType.MANUTENCAO ? 'NOVO Equipamento Instalado' : 'IMEI Equipamento Instalado'}
                      </label>
                      <div className="relative z-20">
                         <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 font-black" 
                            placeholder="IMEI a instalar..." 
                            value={formData.imei || ''} 
                            onChange={(e) => {
                               setFormData({...formData, imei: e.target.value.replace(/\D/g, '')});
                               setShowImeiSuggestions(true);
                            }} 
                            onFocus={() => setShowImeiSuggestions(true)}
                         />
                         
                         {showImeiSuggestions && suggestedTrackers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                               <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                  Estoque Disponível
                               </div>
                               {suggestedTrackers.map((tracker) => (
                                  <button
                                     key={tracker.id}
                                     onClick={() => handleSelectImei(tracker)}
                                     className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                                  >
                                     <div className="flex items-center space-x-3">
                                        <Box size={16} className="text-slate-400 group-hover:text-[#00AEEF]" />
                                        <div>
                                           <p className="text-xs font-black text-slate-700 group-hover:text-[#00AEEF]">{tracker.imei}</p>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase">{tracker.model}</p>
                                        </div>
                                     </div>
                                     <ArrowRight size={14} className="text-slate-300 group-hover:text-[#00AEEF]" />
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                      <p className="text-[9px] text-emerald-600 mt-1 ml-1 font-bold">Baixa automática de estoque.</p>
                    </div>
                )}

                {/* --- LÓGICA DE MANUTENÇÃO (PERGUNTA DE TROCA) --- */}
                {formData.type === ServiceType.MANUTENCAO && (
                    <div className="md:col-span-3 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-amber-800 uppercase">Houve troca de equipamento?</p>
                            <p className="text-[10px] text-amber-600 font-medium">Marque se você retirou um equipamento antigo e colocou um novo.</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setFormData({...formData, hasExchange: true})}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${formData.hasExchange ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}
                             >
                                Sim, Troquei
                             </button>
                             <button 
                                onClick={() => setFormData({...formData, hasExchange: false})}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${!formData.hasExchange ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-white text-slate-400 border-slate-200'}`}
                             >
                                Não
                             </button>
                        </div>
                    </div>
                )}

                {/* --- LÓGICA DE RETIRADA / TROCA (CAMPOS DE DEVOLUÇÃO) --- */}
                {shouldShowRemovalFields && (
                    <div className="md:col-span-3 bg-red-50 p-6 rounded-[2rem] border border-red-100 animate-in slide-in-from-top-4 space-y-4">
                        <div className="flex items-center space-x-2 text-red-600 mb-2">
                            <LogOutIcon size={20} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Dados do Equipamento Retirado</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-red-400 uppercase mb-2 ml-1">IMEI Retirado</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 bg-white border-2 border-red-100 rounded-xl outline-none focus:border-red-400 text-slate-900 font-black"
                                    placeholder="Digite o IMEI..."
                                    value={formData.removedImei || ''}
                                    onChange={(e) => setFormData({...formData, removedImei: e.target.value.replace(/\D/g, '')})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-red-400 uppercase mb-2 ml-1">Modelo</label>
                                <select 
                                    className="w-full px-4 py-3 bg-white border-2 border-red-100 rounded-xl outline-none focus:border-red-400 text-slate-900 font-black uppercase"
                                    value={formData.removedModel || ''}
                                    onChange={(e) => setFormData({...formData, removedModel: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {TRACKER_MODELS.map(m => (
                                        <option key={m} value={m}>{m.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-red-400 uppercase mb-2 ml-1">Empresa</label>
                                <select 
                                    className="w-full px-4 py-3 bg-white border-2 border-red-100 rounded-xl outline-none focus:border-red-400 text-slate-900 font-black"
                                    value={formData.removedCompany}
                                    onChange={(e) => setFormData({...formData, removedCompany: e.target.value as Company})}
                                >
                                    {Object.values(Company).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <p className="text-[10px] text-red-500 font-bold bg-white/50 p-2 rounded-lg border border-red-100 inline-block">
                            Este equipamento será enviado para a lista de "AGUARDANDO DEVOLUÇÃO".
                        </p>
                    </div>
                )}
              </div>

              {formData.status === ServiceStatus.CANCELADO && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8 bg-rose-50 rounded-[2rem] border border-rose-100 animate-in slide-in-from-top-4">
                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase mb-3 ml-1">Motivo do Cancelamento *</label>
                    <input type="text" className="w-full px-5 py-4 bg-white border-2 border-rose-200 rounded-2xl outline-none focus:border-rose-500 text-rose-900 font-bold" value={formData.cancellationReason || ''} onChange={(e) => setFormData({...formData, cancellationReason: e.target.value})} placeholder="Ex: Cliente cancelou na chegada..." />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase mb-3 ml-1">Cancelado Por *</label>
                    <select className="w-full px-5 py-4 bg-white border-2 border-rose-200 rounded-2xl outline-none focus:border-rose-500 text-rose-900 font-black" value={formData.cancelledBy} onChange={(e) => setFormData({...formData, cancelledBy: e.target.value as CancelledBy})}>
                      <option value="">Selecione...</option>
                      {Object.values(CancelledBy).map(cb => <option key={cb} value={cb}>{cb}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formData.status === ServiceStatus.IMPRODUTIVO && (
                <div className="p-6 md:p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-300 animate-in slide-in-from-top-4 space-y-4">
                  <div className="flex items-center space-x-3 text-amber-900">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wide text-amber-950">Por que o serviço ficou improdutivo? *</h4>
                      <p className="text-[11px] text-amber-800 font-semibold">
                        Descreva o ocorrido em detalhes para justificar o deslocamento e validar a remuneração com a conferente.
                      </p>
                    </div>
                  </div>

                  <div>
                    <textarea 
                      className="w-full px-5 py-4 bg-white border-2 border-amber-200 rounded-2xl outline-none focus:border-amber-500 text-amber-950 font-bold text-sm min-h-[90px] shadow-inner placeholder:text-amber-400/80" 
                      value={formData.improductiveReason || ''} 
                      onChange={(e) => setFormData({...formData, improductiveReason: e.target.value})}
                      placeholder="Ex: Cliente ausente no endereço agendado, aguardado por 40 min e tentativas de contato por ligação sem retorno..."
                    />
                  </div>

                  {/* Sugestões rápidas de motivos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-black uppercase text-amber-800 self-center mr-1">Sugestões rápidas:</span>
                    {[
                      'Cliente ausente no local',
                      'Veículo não estava disponível',
                      'Endereço incorreto / Inacessível',
                      'Cliente não autorizou o serviço no momento',
                      'Problema elétrico / mecânico do veículo'
                    ].map((reasonText) => (
                      <button
                        key={reasonText}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          improductiveReason: prev.improductiveReason ? `${prev.improductiveReason}; ${reasonText}` : reasonText
                        }))}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + {reasonText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end space-x-4">
                <button onClick={() => setShowForm(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={() => handleSave(false)} className="px-12 py-4 bg-[#0A192F] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#162942] transition-all flex items-center space-x-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="text-[#00AEEF]" />}
                  <span>{editingService ? 'Salvar Alterações' : 'Registrar Serviço'}</span>
                </button>
                {!editingService && (
                   <button onClick={() => handleSave(true)} className="px-8 py-4 bg-blue-50 text-blue-600 border border-blue-100 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-100 transition-all active:scale-95 hidden md:flex" disabled={isSaving}>
                     <CopyPlus size={18} className="mr-2" />
                     <span>Salvar + Novo</span>
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Cancelamento */}
      {viewingReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A192F]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 text-center space-y-6">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare size={32} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Motivo do Cancelamento</h3>
                    <p className="text-rose-600 font-bold text-sm bg-rose-50 p-4 rounded-xl border border-rose-100">"{viewingReason.cancellationReason}"</p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-4">Cancelado por: <span className="text-slate-600">{viewingReason.cancelledBy}</span></p>
                 </div>
                 <button onClick={() => setViewingReason(null)} className="w-full py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-200 transition-colors">
                    Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Detalhes do Serviço Improdutivo */}
      {viewingImproductiveReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A192F]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 space-y-6">
                 <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                       <AlertTriangle size={32} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block">
                       Serviço Improdutivo
                    </span>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">
                       Por que ficou improdutivo?
                    </h3>
                 </div>

                 <div className="bg-amber-50/80 p-5 rounded-2xl border-2 border-amber-200 text-left space-y-2">
                    <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Motivo Informado:</p>
                    <p className="text-slate-800 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                       {viewingImproductiveReason.improductiveReason || 'Nenhum motivo detalhado foi registrado.'}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="block text-[9px] font-black text-slate-400 uppercase">Cliente</span>
                       <span className="font-black text-slate-800 uppercase truncate block">{viewingImproductiveReason.customerName}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="block text-[9px] font-black text-slate-400 uppercase">Valor a Receber</span>
                       <span className="font-black text-amber-900 block">R$ {viewingImproductiveReason.value.toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="block text-[9px] font-black text-slate-400 uppercase">Veículo / Placa</span>
                       <span className="font-black text-slate-800 uppercase block">{viewingImproductiveReason.plate}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="block text-[9px] font-black text-slate-400 uppercase">Técnico</span>
                       <span className="font-black text-slate-800 uppercase block truncate">{viewingImproductiveReason.technicianName}</span>
                    </div>
                 </div>

                 <button 
                    onClick={() => setViewingImproductiveReason(null)} 
                    className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
                 >
                    Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Detalhes do Equipamento (INSTALADO, RETIRADO ou TROCA) */}
      {viewingServiceEquipment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A192F]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 space-y-6">
                 
                 {/* Header */}
                 <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                        <Cpu size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Equipamentos do Serviço</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Detalhes da movimentação</p>
                 </div>

                 <div className="space-y-4">
                    
                    {/* SEÇÃO DE EQUIPAMENTO INSTALADO */}
                    {viewingServiceEquipment.imei && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 relative overflow-hidden">
                           <div className="absolute right-0 top-0 p-2 opacity-10">
                              <Check size={60} className="text-emerald-600" />
                           </div>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center">
                              <Check size={12} className="mr-1" /> Equipamento Instalado
                           </p>
                           <div className="space-y-2 relative z-10">
                                <div className="bg-white/60 p-2 rounded-xl border border-emerald-100/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-emerald-800 uppercase">Modelo</span>
                                    {/* Busca o modelo no array de trackers se possível, senão mostra 'N/A' ou tenta inferir */}
                                    <span className="text-xs font-black text-slate-800 uppercase">
                                        {trackers.find(t => t.imei === viewingServiceEquipment.imei)?.model || 'Não Identificado'}
                                    </span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-xl border border-emerald-100/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-emerald-800 uppercase">IMEI</span>
                                    <div className="flex items-center gap-1.5">
                                        <Barcode size={12} className="text-emerald-600" />
                                        <span className="text-xs font-black font-mono text-slate-800">{viewingServiceEquipment.imei}</span>
                                    </div>
                                </div>
                           </div>
                        </div>
                    )}

                    {/* SETA SE HOUVER TROCA */}
                    {viewingServiceEquipment.imei && viewingServiceEquipment.removedImei && (
                        <div className="flex justify-center text-slate-300">
                            <ArrowDown size={20} />
                        </div>
                    )}

                    {/* SEÇÃO DE EQUIPAMENTO RETIRADO */}
                    {viewingServiceEquipment.removedImei && (
                        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 relative overflow-hidden">
                           <div className="absolute right-0 top-0 p-2 opacity-10">
                              <LogOutIcon size={60} className="text-rose-600" />
                           </div>
                           <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center">
                              <LogOutIcon size={12} className="mr-1" /> Equipamento Retirado
                           </p>
                           <div className="space-y-2 relative z-10">
                                <div className="bg-white/60 p-2 rounded-xl border border-rose-100/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-rose-800 uppercase">Modelo</span>
                                    <span className="text-xs font-black text-slate-800 uppercase">
                                        {viewingServiceEquipment.removedModel || 'Não Info.'}
                                    </span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-xl border border-rose-100/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-rose-800 uppercase">IMEI</span>
                                    <div className="flex items-center gap-1.5">
                                        <Barcode size={12} className="text-rose-600" />
                                        <span className="text-xs font-black font-mono text-slate-800 line-through decoration-rose-400">
                                            {viewingServiceEquipment.removedImei}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/60 p-2 rounded-xl border border-rose-100/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-rose-800 uppercase">Empresa</span>
                                    <span className="text-[10px] font-black text-slate-800 uppercase">
                                        {viewingServiceEquipment.removedCompany || 'N/A'}
                                    </span>
                                </div>
                           </div>
                        </div>
                    )}

                 </div>

                 <button onClick={() => setViewingServiceEquipment(null)} className="w-full py-4 bg-purple-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                    Fechar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Services;
