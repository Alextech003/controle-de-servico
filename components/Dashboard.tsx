import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle2, DollarSign, XCircle, 
  ChevronLeft, ChevronRight, TrendingUp, FileText, PieChart, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Service, ServiceStatus, User, UserRole, Company, ServiceType, CancelledBy } from '../types';

interface DashboardProps {
  services: Service[];
  currentUser: User;
  users: User[];
  viewingTechnicianId: string | null;
  onViewTechnician: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ services, currentUser, users, viewingTechnicianId }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

    return { total, realized, cancelled, revenue: grossRevenue - techPenalties };
  }, [filteredServices]);

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

  const StatCard = ({ title, value, icon: Icon, color, prefix = "" }: any) => (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 print:shadow-none print:border-slate-300">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-black text-slate-900">{prefix}{value}</h3>
      </div>
      <div className={`p-5 rounded-2xl ${color} text-white`}>
        <Icon size={28} />
      </div>
    </div>
  );

  const isAdmin = currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN;
  const isIndividualSummary = currentUser.role === UserRole.TECHNICIAN || viewingTechnicianId !== null;
  const technicianName = viewingTechnicianId ? users.find(u => u.id === viewingTechnicianId)?.name : currentUser.name;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center space-x-5">
           <div className="w-16 h-16 bg-[#0A192F] rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <TrendingUp size={36} className="text-[#00AEEF]" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                {isIndividualSummary ? 'Meu Resumo' : 'Resumo Geral'}
              </h1>
              <p className="text-slate-500 font-medium">{technicianName}</p>
           </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button onClick={handleExportPDF} className="flex items-center space-x-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
              <FileText size={18} className="text-[#00AEEF]" />
              <span>Exportar PDF</span>
            </button>
          )}
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200">
            <button 
              onClick={() => { let nm = selectedMonth - 1; if(nm < 0) { nm=11; setSelectedYear(selectedYear-1); } setSelectedMonth(nm); }} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <ChevronLeft size={24} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
            </button>
            <div className="px-4 text-center min-w-[140px] font-black uppercase text-sm text-slate-800">{months[selectedMonth]} {selectedYear}</div>
            <button 
              onClick={() => { let nm = selectedMonth + 1; if(nm > 11) { nm=0; setSelectedYear(selectedYear+1); } setSelectedMonth(nm); }} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <ChevronRight size={24} className="text-[#00AEEF] group-active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total de Serviços" value={stats.total} icon={Truck} color="bg-indigo-600" />
        <StatCard title="Realizados" value={stats.realized} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Cancelados" value={stats.cancelled} icon={XCircle} color="bg-rose-500" />
        <StatCard title="Faturamento Líquido" value={stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} prefix="R$ " icon={DollarSign} color="bg-[#00AEEF]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-slate-300">
          <h4 className="text-lg font-black text-slate-800 uppercase mb-8 flex items-center"><PieChart className="mr-2 text-[#00AEEF]" size={20} /> Participação</h4>
          <div className="h-[300px] w-full">
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

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:border-slate-300">
          <h4 className="text-lg font-black text-slate-800 uppercase mb-8 flex items-center"><BarChart3 className="mr-2 text-[#10B981]" size={20} /> Produção por Tipo</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.values(ServiceType).map(type => ({ name: type, value: filteredServices.filter(s => s.type === type).length }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
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