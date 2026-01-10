
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit, X, Save, 
  MessageSquare, Table as TableIcon,
  ArrowRight, CopyPlus, Loader2,
  Users as UsersIcon, Check, XCircle
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
        id: editingService ? editingService.id : Math.random().toString(36).substr(2, 9),
        technicianId: editingService ? editingService.technicianId : currentUser.id,
        technicianName: editingService ? editingService.technicianName : currentUser.name
    } as Service;

    await onSaveService(serviceToSave);
    setIsSaving(false);
    
    if (keepOpen) { 
      setFormData({ ...initialFormState, date: formData.date, value: 0.00 }); 
      setEditingService(null); 
    } else { 
      setShowForm(false); 
      setEditingService(null); 
    }
  };

  // Função simples para iniciar a exclusão
  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmingDeleteId(id);
  };

  // Função para confirmar a exclusão
  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onDeleteService(id);
    setConfirmingDeleteId(null);
  };

  // Função para cancelar a exclusão
  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);
  };

  const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  const canEdit = currentUser.role !== UserRole.ADMIN;

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {isAdmin && (
        <aside className="w-80 bg-white border-r border-slate-100 p-8 flex flex-col space-y-6 overflow-y-auto print:hidden">
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

      <div className="flex-1 overflow-y-auto p-8 space-y-8 print:p-0 bg-slate-50/30">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Serviços</h1>
            <p className="text-slate-500 font-medium">Relatório Detalhado</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => window.print()} className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
              <FileText size={18} className="text-[#00AEEF]" /> <span>PDF</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
              <TableIcon size={18} className="text-emerald-500" /> <span>Excel</span>
            </button>
            {canEdit && (
              <button onClick={() => { setEditingService(null); setFormData(initialFormState); setShowForm(true); }} className="px-8 py-3 bg-[#0A192F] text-white rounded-xl text-sm font-black uppercase shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
                <Plus size={20} className="inline mr-1 text-[#00AEEF]" /> Novo Serviço
              </button>
            )}
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
                  <th className="px-6 py-5">Data</th>
                  <th className="px-6 py-5">Cliente</th>
                  <th className="px-6 py-5">Bairro</th>
                  <th className="px-6 py-5">Empresa</th>
                  <th className="px-6 py-5 text-center">Placa</th>
                  <th className="px-6 py-5">Valor</th>
                  <th className="px-6 py-5 print:hidden text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Nenhum registro encontrado</td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 font-black text-slate-800 text-xs uppercase">{s.customerName}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{s.neighborhood}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${s.company === Company.AIROTRACKER ? 'bg-[#FF5F15] text-white' : 'bg-blue-100 text-[#00AEEF]'}`}>{s.company}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-block px-3 py-1.5 bg-slate-900 rounded-lg shadow-sm">
                          <span className="text-[11px] font-mono font-black text-white uppercase tracking-wider">{s.plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">R$ {s.value.toFixed(2)}</td>
                      <td className="px-6 py-4 print:hidden">
                        <div className="flex items-center justify-center space-x-2">
                          {s.status === ServiceStatus.CANCELADO && <button onClick={() => setViewingReason(s)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><MessageSquare size={18} /></button>}
                          
                          {/* Lógica de Edição e Exclusão Segura */}
                          {canEdit && (
                            <>
                              {confirmingDeleteId === s.id ? (
                                <div className="flex items-center bg-rose-50 rounded-xl p-1 animate-in zoom-in duration-200">
                                   <button 
                                      onClick={(e) => confirmDelete(e, s.id)}
                                      className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors mr-1"
                                      title="Confirmar Exclusão"
                                   >
                                      <Check size={16} strokeWidth={3} />
                                   </button>
                                   <button 
                                      onClick={cancelDelete}
                                      className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                      title="Cancelar"
                                   >
                                      <XCircle size={16} />
                                   </button>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => {setEditingService(s); setFormData(s); setShowForm(true);}} 
                                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => initiateDelete(e, s.id)}
                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 backdrop-blur-md p-4 print:hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingService ? 'Editar Registro' : 'Lançar Novo Serviço'}</h3>
              <button onClick={() => setShowForm(false)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-rose-50 rounded-[2rem] border border-rose-100 animate-in slide-in-from-top-4">
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
                <button onClick={() => setShowForm(false)} disabled={isSaving} className="px-8 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600">Descartar</button>
                {!editingService && (
                  <button onClick={() => handleSave(true)} disabled={isSaving} className="px-8 py-4 bg-white border-2 border-[#0A192F] text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CopyPlus size={20} className="text-[#00AEEF]" />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar e Próximo'}</span>
                  </button>
                )}
                <button onClick={() => handleSave(false)} disabled={isSaving} className="px-12 py-4 bg-[#0A192F] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-900/10 hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
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
          <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl">
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
