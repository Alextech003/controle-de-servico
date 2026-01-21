import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Service, ServiceStatus, Reimbursement } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Reimbursements from './components/Reimbursements';
import Users from './components/Users';
import Profile from './components/Profile';
import Login from './components/Login';
import Logo from './components/Logo';
import MonthlyReminder from './components/MonthlyReminder';
import ReimbursementIntro from './components/ReimbursementIntro';
import { supabase, mapServiceFromDB, mapServiceToDB, mapUserFromDB, mapUserToDB, mapReimbursementFromDB, mapReimbursementToDB } from './lib/supabase';
import { MOCK_USERS, MOCK_REIMBURSEMENTS } from './constants';
import { Loader2, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'reimbursements' | 'users' | 'profile'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewingTechnicianId, setViewingTechnicianId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      
      // 1. Tentar recuperar sessão local
      const savedSession = localStorage.getItem('sc_session');
      if (savedSession) setCurrentUser(JSON.parse(savedSession));

      // 2. Buscar dados do Banco de Dados
      await fetchAllData();
      setLoading(false);
    };

    initApp();
  }, []);

  const fetchAllData = async () => {
    try {
      // Buscar Usuários
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      
      if (usersError && (usersError.code === 'PGRST301' || usersError.message?.includes('JWT') || usersError.message?.includes('API key'))) {
          console.warn("Modo Offline/Demo Ativado: Chave Supabase inválida detectada.");
          setUsers(MOCK_USERS);
          setReimbursements(MOCK_REIMBURSEMENTS);
      } else if (usersError) {
          throw usersError;
      } else {
        if (!usersData || usersData.length === 0) {
            setUsers(MOCK_USERS);
        } else {
            setUsers(usersData.map(mapUserFromDB));
        }
      }

      // Buscar Serviços
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('date', { ascending: false });
      if (!servicesError && servicesData) {
          setServices(servicesData.map(mapServiceFromDB));
      }

      // Buscar Reembolsos
      const { data: reimbData, error: reimbError } = await supabase.from('reimbursements').select('*').order('date', { ascending: false });
      if (!reimbError && reimbData) {
          setReimbursements(reimbData.map(mapReimbursementFromDB));
      } else {
          // Fallback se a tabela não existir ainda
          setReimbursements(MOCK_REIMBURSEMENTS);
      }
      
      setDbError(null);
    } catch (error: any) {
      console.error("Erro ao conectar com banco:", error);
      setUsers(prev => prev.length > 0 ? prev : MOCK_USERS);
      setReimbursements(prev => prev.length > 0 ? prev : MOCK_REIMBURSEMENTS);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sc_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sc_session');
    setActiveTab('dashboard');
    setViewingTechnicianId(null);
  };

  // --- CRUD Serviços ---
  const handleSaveService = async (service: Service) => {
    try {
      const exists = services.find(s => s.id === service.id);
      const dbPayload = mapServiceToDB(service);

      if (exists) {
        setServices(prev => prev.map(s => s.id === service.id ? service : s));
        await supabase.from('services').update(dbPayload).eq('id', service.id);
      } else {
        setServices(prev => [service, ...prev]);
        await supabase.from('services').insert(dbPayload);
      }
    } catch (error) {
      console.error("Aviso: Dados salvos apenas localmente (Erro de API).", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    const previousServices = [...services];
    setServices(prev => prev.filter(s => String(s.id) !== String(id)));

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      const isAuthError = error.message?.includes('JWT') || error.code === '401' || error.message?.includes('API key');
      if (!isAuthError) {
          alert(`Erro ao excluir no servidor: ${error.message}. Revertendo ação.`);
          setServices(previousServices);
      }
    }
  };

  // --- CRUD Reembolsos ---
  const handleSaveReimbursement = async (reimbursement: Reimbursement) => {
    try {
      setReimbursements(prev => [reimbursement, ...prev]);
      const dbPayload = mapReimbursementToDB(reimbursement);
      await supabase.from('reimbursements').insert(dbPayload);
    } catch (error) {
      console.error("Salvo localmente apenas.", error);
    }
  };

  const handleDeleteReimbursement = async (id: string) => {
     setReimbursements(prev => prev.filter(r => r.id !== id));
     try {
       await supabase.from('reimbursements').delete().eq('id', id);
     } catch (error) { console.error(error); }
  };

  // --- CRUD Usuários ---
  const handleSaveUser = async (user: User) => {
    try {
      const exists = users.find(u => u.id === user.id);
      const dbPayload = mapUserToDB(user);

      if (exists) {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        await supabase.from('users').update(dbPayload).eq('id', user.id);
        
        if (currentUser && currentUser.id === user.id) {
           setCurrentUser(user);
           localStorage.setItem('sc_session', JSON.stringify(user));
        }
      } else {
        setUsers(prev => [...prev, user]);
        await supabase.from('users').insert(dbPayload);
      }
    } catch (error) {
      console.error("Salvo localmente apenas.", error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== id));
      await supabase.from('users').delete().eq('id', id);
    } catch (error) {
      console.error("Excluído localmente apenas.", error);
    }
  };

  // Dados Visíveis
  const visibleServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN) {
        if (viewingTechnicianId) return services.filter(s => s.technicianId === viewingTechnicianId);
        return services;
    }
    return services.filter(s => s.technicianId === currentUser.id);
  }, [services, currentUser, viewingTechnicianId]);

  const visibleReimbursements = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN) {
      return reimbursements;
    }
    return reimbursements.filter(r => r.technicianId === currentUser.id);
  }, [reimbursements, currentUser]);

  const dashboardServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.TECHNICIAN) {
      return services.filter(s => s.technicianId === currentUser.id);
    }
    if (viewingTechnicianId) {
      return services.filter(s => s.technicianId === viewingTechnicianId);
    }
    return services;
  }, [services, currentUser, viewingTechnicianId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
         <Loader2 className="w-10 h-10 animate-spin text-[#00AEEF] mb-4" />
         <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  if (dbError && users.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-rose-50 p-8 text-center">
         <h1 className="text-2xl font-black text-rose-600 mb-2">Erro de Conexão</h1>
         <p className="text-rose-800 mb-4">{dbError}</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            services={dashboardServices} 
            currentUser={currentUser} 
            users={users} 
            viewingTechnicianId={viewingTechnicianId}
            onViewTechnician={(id) => {
                setViewingTechnicianId(id);
                setActiveTab('services');
            }}
          />
        );
      case 'services':
        return (
          <Services 
            services={visibleServices} 
            currentUser={currentUser} 
            users={users}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            viewingTechnicianId={viewingTechnicianId}
            onClearFilter={() => setViewingTechnicianId(null)}
            onFilterByTech={(id) => setViewingTechnicianId(id)}
          />
        );
      case 'reimbursements':
        return (
          <Reimbursements
            reimbursements={visibleReimbursements}
            currentUser={currentUser}
            users={users}
            onSaveReimbursement={handleSaveReimbursement}
            onDeleteReimbursement={handleDeleteReimbursement}
          />
        );
      case 'users':
        if (currentUser.role !== UserRole.MASTER) return <div className="p-4 md:p-8">Acesso restrito.</div>;
        return <Users users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />;
      case 'profile':
        return <Profile user={currentUser} onUpdateUser={handleSaveUser} />;
      default:
        return <Dashboard services={dashboardServices} currentUser={currentUser} users={users} viewingTechnicianId={viewingTechnicianId} onViewTechnician={(id) => setViewingTechnicianId(id)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      
      {currentUser && <MonthlyReminder currentUser={currentUser} />}
      {currentUser && <ReimbursementIntro />}

      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-40 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <Logo size={32} />
          <div className="flex flex-col">
            <span className="text-lg font-black text-[#0A192F] uppercase tracking-tight leading-none">
              AIRO<span className="text-red-600">TRACKER</span>
            </span>
            <div className="flex items-center">
               <span className="text-red-600 text-[10px] font-black mr-0.5">+</span>
               <span className="text-slate-800 text-[9px] font-black uppercase">Técnicos</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl"
        >
          <Menu size={28} />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false); 
        }} 
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-20 md:pt-0 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;