
import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle2, DollarSign, XCircle, 
  ChevronLeft, ChevronRight, TrendingUp, FileText, PieChart, BarChart3, Radio, Wallet,
  ClipboardList, Receipt, UserCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Service, ServiceStatus, User, UserRole, Company, ServiceType, CancelledBy, Tracker, TrackerStatus, Reimbursement, ReimbursementStatus, ReimbursementType } from '../types';

interface DashboardProps {
  services: Service[];
  currentUser: User;
  users: User[];
  viewingTechnicianId: string | null;
  onViewTechnician: (id: string) => void;
  trackers?: Tracker[];
  reimbursements?: Reimbursement[];
  onNavigateTab?: (tab: 'dashboard' | 'services' | 'reimbursements' | 'users' | 'profile' | 'trackers') => void;
  isMobileSummaryDetail?: boolean;
  onOpenMobileSummaryDetail?: () => void;
  onCloseMobileSummaryDetail?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  services, 
  currentUser, 
  users, 
  viewingTechnicianId, 
  trackers = [], 
  reimbursements = [], 
  onNavigateTab,
  isMobileSummaryDetail = false,
  onOpenMobileSummaryDetail,
  onCloseMobileSummaryDetail
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Funções seguras para troca de mês
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

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const sDate = new Date(s.date + 'T12:00:00');
      return sDate.getMonth() === selectedMonth && sDate.getFullYear() === selectedYear;
    });
  }, [services, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const total = filteredServices.length;
    const realized = filteredServices.filter(s => s.status === ServiceStatus.REALIZADO).length;
    const cancelled = filteredServices.filter(s => s.status === ServiceStatus.CANCELADO).length;
    const grossRevenue = filteredServices
      .filter(s => s.status === ServiceStatus.REALIZADO)
      .reduce((acc, s) => acc + s.value, 0);
    
    // Regra: se cancelado pelo técnico, desconta 50 reais
    const techPenalties = filteredServices
      .filter(s => s.status === ServiceStatus.CANCELADO && s.cancelledBy === CancelledBy.TECNICO)
      .length * 50;

    // Cálculo de Rastreadores Disponíveis
    let myTrackers = trackers;
    const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
    
    if (!isAdmin) {
        myTrackers = trackers.filter(t => t.technicianId === currentUser.id);
    } else if (viewingTechnicianId) {
        myTrackers = trackers.filter(t => t.technicianId === viewingTechnicianId);
    }

    const availableTrackers = myTrackers.filter(t => t.status === TrackerStatus.DISPONIVEL).length;
    
    // Breakdown por Empresa
    const byCompany = {
        [Company.AIROCLUBE]: myTrackers.filter(t => t.status === TrackerStatus.DISPONIVEL && t.company === Company.AIROCLUBE).length,
        [Company.AIROTRACKER]: myTrackers.filter(t => t.status === TrackerStatus.DISPONIVEL && t.company === Company.AIROTRACKER).length,
        [Company.CARTRAC]: myTrackers.filter(t => t.status === TrackerStatus.DISPONIVEL && t.company === Company.CARTRAC).length,
    };

    // Reembolso a receber (pendente/aprovado/aguardando)
    let myReimbursements = reimbursements;
    if (!isAdmin) {
      myReimbursements = reimbursements.filter(r => r.technicianId === currentUser.id);
    } else if (viewingTechnicianId) {
      myReimbursements = reimbursements.filter(r => r.technicianId === viewingTechnicianId);
    }

    const pendingReimbursementValue = myReimbursements
      .filter(r => {
        const rDate = new Date(r.date + 'T12:00:00');
        const isCurrentMonth = rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear;
        const isPending = r.status === ReimbursementStatus.PENDENTE || r.status === ReimbursementStatus.AGUARDANDO_CONFIRMACAO || r.status === ReimbursementStatus.APROVADO;
        return isCurrentMonth && isPending;
      })
      .reduce((acc, r) => {
        const val = r.type === ReimbursementType.MANUTENCAO_VEICULO ? r.value / 2 : r.value;
        return acc + val;
      }, 0);

    return { total, realized, cancelled, revenue: grossRevenue - techPenalties, availableTrackers, byCompany, pendingReimbursementValue };
  }, [filteredServices, trackers, currentUser, viewingTechnicianId, reimbursements, selectedMonth, selectedYear]);

  const COLORS = {
    [Company.AIROTRACKER]: '#FF5F15',
    [Company.AIROCLUBE]: '#00AEEF',
    [Company.CARTRAC]: '#3B82F6',
    [ServiceType.INSTALACAO]: '#10B981',
    [ServiceType.MANUTENCAO]: '#F59E0B',
    [ServiceType.RETIRADA]: '#F43F5E'
  };

  const handleExportPDF = () => {
    window.print();
  };

  const StatCard = ({ title, value, icon: Icon, color, prefix = "", className = "" }: any) => (
    <div className={`bg-white p-6 md:p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 print:shadow-none print:border-slate-300 h-full ${className}`}>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black text-slate-900">{prefix}{value}</h3>
      </div>
      <div className={`p-4 md:p-5 rounded-2xl ${color} text-white`}>
        <Icon size={24} className="md:w-7 md:h-7" />
      </div>
    </div>
  );

  const StockCard = ({ title, total, byCompany, icon: Icon, color, className = "" }: any) => (
    <div className={`bg-white p-6 md:p-7 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all duration-500 print:shadow-none print:border-slate-300 h-full ${className}`}>
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900">{total}</h3>
            </div>
            <div className={`p-4 md:p-5 rounded-2xl ${color} text-white`}>
                <Icon size={24} className="md:w-7 md:h-7" />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
             <div className="text-center">
                 <p className="text-[9px] font-black text-purple-500 uppercase">AIROCLUBE</p>
                 <p className="text-lg font-black text-slate-800">{byCompany[Company.AIROCLUBE]}</p>
             </div>
             <div className="text-center border-l border-r border-slate-100">
                 <p className="text-[9px] font-black text-orange-500 uppercase">AIROTRACKER</p>
                 <p className="text-lg font-black text-slate-800">{byCompany[Company.AIROTRACKER]}</p>
             </div>
             <div className="text-center">
                 <p className="text-[9px] font-black text-cyan-500 uppercase">CARTRAC</p>
                 <p className="text-lg font-black text-slate-800">{byCompany[Company.CARTRAC]}</p>
             </div>
        </div>
    </div>
  );

  const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  const isIndividualSummary = currentUser.role === UserRole.TECHNICIAN || viewingTechnicianId !== null;
  const technicianName = viewingTechnicianId ? users.find(u => u.id === viewingTechnicianId)?.name : currentUser.name;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-10 print:p-0">
      
      {/* ======================================================== */}
      {/* CENÁRIO 1: TELA INICIAL MOBILE (5 QUADRADOS + MÊS)       */}
      {/* Mostrado SOMENTE no mobile quando NÃO está em Resumo      */}
      {/* ======================================================== */}
      {!isMobileSummaryDetail && (
        <div className="md:hidden space-y-4 print:hidden">
          
          {/* Barra superior de identificação rápida */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Início
              </h1>
              <p className="text-xs font-semibold text-slate-500">{technicianName}</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleExportPDF} 
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0B0F17] border border-red-500/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95"
              >
                <FileText size={14} className="text-red-500" />
                <span>PDF</span>
              </button>
            )}
          </div>

          {/* GRADE DE 5 QUADRADOS: 2 EM CIMA, 1 NO MEIO (RESUMO), 2 EM BAIXO */}
          <div className="grid grid-cols-2 gap-3 w-full">
            
            {/* 1. TOPO ESQUERDA: SERVIÇOS */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('services')}
              className="p-3.5 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-cyan-500/50 text-left shadow-lg active:scale-95 transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/10 rounded-bl-2xl flex items-center justify-center">
                <span className="text-[10px] font-black text-cyan-400">{stats.total}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <ClipboardList size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">SERVIÇOS</span>
                <span className="text-[9px] text-slate-400 font-medium">Controle de O.S.</span>
              </div>
            </button>

            {/* 2. TOPO DIREITA: REEMBOLSOS */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('reimbursements')}
              className="p-3.5 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-amber-500/50 text-left shadow-lg active:scale-95 transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-2xl flex items-center justify-center">
                <span className="text-[10px] font-black text-amber-400">R$</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Receipt size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">REEMBOLSOS</span>
                <span className="text-[9px] text-slate-400 font-medium">Notas & Despesas</span>
              </div>
            </button>

            {/* 3. CENTRO: RESUMO (AO CLICAR, ABRE A PÁGINA DE MÉTRICAS DO RESUMO) */}
            <div className="col-span-2 flex justify-center">
              <button
                type="button"
                onClick={() => onOpenMobileSummaryDetail && onOpenMobileSummaryDetail()}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#121824] via-[#1E273A] to-[#121824] border-2 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.22)] text-left active:scale-[0.98] transition-all flex items-center justify-between relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-[0_0_14px_rgba(239,68,68,0.6)] group-hover:scale-105 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-white uppercase tracking-wider">RESUMO</span>
                      <span className="px-2 py-0.5 rounded-md bg-red-500/25 text-red-400 text-[9px] font-black uppercase tracking-wider">Ver Métricas</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">Toque para ver indicadores</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-white block">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Líquido</span>
                </div>
              </button>
            </div>

            {/* 4. BAIXO ESQUERDA: RASTREADOR */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('trackers')}
              className="p-3.5 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-purple-500/50 text-left shadow-lg active:scale-95 transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-bl-2xl flex items-center justify-center">
                <span className="text-[10px] font-black text-purple-400">{stats.availableTrackers}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Radio size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">RASTREADOR</span>
                <span className="text-[9px] text-slate-400 font-medium">Estoque & Seriais</span>
              </div>
            </button>

            {/* 5. BAIXO DIREITA: PERFIL */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('profile')}
              className="p-3.5 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-emerald-500/50 text-left shadow-lg active:scale-95 transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <UserCircle size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">PERFIL</span>
                <span className="text-[9px] text-slate-400 font-medium">Conta & Chave Pix</span>
              </div>
            </button>

          </div>

          {/* SELETOR DE MÊS COM DESIGN ESCURO METÁLICO (EXCLUSIVO VERSÃO MOBILE) */}
          <div className="flex items-center justify-between space-x-3 bg-[#0B0F17] p-2.5 rounded-2xl border border-red-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <button 
              type="button"
              onClick={handlePrevMonth} 
              className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all text-red-500"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="px-4 text-center min-w-[140px] font-black uppercase text-sm text-white tracking-wider">
              {months[selectedMonth]} {selectedYear}
            </div>
            <button 
              type="button"
              onClick={handleNextMonth} 
              className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all text-red-500"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={22} />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* CENÁRIO 2: PÁGINA DEDICADA DE RESUMO (EXCLUSIVA MOBILE)   */}
      {/* Mostrada SOMENTE no mobile quando isMobileSummaryDetail    */}
      {/* Contém SOMENTE os 5 cards solicitados pelo usuário        */}
      {/* ======================================================== */}
      {isMobileSummaryDetail && (
        <div className="md:hidden space-y-4 print:hidden">
          
          {/* Cabeçalho da Página de Resumo Mobile */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Resumo
              </h1>
              <p className="text-xs font-semibold text-slate-500">{technicianName}</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleExportPDF} 
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0B0F17] border border-red-500/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95"
              >
                <FileText size={14} className="text-red-500" />
                <span>PDF</span>
              </button>
            )}
          </div>

          {/* Seletor de Mês Escuro Metálico */}
          <div className="flex items-center justify-between space-x-3 bg-[#0B0F17] p-2.5 rounded-2xl border border-red-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <button 
              type="button"
              onClick={handlePrevMonth} 
              className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all text-red-500"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="px-4 text-center min-w-[140px] font-black uppercase text-sm text-white tracking-wider">
              {months[selectedMonth]} {selectedYear}
            </div>
            <button 
              type="button"
              onClick={handleNextMonth} 
              className="p-2 hover:bg-white/10 active:scale-90 rounded-xl transition-all text-red-500"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* SOMENTE OS 5 CARDS DE MÉTRICAS SOLICITADOS */}
          <div className="grid grid-cols-1 gap-3.5 pt-1">
            <StatCard title="Total de Serviços" value={stats.total} icon={Truck} color="bg-indigo-600" />
            <StatCard title="Realizados" value={stats.realized} icon={CheckCircle2} color="bg-emerald-500" />
            <StatCard 
                title="Reembolso" 
                value={stats.pendingReimbursementValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                prefix="R$ " 
                icon={Wallet} 
                color="bg-amber-500" 
            />
            <StatCard title="Cancelados" value={stats.cancelled} icon={XCircle} color="bg-rose-500" />
            <StatCard title="Faturamento Líquido" value={stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} prefix="R$ " icon={DollarSign} color="bg-[#00AEEF]" />
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* CABEÇALHO ORIGINAL DESKTOP (PRESERVADO PARA TELAS GRANDES) */}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center space-x-5">
           <div className="w-16 h-16 bg-[#0A192F] rounded-2xl items-center justify-center text-white shadow-2xl flex">
              <TrendingUp size={36} className="text-[#00AEEF]" />
           </div>
           <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
                {isIndividualSummary ? 'Meu Resumo' : 'Resumo Geral'}
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base">{technicianName}</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-3">
          {isAdmin && (
            <button onClick={handleExportPDF} className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
              <FileText size={18} className="text-[#00AEEF]" />
              <span>Exportar PDF</span>
            </button>
          )}
          <div className="flex items-center justify-between space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={handlePrevMonth} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <ChevronLeft size={24} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
            </button>
            <div className="px-4 text-center min-w-[140px] font-black uppercase text-sm text-slate-800">{months[selectedMonth]} {selectedYear}</div>
            <button 
              onClick={handleNextMonth} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <ChevronRight size={24} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE MÉTRICAS E GRÁFICOS DO DESKTOP (ESCONDIDA NO MOBILE) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
        <StatCard title="Total de Serviços" value={stats.total} icon={Truck} color="bg-indigo-600" />
        <StatCard title="Realizados" value={stats.realized} icon={CheckCircle2} color="bg-emerald-500" />
        
        {/* Card de Reembolso */}
        <StatCard 
            title="Reembolso a Receber" 
            value={stats.pendingReimbursementValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            prefix="R$ " 
            icon={Wallet} 
            color="bg-amber-500" 
        />
        
        <StatCard title="Cancelados" value={stats.cancelled} icon={XCircle} color="bg-rose-500" />
        <StatCard title="Faturamento Líquido" value={stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} prefix="R$ " icon={DollarSign} color="bg-[#00AEEF]" />
      </div>

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-slate-300">
          <h4 className="text-lg font-black text-slate-800 uppercase mb-8 flex items-center"><PieChart className="mr-2 text-[#00AEEF]" size={20} /> Participação</h4>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={Object.values(Company).map(comp => ({ name: comp, value: filteredServices.filter(s => s.company === comp).length }))} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {Object.values(Company).map((entry, index) => <Cell key={index} fill={COLORS[entry as Company]} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-slate-300">
          <h4 className="text-lg font-black text-slate-800 uppercase mb-8 flex items-center"><BarChart3 className="mr-2 text-[#10B981]" size={20} /> Produção por Tipo</h4>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.values(ServiceType).map(type => ({ name: type, value: filteredServices.filter(s => s.type === type).length }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} interval={0} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                  {Object.values(ServiceType).map((entry, index) => <Cell key={index} fill={COLORS[entry as ServiceType]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
