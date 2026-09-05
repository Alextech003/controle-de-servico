
import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle2, DollarSign, XCircle, 
  ChevronLeft, ChevronRight, TrendingUp, FileText, PieChart, BarChart3, Radio, Wallet,
  ClipboardList, Receipt, UserCircle, Shield, Activity, Zap
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

  // Custom Tooltip estilizado no tema escuro do login
  const CustomDarkTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#0B0F17] border border-red-500/50 px-3.5 py-2 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.9)] text-white">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">{data.name}</p>
          <p className="text-sm font-black text-cyan-400 mt-0.5">
            {data.value} {typeof data.value === 'number' && data.value === 1 ? 'registro' : 'registros'}
          </p>
        </div>
      );
    }
    return null;
  };

  // StatCard Desktop estilo Cockpit Tático
  const StatCard = ({ title, value, icon: Icon, color, prefix = "", className = "", isPrimary = false }: any) => (
    <div className={`p-5 md:p-6 rounded-3xl relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] shadow-[0_10px_25px_rgba(0,0,0,0.6)] border ${
      isPrimary 
        ? 'bg-gradient-to-b from-[#182338] via-[#0E1524] to-[#0A0D15] border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]' 
        : 'bg-[#0E131E]/95 border-slate-800/90 hover:border-red-500/40'
    } flex items-center justify-between h-full ${className}`}>
      
      {/* Feixe sutil no topo do card */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        isPrimary 
          ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-red-500/50'
      } transition-all`}></div>
      
      <div>
        <div className="flex items-center space-x-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/80"></span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {prefix}{value}
        </h3>
      </div>
      
      <div className={`p-3.5 md:p-4 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="md:w-6 md:h-6" />
      </div>
    </div>
  );

  const StockCard = ({ title, total, byCompany, icon: Icon, color, className = "" }: any) => (
    <div className={`bg-[#0E131E]/95 p-6 rounded-3xl border border-slate-800/90 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden h-full ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl md:text-3xl font-black text-white">{total}</h3>
            </div>
            <div className={`p-3.5 rounded-2xl ${color} text-white shadow-lg`}>
                <Icon size={22} />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3">
             <div className="text-center">
                 <p className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">AIROCLUBE</p>
                 <p className="text-base font-black text-white mt-0.5">{byCompany[Company.AIROCLUBE]}</p>
             </div>
             <div className="text-center border-l border-r border-slate-800">
                 <p className="text-[9px] font-black text-orange-400 uppercase tracking-wider">AIROTRACKER</p>
                 <p className="text-base font-black text-white mt-0.5">{byCompany[Company.AIROTRACKER]}</p>
             </div>
             <div className="text-center">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">CARTRAC</p>
                 <p className="text-base font-black text-white mt-0.5">{byCompany[Company.CARTRAC]}</p>
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
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                Início
              </h1>
              <p className="text-xs font-semibold text-slate-400">{technicianName}</p>
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
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                Resumo
              </h1>
              <p className="text-xs font-semibold text-slate-400">{technicianName}</p>
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
      {/* SEÇÃO DA VERSÃO COMPUTADOR (DESKTOP)                      */}
      {/* Estilo 100% alinhado com a tela de login: preto metálico, */}
      {/* detalhes táticos, feixes vermelhos e gráficos de alta     */}
      {/* tecnologia para monitoramento operacional 24H            */}
      {/* ======================================================== */}
      <div className="hidden md:block space-y-8 print:block relative">
        
        {/* Glow de fundo sutil no desktop */}
        <div className="absolute -top-10 left-1/4 w-[500px] h-[300px] bg-red-600/10 rounded-full blur-[130px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none"></div>

        {/* CABEÇALHO TÁTICO DESKTOP ESTILO LOGIN */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-r from-[#0E131E] via-[#141B28] to-[#0A0D15] border border-red-500/30 shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Feixe vermelho neon na borda superior */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent pointer-events-none"></div>

          {/* Lado Esquerdo: Branding & Título */}
          <div className="flex items-center space-x-5 z-10">
            
            {/* Pedestal chanfrado com anéis de radar e ícone 3D */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1C2436] via-[#0E131F] to-[#07090E] border border-red-500/40 p-[2px] shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center group">
              <div className="w-full h-full rounded-[14px] bg-[#0A0D14] flex items-center justify-center relative overflow-hidden">
                <TrendingUp size={28} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(0,174,239,0.7)] group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PAINEL OPERACIONAL TÁTICO</span>
                <span className="text-red-500 font-black text-xs">•</span>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">MONITORAMENTO 24H</span>
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">
                {isIndividualSummary ? 'Meu Resumo Operacional' : 'Resumo Geral de Operações'}
              </h1>
              <p className="text-slate-400 font-semibold text-xs lg:text-sm mt-0.5">
                Operador: <span className="text-white font-bold">{technicianName}</span>
              </p>
            </div>
          </div>

          {/* Lado Direito: Controles Táticos (Exportar & Seletor de Mês) */}
          <div className="flex flex-wrap items-center gap-3 z-10">
            {isAdmin && (
              <button 
                type="button"
                onClick={handleExportPDF} 
                className="flex items-center space-x-2 px-5 py-3 bg-[#0B0F17] hover:bg-red-600/10 border border-red-500/40 hover:border-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 transition-all cursor-pointer"
              >
                <FileText size={16} className="text-cyan-400" />
                <span>Exportar Relatório</span>
              </button>
            )}

            {/* Seletor de Mês Metálico */}
            <div className="flex items-center space-x-2 bg-[#080B10] p-1.5 rounded-2xl border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <button 
                type="button"
                onClick={handlePrevMonth} 
                className="p-2 hover:bg-[#151C2A] rounded-xl transition-all text-slate-400 hover:text-red-400 active:scale-90 cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="px-3 text-center min-w-[140px]">
                <p className="text-[8px] text-red-500 uppercase font-black tracking-widest">Período Selecionado</p>
                <p className="font-black uppercase text-xs lg:text-sm text-white tracking-wider mt-0.5">
                  {months[selectedMonth]} {selectedYear}
                </p>
              </div>

              <button 
                type="button"
                onClick={handleNextMonth} 
                className="p-2 hover:bg-[#151C2A] rounded-xl transition-all text-slate-400 hover:text-red-400 active:scale-90 cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* 5 CARDS DE MÉTRICAS PRINCIPAIS NO DESKTOP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <StatCard 
            title="Total de Serviços" 
            value={stats.total} 
            icon={Truck} 
            color="bg-indigo-600/90 shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
          />
          
          <StatCard 
            title="Realizados" 
            value={stats.realized} 
            icon={CheckCircle2} 
            color="bg-emerald-600/90 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
          />
          
          <StatCard 
            title="Reembolso a Receber" 
            value={stats.pendingReimbursementValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            prefix="R$ " 
            icon={Wallet} 
            color="bg-amber-600/90 shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
          />
          
          <StatCard 
            title="Cancelados" 
            value={stats.cancelled} 
            icon={XCircle} 
            color="bg-rose-600/90 shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
          />
          
          {/* Card Principal: Faturamento Líquido com Destaque Neon */}
          <StatCard 
            title="Faturamento Líquido" 
            value={stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            prefix="R$ " 
            icon={DollarSign} 
            color="bg-[#00AEEF] shadow-[0_0_18px_rgba(0,174,239,0.5)]" 
            isPrimary={true}
          />
        </div>

        {/* GRÁFICOS DESKTOP ESTILO COCKPIT TÁTICO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card de Participação por Empresa (Donut) */}
          <div className="bg-[#0E131E]/95 p-6 lg:p-7 rounded-3xl border border-red-500/25 shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs lg:text-sm font-black text-white uppercase tracking-wider flex items-center">
                <PieChart className="mr-2 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,174,239,0.6)]" size={18} /> 
                Participação por Empresa
              </h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#141C2B] border border-slate-800">
                {stats.total} OS
              </span>
            </div>

            <div className="h-[240px] w-full flex items-center justify-center">
              {stats.total === 0 ? (
                <div className="text-center text-slate-500 text-xs py-10">
                  Nenhum serviço registrado neste mês.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie 
                      data={Object.values(Company).map(comp => ({ name: comp, value: filteredServices.filter(s => s.company === comp).length }))} 
                      innerRadius={60} 
                      outerRadius={88} 
                      paddingAngle={4} 
                      dataKey="value"
                    >
                      {Object.values(Company).map((entry, index) => (
                        <Cell key={index} fill={COLORS[entry as Company]} stroke="#0E131E" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomDarkTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legenda Horizontal Tática */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
              {Object.values(Company).map((comp) => {
                const count = filteredServices.filter(s => s.company === comp).length;
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={comp} className="text-center p-2 rounded-xl bg-[#090D14] border border-slate-800/80">
                    <p className="text-[8.5px] font-black uppercase tracking-wider truncate" style={{ color: COLORS[comp] }}>
                      {comp}
                    </p>
                    <p className="text-sm font-black text-white mt-0.5">{count}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{percent}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card de Produção por Tipo de O.S. (Bar Chart) */}
          <div className="lg:col-span-2 bg-[#0E131E]/95 p-6 lg:p-7 rounded-3xl border border-red-500/25 shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs lg:text-sm font-black text-white uppercase tracking-wider flex items-center">
                <BarChart3 className="mr-2 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" size={18} /> 
                Produção por Tipo de Operação
              </h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#141C2B] border border-slate-800">
                DISTRIBUIÇÃO
              </span>
            </div>

            <div className="h-[240px] w-full">
              {stats.total === 0 ? (
                <div className="text-center text-slate-500 text-xs py-10">
                  Nenhum serviço registrado neste mês.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.values(ServiceType).map(type => ({ 
                      name: type, 
                      value: filteredServices.filter(s => s.type === type).length 
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A2234" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} 
                      interval={0} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748B' }} 
                    />
                    <Tooltip content={<CustomDarkTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={44}>
                      {Object.values(ServiceType).map((entry, index) => (
                        <Cell key={index} fill={COLORS[entry as ServiceType]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Rodapé Tático com Indicadores dos Tipos */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
              {Object.values(ServiceType).map((type) => {
                const count = filteredServices.filter(s => s.type === type).length;
                return (
                  <div key={type} className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#090D14] border border-slate-800/80">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[type] }}></span>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{type}</p>
                      <p className="text-xs font-black text-white">{count} execuções</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PRONTIDÃO TÁTICA: ESTOQUE DE RASTREADORES PARA CAMPO */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B0F17] via-[#101622] to-[#0A0D14] border border-red-500/20 shadow-[0_10px_25px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Prontidão Operacional de Rastreadores
                </h4>
                <p className="text-[10px] text-slate-400">Equipamentos disponíveis em carga prontos para instalação imediata</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black text-emerald-400 uppercase">
                {stats.availableTrackers} DISPONÍVEIS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#080B10] border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">AIROCLUBE</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.byCompany[Company.AIROCLUBE]}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Aparelhos</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080B10] border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">AIROTRACKER</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.byCompany[Company.AIROTRACKER]}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Aparelhos</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080B10] border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">CARTRAC</p>
                <p className="text-lg font-black text-white mt-0.5">{stats.byCompany[Company.CARTRAC]}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Aparelhos</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
