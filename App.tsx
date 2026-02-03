
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Service, ServiceStatus, Reimbursement, Tracker, TrackerStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Trackers from './components/Trackers';
import Reimbursements from './components/Reimbursements';
import Users from './components/Users';
import Profile from './components/Profile';
import Login from './components/Login';
import Logo from './components/Logo';
import MonthlyReminder from './components/MonthlyReminder';
import ReimbursementIntro from './components/ReimbursementIntro';
import { supabase, mapServiceFromDB, mapServiceToDB, mapUserFromDB, mapUserToDB, mapReimbursementFromDB, mapReimbursementToDB, mapTrackerFromDB, mapTrackerToDB } from './lib/supabase';
import { MOCK_USERS, MOCK_REIMBURSEMENTS, MOCK_TRACKERS, MOCK_SERVICES } from './constants';
import { Loader2, Menu, AlertTriangle, Database } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'reimbursements' | 'users' | 'profile' | 'trackers'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewingTechnicianId, setViewingTechnicianId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
      
      if (usersError && (usersError.code === 'PGRST301' || usersError.message?.includes('JWT') || usersError.message?.includes('API key') || usersError.message?.includes('Failed to fetch'))) {
          console.warn("Modo Offline/Demo Ativado: Chave Supabase inválida ou erro de conexão.");
          setIsDemoMode(true);
          setUsers(MOCK_USERS);
          setReimbursements(MOCK_REIMBURSEMENTS);
          setTrackers(MOCK_TRACKERS);
          setServices(MOCK_SERVICES);
      } else if (usersError) {
          throw usersError;
      } else {
        setIsDemoMode(false);
        if (!usersData || usersData.length === 0) {
            setUsers(MOCK_USERS);
        } else {
            setUsers(usersData.map(mapUserFromDB));
        }
      }

      // Buscar Serviços, Reembolsos e Rastreadores
      if (!isDemoMode) {
          const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('date', { ascending: false });
          if (!servicesError && servicesData) {
              setServices(servicesData.map(mapServiceFromDB));
          }

          const { data: reimbData, error: reimbError } = await supabase.from('reimbursements').select('*').order('date', { ascending: false });
          if (!reimbError && reimbData) {
              setReimbursements(reimbData.map(mapReimbursementFromDB));
          }

          const { data: trackersData, error: trackersError } = await supabase.from('trackers').select('*').order('date', { ascending: false });
          if (!trackersError && trackersData) {
              setTrackers(trackersData.map(mapTrackerFromDB));
          } else {
             // Caso a tabela ainda não exista no Supabase
             setTrackers([]);
          }
      } 
      
      setDbError(null);
    } catch (error: any) {
      console.error("Erro ao conectar com banco:", error);
      setIsDemoMode(true);
      setUsers(prev => prev.length > 0 ? prev : MOCK_USERS);
      setTrackers(MOCK_TRACKERS); // Fallback
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

  // --- CRUD Serviços & BAIXA DE ESTOQUE ---
  const handleSaveService = async (service: Service) => {
    try {
      if (isDemoMode) {
          alert("Modo Demo: Serviço salvo localmente.");
          setServices(prev => {
              const exists = prev.find(s => s.id === service.id);
              if (exists) return prev.map(s => s.id === service.id ? service : s);
              return [service, ...prev];
          });
          
          // Simula baixa de estoque no modo demo
          if (service.imei) {
             setTrackers(prev => prev.map(t => t.imei === service.imei ? { 
                ...t, 
                status: TrackerStatus.INSTALADO,
                installationDate: service.date // Salva data de instalação
             } : t));
          }
          return;
      }

      const exists = services.find(s => s.id === service.id);
      const dbPayload = mapServiceToDB(service);

      // 1. Salva o Serviço
      if (exists) {
        setServices(prev => prev.map(s => s.id === service.id ? service : s));
        await supabase.from('services').update(dbPayload).eq('id', service.id);
      } else {
        setServices(prev => [service, ...prev]);
        await supabase.from('services').insert(dbPayload);
      }

      // 2. Lógica de Baixa de Estoque Automática (Vincular Equipamento)
      if (service.imei) {
         // Procura o rastreador pelo IMEI
         const tracker = trackers.find(t => t.imei === service.imei);
         
         // Se encontrar e ele estiver disponível, atualiza para INSTALADO
         if (tracker && tracker.status === TrackerStatus.DISPONIVEL) {
             const updatedTracker: Tracker = { 
               ...tracker, 
               status: TrackerStatus.INSTALADO,
               installationDate: service.date // Salva data de instalação 
             };
             
             // Atualiza estado local
             setTrackers(prev => prev.map(t => t.id === tracker.id ? updatedTracker : t));
             
             // Atualiza no banco
             await supabase.from('trackers').update(mapTrackerToDB(updatedTracker)).eq('id', tracker.id);
             console.log(`Baixa de estoque efetuada para IMEI ${service.imei}`);
         }
      }

    } catch (error) {
      console.error("Erro ao salvar serviço ou atualizar estoque:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    const previousServices = [...services];
    setServices(prev => prev.filter(s => String(s.id) !== String(id)));

    if (isDemoMode) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      alert(`Erro ao excluir no servidor: ${error.message}`);
      setServices(previousServices);
    }
  };

  // --- CRUD Reembolsos ---
  const handleSaveReimbursement = async (reimbursement: Reimbursement) => {
    const exists = reimbursements.find(r => r.id === reimbursement.id);
    if (exists) {
        setReimbursements(prev => prev.map(r => r.id === reimbursement.id ? reimbursement : r));
    } else {
        setReimbursements(prev => [reimbursement, ...prev]);
    }

    if (isDemoMode) return;

    try {
      const dbPayload = mapReimbursementToDB(reimbursement);
      if (exists) {
         await supabase.from('reimbursements').update(dbPayload).eq('id', reimbursement.id);
      } else {
         await supabase.from('reimbursements').insert(dbPayload);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteReimbursement = async (id: string) => {
     setReimbursements(prev => prev.filter(r => r.id !== id));
     if (isDemoMode) return;
     try {
       await supabase.from('reimbursements').delete().eq('id', id);
     } catch (error) { console.error(error); }
  };

  // --- CRUD Rastreadores (Estoque) ---
  const handleSaveTracker = async (tracker: Tracker) => {
     const exists = trackers.find(t => t.id === tracker.id);
     
     if (exists) {
        setTrackers(prev => prev.map(t => t.id === tracker.id ? tracker : t));
     } else {
        setTrackers(prev => [tracker, ...prev]);
     }

     if (isDemoMode) return;

     try {
        const dbPayload = mapTrackerToDB(tracker);
        if (exists) {
            await supabase.from('trackers').update(dbPayload).eq('id', tracker.id);
        } else {
            await supabase.from('trackers').insert(dbPayload);
        }
     } catch (error) { console.error(error); }
  };

  const handleDeleteTracker = async (id: string) => {
      setTrackers(prev => prev.filter(t => t.id !== id));
      if (isDemoMode) return;
      try {
          await supabase.from('trackers').delete().eq('id', id);
      } catch (error) { console.error(error); }
  };

  // --- CRUD Usuários ---
  const handleSaveUser = async (user: User) => {
    const exists = users.find(u => u.id === user.id);
    if (exists) {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    } else {
        setUsers(prev => [...prev, user]);
    }
    
    if (currentUser && currentUser.id === user.id) {
        setCurrentUser(user);
        localStorage.setItem('sc_session', JSON.stringify(user));
    }

    if (isDemoMode) return;
    try {
       const dbPayload = mapUserToDB(user);
       if (exists) await supabase.from('users').update(dbPayload).eq('id', user.id);
       else await supabase.from('users').insert(dbPayload);
    } catch(e) { console.error(e); }
  };

  const handleDeleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
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
    if (currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN) return reimbursements;
    return reimbursements.filter(r => r.technicianId === currentUser.id);
  }, [reimbursements, currentUser]);

  const visibleTrackers = useMemo(() => {
      if (!currentUser) return [];
      // Filtros de técnico/admin são aplicados dentro do componente Trackers.tsx para flexibilidade
      return trackers; 
  }, [trackers, currentUser]);

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
            trackers={trackers}
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
            trackers={trackers} // Prop passada para busca de estoque
          />
        );
      case 'trackers':
        return (
          <Trackers
            trackers={visibleTrackers}
            currentUser={currentUser}
            users={users}
            onSaveTracker={handleSaveTracker}
            onDeleteTracker={handleDeleteTracker}
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
      
      {/* ALERTA DE MODO DEMO - FIXO NO TOPO */}
      {isDemoMode && (
         <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white px-4 py-3 text-center shadow-lg animate-in slide-in-from-top flex items-center justify-center">
            <Database className="mr-2 animate-pulse" size={18} />
            <div>
                <p className="text-xs font-black uppercase tracking-widest">Modo Offline / Sem Conexão</p>
                <p className="text-[10px] font-medium opacity-90">Os dados exibidos são apenas de teste. As alterações NÃO estão sendo salvas. Atualize sua chave API.</p>
            </div>
         </div>
      )}

      {currentUser && <MonthlyReminder currentUser={currentUser} />}
      {currentUser && <ReimbursementIntro />}

      <div className={`md:hidden fixed left-0 right-0 h-20 bg-white border-b border-slate-100 z-40 flex items-center justify-between px-6 shadow-sm ${isDemoMode ? 'top-14' : 'top-0'}`}>
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

      <main className={`flex-1 overflow-y-auto pt-20 md:pt-0 transition-all duration-300 ${isDemoMode ? 'mt-14 md:mt-14' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
