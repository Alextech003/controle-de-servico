
import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Search, Trash2, X, Save, 
  CalendarDays, ChevronLeft, ChevronRight,
  Eye, Receipt, Upload, Loader2, DollarSign, FileText,
  Edit, Calculator, AlertCircle, Users, ArrowRight, ArrowLeft
} from 'lucide-react';
import { 
  Reimbursement, ReimbursementType, ReimbursementStatus, User, UserRole 
} from '../types';

interface ReimbursementsProps {
  reimbursements: Reimbursement[];
  currentUser: User;
  users: User[];
  onSaveReimbursement: (data: Reimbursement) => Promise<void>;
  onDeleteReimbursement: (id: string) => Promise<void>;
}

const Reimbursements: React.FC<ReimbursementsProps> = ({ 
  reimbursements, currentUser, users, onSaveReimbursement, onDeleteReimbursement
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingReimbursement, setEditingReimbursement] = useState<Reimbursement | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para Admin/Master controlar qual técnico está vendo
  const [viewingTechId, setViewingTechId] = useState<string | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Reimbursement> = {
    date: new Date().toISOString().split('T')[0],
    type: ReimbursementType.COMBUSTIVEL,
    value: 0.00,
    description: '',
    status: ReimbursementStatus.PENDENTE,
  };

  const [formData, setFormData] = useState<Partial<Reimbursement>>(initialFormState);

  // Navegação de Mês
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

  const isManager = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;

  // Filtra reembolsos baseados no mês, ano e (se for admin) no técnico selecionado
  const filteredReimbursements = useMemo(() => {
    return reimbursements.filter(r => {
      const rDate = new Date(r.date + 'T12:00:00');
      const matchesDate = rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear;
      
      if (isManager) {
        // Se for gerente, só mostra se tiver selecionado um ID e bater com o ID
        if (viewingTechId) {
            return matchesDate && r.technicianId === viewingTechId;
        }
        // Se não tiver ID selecionado, mostra vazio ou tudo (aqui optamos por filtrar na UI principal)
        return matchesDate;
      }
      
      // Se for técnico, já vem filtrado do App.tsx, mas garantimos data
      return matchesDate;
    });
  }, [reimbursements, selectedMonth, selectedYear, viewingTechId, isManager]);

  // Cálculo do Total com Regra de 50% para Manutenção
  // Calcula o total VISÍVEL na tela
  const totalValue = useMemo(() => {
    return filteredReimbursements.reduce((acc, r) => {
      if (r.type === ReimbursementType.MANUTENCAO_VEICULO) {
        return acc + (r.value / 2);
      }
      return acc + r.value;
    }, 0);
  }, [filteredReimbursements]);

  // Agrupamento
  const groupedReimbursements = useMemo(() => {
    const groups: Record<string, Reimbursement[]> = {};
    filteredReimbursements.forEach(item => {
        if (!groups[item.date]) {
            groups[item.date] = [];
        }
        groups[item.date].push(item);
    });
    return groups;
  }, [filteredReimbursements]);

  // --- LÓGICA PARA O PAINEL DE SELEÇÃO DE TÉCNICOS (ADMIN ONLY) ---
  const techniciansSummary = useMemo(() => {
    if (!isManager) return [];
    
    // Pega todos os usuários técnicos
    const techs = users.filter(u => u.role === UserRole.TECHNICIAN);
    
    return techs.map(tech => {
        // Calcula o total do mês para este técnico específico
        const techMonthTotal = reimbursements
            .filter(r => {
                const rDate = new Date(r.date + 'T12:00:00');
                return r.technicianId === tech.id && 
                       rDate.getMonth() === selectedMonth && 
                       rDate.getFullYear() === selectedYear;
            })
            .reduce((acc, r) => {
                const val = r.type === ReimbursementType.MANUTENCAO_VEICULO ? r.value / 2 : r.value;
                return acc + val;
            }, 0);

        const pendingCount = reimbursements.filter(r => r.technicianId === tech.id && r.status === ReimbursementStatus.PENDENTE && new Date(r.date + 'T12:00:00').getMonth() === selectedMonth).length;

        return {
            ...tech,
            monthTotal: techMonthTotal,
            pendingCount
        };
    });
  }, [users, reimbursements, selectedMonth, selectedYear, isManager]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("O arquivo é muito grande (Máx 1MB).");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isPdf = (url: string) => url.includes('application/pdf') || url.toLowerCase().endsWith('.pdf');

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

  const openEdit = (r: Reimbursement) => {
      setEditingReimbursement(r);
      setFormData(r);
      setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.date || !formData.description || !formData.value) {
      alert("Preencha data, descrição e valor.");
      return;
    }
    setIsSaving(true);
    
    const idToUse = editingReimbursement ? editingReimbursement.id : (self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));

    // Se for admin criando, usa o ID do técnico que está sendo visualizado. Se for o próprio técnico, usa o ID dele.
    const targetTechId = isManager ? (viewingTechId || currentUser.id) : currentUser.id;
    const targetTechName = users.find(u => u.id === targetTechId)?.name || currentUser.name;

    const reimbursementToSave: Reimbursement = {
        ...initialFormState,
        ...formData,
        id: idToUse,
        technicianId: editingReimbursement ? editingReimbursement.technicianId : targetTechId,
        technicianName: editingReimbursement ? editingReimbursement.technicianName : targetTechName
    } as Reimbursement;

    await onSaveReimbursement(reimbursementToSave);
    setIsSaving(false);
    setShowForm(false);
    setFormData(initialFormState);
    setEditingReimbursement(null);
  };

  const getTypeColor = (type: ReimbursementType) => {
    switch (type) {
      case ReimbursementType.COMBUSTIVEL: return 'text-amber-600 bg-amber-50 border-amber-200';
      case ReimbursementType.PEDAGIO: return 'text-purple-600 bg-purple-50 border-purple-200';
      case ReimbursementType.ALIMENTACAO: return 'text-rose-600 bg-rose-50 border-rose-200';
      case ReimbursementType.MANUTENCAO_VEICULO: return 'text-slate-700 bg-slate-100 border-slate-300';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusColor = (status: ReimbursementStatus) => {
    switch (status) {
      case ReimbursementStatus.APROVADO: return 'text-emerald-600 bg-emerald-50';
      case ReimbursementStatus.PAGO: return 'text-blue-600 bg-blue-50';
      case ReimbursementStatus.REJEITADO: return 'text-rose-600 bg-rose-50';
      default: return 'text-amber-600 bg-amber-50';
    }
  };

  // --- RENDERIZAÇÃO ---

  // 1. Visão de Seleção de Técnicos (Apenas Admin/Master quando nenhum técnico selecionado)
  if (isManager && !viewingTechId) {
    return (
        <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">Gestão de Reembolsos</h1>
                        <p className="text-slate-500 font-medium">Selecione um técnico para gerenciar as despesas</p>
                    </div>
                    <div className="flex items-center justify-between space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
                            <ChevronLeft size={20} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                        </button>
                        <div className="px-3 text-center min-w-[120px] font-black uppercase text-xs text-slate-800">{months[selectedMonth]} {selectedYear}</div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
                            <ChevronRight size={20} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {techniciansSummary.map((tech) => (
                        <div 
                            key={tech.id} 
                            onClick={() => setViewingTechId(tech.id)}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Receipt size={80} className="text-[#00AEEF]" />
                            </div>

                            <div className="flex items-center space-x-4 mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-lg uppercase group-hover:bg-[#00AEEF] group-hover:text-white transition-colors">
                                    {tech.avatar ? <img src={tech.avatar} className="w-full h-full object-cover rounded-2xl" /> : tech.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{tech.name}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Técnico</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Mês</span>
                                    <span className="text-sm font-black text-slate-900">{tech.monthTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                {tech.pendingCount > 0 && (
                                    <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                                        <AlertCircle size={14} />
                                        <span className="text-[10px] font-black uppercase">{tech.pendingCount} pendentes</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button className="w-10 h-10 rounded-full bg-[#0A192F] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  // 2. Visão Detalhada (Tabela) - Usada por Técnicos OU por Admins vendo um técnico específico
  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/30">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-start md:items-center flex-col md:flex-row gap-4">
            {isManager && viewingTechId && (
                <button 
                    onClick={() => setViewingTechId(null)}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                    title="Voltar para lista de técnicos"
                >
                    <ArrowLeft size={20} />
                </button>
            )}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">
                    {isManager && viewingTechId 
                        ? `Despesas: ${users.find(u => u.id === viewingTechId)?.name}` 
                        : 'Meus Reembolsos'
                    }
                </h1>
                <p className="text-slate-500 font-medium">Controle de despesas operacionais</p>
            </div>
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
             
             <button onClick={() => { setEditingReimbursement(null); setFormData(initialFormState); setShowForm(true); }} className="px-6 py-3 bg-[#0A192F] text-white rounded-xl text-sm font-black uppercase shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center space-x-2">
                <Plus size={20} className="text-[#00AEEF]" />
                <span>Nova Despesa</span>
             </button>
          </div>
        </div>

        {/* Card de Total */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  {isManager && viewingTechId ? 'Total deste Técnico' : 'Total a Reembolsar'}
              </p>
              <h2 className="text-3xl font-black text-slate-900">
                 {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h2>
           </div>
           <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
              <Calculator size={28} />
           </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Data</th>
                  <th className="px-6 py-5 whitespace-nowrap">Técnico</th>
                  <th className="px-6 py-5 whitespace-nowrap">Categoria</th>
                  <th className="px-6 py-5 whitespace-nowrap">Descrição</th>
                  <th className="px-6 py-5 whitespace-nowrap text-right">Valor</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Comprovante</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.keys(groupedReimbursements).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Nenhuma despesa em {months[selectedMonth]}</td>
                  </tr>
                ) : (
                  Object.keys(groupedReimbursements).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                    <React.Fragment key={date}>
                        <tr className="bg-slate-50/50">
                            <td colSpan={8} className="px-6 py-3">
                                <div className="flex items-center w-full">
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                    <div className="px-4 py-1.5 bg-white border border-blue-100 rounded-full flex items-center space-x-2 shadow-sm mx-4">
                                        <CalendarDays size={14} className="text-[#00AEEF]" />
                                        <span className="text-[11px] font-black text-slate-700 uppercase">
                                            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="h-px bg-blue-200 flex-1"></div>
                                </div>
                            </td>
                        </tr>
                        {groupedReimbursements[date].map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">{new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase whitespace-nowrap">{r.technicianName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getTypeColor(r.type)}`}>
                                        {r.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-600 truncate max-w-[200px]">{r.description}</td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex flex-col items-end">
                                      <span className="text-xs font-black text-slate-900">
                                        {r.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </span>
                                      {r.type === ReimbursementType.MANUTENCAO_VEICULO && (
                                        <span className="text-[9px] font-bold text-[#00AEEF] bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                                            Rateio 50% ({ (r.value/2).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) })
                                        </span>
                                      )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${getStatusColor(r.status)}`}>{r.status}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {r.receiptUrl ? (
                                        <button 
                                            onClick={() => setViewingReceipt(r.receiptUrl!)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                            title="Ver Comprovante"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    ) : (
                                        <span className="text-[9px] text-slate-300 font-bold uppercase">Sem Anexo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        {confirmingDeleteId === r.id ? (
                                            <button onClick={() => { onDeleteReimbursement(r.id); setConfirmingDeleteId(null); }} className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Confirmar</button>
                                        ) : (
                                            <>
                                                <button onClick={() => openEdit(r)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => setConfirmingDeleteId(r.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
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

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingReimbursement ? 'Editar Despesa' : 'Nova Solicitação'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-rose-600 rounded-2xl"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Data da Despesa</label>
                        <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-900" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Tipo</label>
                        <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ReimbursementType})}>
                            {Object.values(ReimbursementType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Descrição</label>
                        <input type="text" placeholder="Ex: Pedágio ida Itaguaí" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-900 placeholder:text-slate-300" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Valor Total da Nota (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              inputMode="numeric"
                              placeholder="0,00"
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 placeholder:text-slate-300" 
                              value={formatCurrencyValue(formData.value || 0)} 
                              onChange={handleCurrencyChange} 
                            />
                        </div>
                        {formData.type === ReimbursementType.MANUTENCAO_VEICULO && (
                            <div className="mt-2 flex items-start space-x-2 text-[10px] text-slate-500 bg-slate-100 p-2 rounded-lg">
                                <AlertCircle size={12} className="mt-0.5 text-blue-500" />
                                <span>Manutenção de veículo é dividida 50/50. O valor efetivo do reembolso será <strong>{((formData.value || 0) / 2).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong>.</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Comprovante</label>
                        <div onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors text-blue-600 font-bold text-sm">
                            {formData.receiptUrl ? (
                                isPdf(formData.receiptUrl) ? (
                                    <span className="flex items-center"><FileText size={18} className="mr-2" /> PDF Selecionado</span>
                                ) : (
                                    <span className="flex items-center"><Receipt size={18} className="mr-2" /> Foto Selecionada</span>
                                )
                            ) : (
                                <span className="flex items-center"><Upload size={18} className="mr-2" /> Foto ou PDF (Máx 1MB)</span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-12 py-4 bg-[#0A192F] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl flex items-center justify-center space-x-2">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="text-[#00AEEF]" />}
                        <span>{isSaving ? 'Salvando...' : (editingReimbursement ? 'Salvar Edição' : 'Registrar')}</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Comprovante */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300" onClick={() => setViewingReceipt(null)}>
            <div className="relative max-w-4xl w-full max-h-[95vh] flex flex-col items-center">
                <button className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors" onClick={() => setViewingReceipt(null)}>
                    <X size={32} />
                </button>
                
                {isPdf(viewingReceipt) ? (
                    <iframe 
                        src={viewingReceipt} 
                        className="w-full h-[85vh] rounded-lg shadow-2xl bg-white"
                        title="Comprovante PDF"
                    ></iframe>
                ) : (
                    <img src={viewingReceipt} alt="Comprovante" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white" />
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Reimbursements;
