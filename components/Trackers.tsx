
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Trash2, X, Save, 
  Radio, Barcode, CalendarDays,
  Loader2, ArrowRight
} from 'lucide-react';
import { 
  Tracker, TrackerStatus, User, UserRole, Company 
} from '../types';

interface TrackersProps {
  trackers: Tracker[];
  currentUser: User;
  users: User[];
  onSaveTracker: (tracker: Tracker) => Promise<void>;
  onDeleteTracker: (id: string) => Promise<void>;
}

// Lista de modelos pré-definidos
const TRACKER_MODELS = [
  "Suntech 310",
  "Suntech 8310",
  "Nonus N4",
  "Genérico J16",
  "Lumiar LT32",
  "Lumiar LT32-PRO"
];

const Trackers: React.FC<TrackersProps> = ({ 
  trackers, currentUser, users, onSaveTracker, onDeleteTracker
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null); // Estado para confirmação
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<Company | 'ALL'>('ALL');
  
  // Estado para Admin/Master controlar qual técnico está vendo
  const [viewingTechId, setViewingTechId] = useState<string | null>(null);

  const initialFormState: Partial<Tracker> = {
    date: new Date().toISOString().split('T')[0],
    model: '',
    imei: '',
    company: Company.AIROCLUBE,
    status: TrackerStatus.DISPONIVEL,
  };

  const [formData, setFormData] = useState<Partial<Tracker>>(initialFormState);

  const isManager = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  
  // Filtra rastreadores
  const filteredTrackers = useMemo(() => {
    let list = trackers;
    
    // Se for gerente, filtra pelo técnico selecionado (ou mostra todos se nenhum selecionado)
    if (isManager && viewingTechId) {
       list = list.filter(t => t.technicianId === viewingTechId);
    } 
    // Se for técnico, filtra só os dele (já vem filtrado do App.tsx, mas por segurança)
    else if (!isManager) {
       list = list.filter(t => t.technicianId === currentUser.id);
    }

    // Filtro por Empresa (Tabs)
    if (activeCompanyFilter !== 'ALL') {
        list = list.filter(t => t.company === activeCompanyFilter);
    }

    return list.filter(t => 
      t.imei.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [trackers, viewingTechId, isManager, currentUser.id, searchTerm, activeCompanyFilter]);

  // Agrupamento por Data de Entrada (Visual "embolado" resolvido)
  const groupedTrackers = useMemo(() => {
    const groups: Record<string, Tracker[]> = {};
    filteredTrackers.forEach(t => {
        if (!groups[t.date]) {
            groups[t.date] = [];
        }
        groups[t.date].push(t);
    });
    // Retorna ordenado (mais recente primeiro)
    return groups;
  }, [filteredTrackers]);

  const handleSave = async () => {
    if (!formData.date || !formData.model || !formData.imei) {
      alert("Preencha Data, Modelo e IMEI.");
      return;
    }

    // VERIFICAÇÃO DE DUPLICIDADE DE IMEI
    // Procura se existe algum rastreador com o mesmo IMEI, excluindo o próprio (caso esteja editando)
    const duplicate = trackers.find(t => 
        t.imei === formData.imei && 
        t.id !== (editingTracker?.id || '')
    );

    if (duplicate) {
        alert(`ERRO: O IMEI ${formData.imei} já está cadastrado no sistema (Técnico: ${duplicate.technicianName}).`);
        return;
    }

    setIsSaving(true);
    
    const idToUse = editingTracker ? editingTracker.id : (self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));

    const targetTechId = isManager ? (viewingTechId || currentUser.id) : currentUser.id;
    const targetTechName = users.find(u => u.id === targetTechId)?.name || currentUser.name;

    const trackerToSave: Tracker = {
        ...initialFormState,
        ...formData,
        id: idToUse,
        technicianId: editingTracker ? editingTracker.technicianId : targetTechId,
        technicianName: editingTracker ? editingTracker.technicianName : targetTechName
    } as Tracker;

    await onSaveTracker(trackerToSave);
    setIsSaving(false);
    setShowForm(false);
    setFormData(initialFormState);
    setEditingTracker(null);
  };

  const executeDelete = async () => {
      if (confirmingDeleteId) {
          await onDeleteTracker(confirmingDeleteId);
          setConfirmingDeleteId(null);
      }
  };

  const openEdit = (t: Tracker) => {
      setEditingTracker(t);
      setFormData(t);
      setShowForm(true);
  };

  const getStatusColor = (status: TrackerStatus) => {
    switch (status) {
      case TrackerStatus.DISPONIVEL: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case TrackerStatus.INSTALADO: return 'text-blue-600 bg-blue-50 border-blue-200';
      case TrackerStatus.DEFEITO: return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getCompanyColor = (company: Company) => {
      switch (company) {
          case Company.AIROCLUBE: return 'text-purple-600 bg-purple-50 border-purple-200';
          case Company.AIROTRACKER: return 'text-orange-600 bg-orange-50 border-orange-200';
          case Company.CARTRAC: return 'text-cyan-600 bg-cyan-50 border-cyan-200';
          default: return 'text-slate-600 bg-slate-50 border-slate-200';
      }
  };

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      
      {/* Sidebar de Técnicos para Admin */}
      {isManager && (
         <aside className="hidden lg:flex w-56 bg-white border-r border-slate-100 p-6 flex-col space-y-6 overflow-y-auto">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
               Estoque por Técnico
            </h2>
            <button onClick={() => setViewingTechId(null)} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all font-bold ${!viewingTechId ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}>
                <span className="text-xs">Visão Geral</span>
                {!viewingTechId && <ArrowRight size={14} />}
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            {users.filter(u => u.role === UserRole.TECHNICIAN).map(tech => {
                const count = trackers.filter(t => t.technicianId === tech.id && t.status === TrackerStatus.DISPONIVEL).length;
                return (
                <button key={tech.id} onClick={() => setViewingTechId(tech.id)} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${viewingTechId === tech.id ? 'bg-[#0A192F] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
                    <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] flex items-center justify-center font-black text-[10px]">{tech.name.charAt(0)}</div>
                        <p className="font-black text-[10px] uppercase truncate max-w-[80px]">{tech.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                </button>
            )})}
         </aside>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/30">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">Rastreadores</h1>
                <p className="text-slate-500 font-medium">Controle de Estoque e Equipamentos</p>
            </div>
            <button onClick={() => { setEditingTracker(null); setFormData(initialFormState); setShowForm(true); }} className="px-6 py-3 bg-[#0A192F] text-white rounded-xl text-sm font-black uppercase shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center space-x-2">
                <Plus size={20} className="text-[#00AEEF]" />
                <span>Cadastrar Equipamento</span>
            </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Buscar por IMEI ou Modelo..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 overflow-x-auto">
                <button onClick={() => setActiveCompanyFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeCompanyFilter === 'ALL' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Todas</button>
                {Object.values(Company).map(comp => (
                    <button key={comp} onClick={() => setActiveCompanyFilter(comp)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeCompanyFilter === comp ? 'bg-[#00AEEF] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{comp}</button>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5 whitespace-nowrap">Data Entrada</th>
                            <th className="px-6 py-5 whitespace-nowrap">Empresa</th>
                            <th className="px-6 py-5 whitespace-nowrap">Modelo</th>
                            <th className="px-6 py-5 whitespace-nowrap">IMEI</th>
                            {isManager && <th className="px-6 py-5 whitespace-nowrap">Técnico Responsável</th>}
                            <th className="px-6 py-5 text-center whitespace-nowrap">Status / Instalação</th>
                            <th className="px-6 py-5 text-center whitespace-nowrap">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {Object.keys(groupedTrackers).length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Nenhum equipamento encontrado</td></tr>
                        ) : (
                            Object.keys(groupedTrackers).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                                <React.Fragment key={date}>
                                    {/* Linha de Separação por Data */}
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={7} className="px-6 py-3">
                                            <div className="flex items-center w-full">
                                                <div className="h-px bg-blue-200 flex-1"></div>
                                                <div className="px-4 py-1.5 bg-white border border-blue-100 rounded-full flex items-center space-x-2 shadow-sm mx-4">
                                                    <CalendarDays size={14} className="text-[#00AEEF]" />
                                                    <span className="text-[11px] font-black text-slate-700 uppercase">
                                                        Entrada: {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="h-px bg-blue-200 flex-1"></div>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {groupedTrackers[date].map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <CalendarDays size={14} />
                                                    <span>{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${getCompanyColor(t.company)}`}>
                                                    {t.company}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-800 uppercase whitespace-nowrap">{t.model}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 flex items-center w-fit gap-2">
                                                    <Barcode size={14} /> {t.imei}
                                                </span>
                                            </td>
                                            {isManager && <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase whitespace-nowrap">{t.technicianName}</td>}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getStatusColor(t.status)}`}>{t.status}</span>
                                                    {t.status === TrackerStatus.INSTALADO && t.installationDate && (
                                                        <span className="text-[9px] text-slate-400 mt-1 font-bold">
                                                            Instalado: {new Date(t.installationDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {t.status === TrackerStatus.DISPONIVEL ? (
                                                        <>
                                                            <button onClick={() => openEdit(t)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                                                <Radio size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setConfirmingDeleteId(t.id)} 
                                                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[9px] text-slate-300 font-bold uppercase">Em Uso</span>
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingTracker ? 'Editar Equipamento' : 'Novo Rastreador'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-rose-600 rounded-2xl"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Data de Entrada</label>
                        <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-900" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Empresa do Equipamento</label>
                        <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value as Company})}>
                            {Object.values(Company).map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Modelo</label>
                        <select 
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 uppercase"
                            value={formData.model} 
                            onChange={(e) => setFormData({...formData, model: e.target.value})}
                        >
                            <option value="">SELECIONE O MODELO...</option>
                            {TRACKER_MODELS.map((model) => (
                                <option key={model} value={model}>{model.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">IMEI</label>
                        <div className="relative">
                            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              placeholder="Apenas números" 
                              className="w-full pl-12 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900" 
                              value={formData.imei} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if(val.length <= 25) setFormData({...formData, imei: val});
                              }} 
                            />
                            {/* Contador de Dígitos */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                                    (formData.imei?.length || 0) === 15 
                                    ? 'bg-emerald-100 text-emerald-600' 
                                    : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {formData.imei?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-[#0A192F] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl flex items-center justify-center space-x-2 mt-4">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="text-[#00AEEF]" />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar Equipamento'}</span>
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Excluir Equipamento?</h3>
                <p className="text-slate-500 text-sm mb-8">Esta ação removerá o rastreador do estoque permanentemente.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setConfirmingDeleteId(null)} className="py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button onClick={executeDelete} className="py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">Excluir</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trackers;
