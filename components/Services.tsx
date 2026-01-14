import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit, X, Save, 
  MessageSquare, Table as TableIcon,
  ArrowRight, CopyPlus, Loader2,
  Users as UsersIcon, Check, XCircle, ChevronLeft, ChevronRight,
  MapPin, CalendarDays
} from 'lucide-react';
import { 
  Service, ServiceStatus, ServiceType, Company, 
  User, UserRole, CancelledBy 
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
}

const Services: React.FC<ServicesProps> = ({ 
  services, currentUser, users, onSaveService, onDeleteService, 
  viewingTechnicianId, onClearFilter, onFilterByTech
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingReason, setViewingReason] = useState<Service | null>(null);
  
  // Estado para controlar qual item está sendo deletado (confirmação visual)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'realized' | 'cancelled'>('realized');
  const [isSaving, setIsSaving] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
    cancelledBy: undefined
  };

  const [formData, setFormData] = useState<Partial<Service>>(initialFormState);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const sDate = new Date(s.date + 'T12:00:00');
      const matchesMonth = sDate.getMonth() === selectedMonth && sDate.getFullYear() === selectedYear;
      const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || 
                            (activeFilter === 'realized' && s.status === ServiceStatus.REALIZADO) || 
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
    const headers = "Data;Cliente;Bairro;Tipo;Empresa;Veículo;Placa;Valor;Status;Técnico\n";
    const csv = filteredServices.map(s => 
      `${s.date};${s.customerName};${s.neighborhood};${s.type};${s.company};${s.vehicle};${s.plate};${s.value.toFixed(2)};${s.status};${s.technicianName}`
    ).join("\n");
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
        plate: ''    
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

  const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  const canEdit = currentUser.role !== UserRole.ADMIN;

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {isAdmin && (
        <aside className="hidden lg:flex w-80 bg-white border-r border-slate-100 p-8 flex-col space-y-6 overflow-y-auto print:hidden">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center">
            <UsersIcon className="mr-2 text-[#00AEEF]" /> Equipe Ativa
          </h2>
          <button onClick={onClearFilter} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-bold ${!viewingTechnicianId ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}>
            <span>Todos os Técnicos</span>
            {!viewingTechnicianId && <ArrowRight size={16} />}
          </button>
          <div className="h-px bg-slate-100 my-2"></div>
          {users.filter(u => u.role === UserRole.TECHNICIAN).map(tech => (
            <button key={tech.id} onClick={() => onFilterByTech(tech.id)} className={`w-full flex items-center space-x-4 p-4 rounded-2xl border transition-all ${viewingTechnicianId === tech.id ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00AEEF] flex items-center justify-center font-black text-xs">{tech.name.charAt(0)}</div>
              <p className="font-black text-[11px] uppercase truncate">{tech.name}</p>
            </button>
          ))}
        </aside>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 print:p-0 bg-slate-50/30">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">Serviços</h1>
            <p className="text-slate-500 font-medium">Relatório Detalhado</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
             <div className="flex items-center justify-between space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
                  <ChevronLeft size={20} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                </button>
                <div className="px-3 text-center min-w-[120px] font-black uppercase text-xs text-slate-800">{months[selectedMonth]} {selectedYear}</div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
                  <ChevronRight size={20} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                </button>
             </div>

             <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
                  <FileText size={18} className="text-[#00AEEF]" /> <span className="hidden lg:inline">PDF</span>
                </button>
                <button onClick={handleExportExcel} className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
                  <TableIcon size={18} className="text-emerald-500" /> <span className="hidden lg:inline">Excel</span>
                </button>
                {canEdit && (
                  <button onClick={() => { setEditingService(null); setFormData(initialFormState); setShowForm(true); }} className="px-6 py-3 bg-[#0A192F] text-white rounded-xl text-sm font-black uppercase shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
                    <Plus size={20} className="inline mr-1 text-[#00AEEF]" /> <span className="hidden lg:inline">Novo Serviço</span>
                  </button>
                )}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Buscar por cliente, bairro ou placa..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl space-x-1">
              <button onClick={() => setActiveFilter('realized')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === 'realized' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>Realizados</button>
              <button onClick={() => setActiveFilter('cancelled')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === 'cancelled' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>Cancelados</button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden print:border-slate-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Data</th>
                  <th className="px-6 py-5 whitespace-nowrap">Cliente</th>
                  <th className="px-6 py-5 whitespace-nowrap">Bairro</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Tipo</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Empresa</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Placa</th>
                  <th className="px-6 py-5 whitespace-nowrap text-right">Valor</th>
                  <th className="px-6 py-5 print:hidden text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.keys(groupedServices).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Nenhum registro encontrado em {months[selectedMonth]}</td>
                  </tr>
                ) : (
                  Object.keys(groupedServices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                    <React.Fragment key={date}>
                        {/* Linha Divisória de Data */}
                        <tr className="bg-slate-50/50">
                            <td colSpan={8} className="px-6 py-3">
                                <div className="flex items-center w-full">
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                    <div className="px-4 py-1.5 bg-white border border-blue-100 rounded-full flex items-center space-x-2 shadow-sm mx-4">
                                        <CalendarDays size={14} className="text-[#00AEEF]" />
                                        <span className="text-[11px] font-black text-slate-700 uppercase">
                                            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400">•</span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            {groupedServices[date].length} {groupedServices[date].length === 1 ? 'serviço' : 'serviços'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                </div>
                            </td>
                        </tr>

                        {/* Serviços do Dia */}
                        {groupedServices[date].map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 font-black text-slate-800 text-xs uppercase whitespace-nowrap">{s.customerName}</td>
                                <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap">
                                    <div className="flex items-center">
                                        <MapPin size={14} className="text-slate-300 mr-1.5" />
                                        {s.neighborhood}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getTypeStyle(s.type)}`}>
                                        {s.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getCompanyStyle(s.company)}`}>
                                        {s.company}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    {/* PLACA COM ESTILO PERSONALIZADO: Fundo Cinza Médio, Letra Preta, Borda */}
                                    <span className="inline-block px-3 py-1 bg-[#cbd5e1] text-black border-2 border-[#94a3b8] rounded-md text-[11px] font-black uppercase tracking-widest shadow-sm min-w-[90px]">
                                        {s.plate}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-slate-900 whitespace-nowrap text-right">
                                    {s.value === 0 ? '' : `R$ ${s.value.toFixed(2)}`}
                                </td>
                                <td className="px-6 py-4 print:hidden whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-2">
                                    {s.status === ServiceStatus.CANCELADO && <button onClick={() => setViewingReason(s)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><MessageSquare size={18} /></button>}
                                    
                                    {canEdit && (
                                        <>
                                        {confirmingDeleteId === s.id ? (
                                            <div className="flex items-center bg-rose-50 rounded-xl p-1 animate-in zoom-in duration-200">
                                            <button onClick={(e) => confirmDelete(e, s.id)} className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors mr-1">
                                                <Check size={16} strokeWidth={3} />
                                            </button>
                                            <button onClick={cancelDelete} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
                                                <XCircle size={16} />
                                            </button>
                                            </div>
                                        ) : (
                                            <>
                                            <button type="button" onClick={() => {setEditingService(s); setFormData(s); setShowForm(true);}} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Edit size={18} />
                                            </button>
                                            <button type="button" onClick={(e) => initiateDelete(e, s.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                            </>
                                        )}
                                        </>
                                    )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                  <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#00AEEF] text-slate-900 font-black" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})} />
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
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-3 ml-1">Status Final *</label>
                  <select className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-black ${formData.status === ServiceStatus.REALIZADO ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as ServiceStatus})}>
                    <option value={ServiceStatus.REALIZADO}>REALIZADO</option>
                    <option value={ServiceStatus.CANCELADO}>CANCELADO</option>
                  </select>
                </div>
              </div>

              {formData.status === ServiceStatus.CANCELADO && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8 bg-rose-50 rounded-[2rem] border border-rose-100 animate-in slide-in-from-top-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 ml-1">CANCELADO POR *</label>
                    <select className="w-full p-4 bg-white rounded-xl border-2 border-rose-200 font-black text-rose-700 outline-none" value={formData.cancelledBy || ''} onChange={(e) => setFormData({...formData, cancelledBy: e.target.value as CancelledBy})}>
                      <option value="">Selecione...</option>
                      {Object.values(CancelledBy).map(cb => <option key={cb} value={cb}>{cb}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 ml-1">MOTIVO DO CANCELAMENTO *</label>
                    <textarea className="w-full p-4 bg-white rounded-xl border-2 border-rose-200 font-medium text-slate-700 outline-none" value={formData.cancellationReason || ''} onChange={(e) => setFormData({...formData, cancellationReason: e.target.value})} rows={2} placeholder="Descreva brevemente o motivo..."></textarea>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 pt-10 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} disabled={isSaving} className="px-8 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 order-2 md:order-1">Descartar</button>
                {!editingService && (
                  <button onClick={() => handleSave(true)} disabled={isSaving} className="px-8 py-4 bg-white border-2 border-[#0A192F] text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 order-3 md:order-2">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CopyPlus size={20} className="text-[#00AEEF]" />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar e Add. Veículo'}</span>
                  </button>
                )}
                <button onClick={() => handleSave(false)} disabled={isSaving} className="px-12 py-4 bg-[#0A192F] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-900/10 hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 order-1 md:order-3">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="text-[#00AEEF]" />}
                  <span>{isSaving ? 'Salvando...' : (editingService ? 'Salvar Alterações' : 'Concluir Registro')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-md p-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-6 text-rose-600 tracking-tight">Motivo do Cancelamento</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cancelado por:</p>
                <p className="text-sm font-black text-slate-800">{viewingReason.cancelledBy}</p>
              </div>
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 font-medium italic text-slate-700">
                "{viewingReason.cancellationReason || 'Nenhuma justificativa fornecida.'}"
              </div>
            </div>
            <button onClick={() => setViewingReason(null)} className="w-full mt-8 py-4 bg-[#0A192F] text-white font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition-all">Fechar Janela</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;