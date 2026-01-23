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
import { Loader2, Menu, AlertTriangle, Database } from 'lucide-react';

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

      // Buscar Serviços
      if (!isDemoMode) {
          const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('date', { ascending: false });
          if (!servicesError && servicesData) {
              setServices(servicesData.map(mapServiceFromDB));
          }

          // Buscar Reembolsos
          const { data: reimbData, error: reimbError } = await supabase.from('reimbursements').select('*').order('date', { ascending: false });
          if (reimbError) {
              console.error("Erro ao buscar reembolsos:", reimbError);
              if (reimbError.code === '42P01') { 
                console.warn("Tabela 'reimbursements' não encontrada.");
                setReimbursements([]);
              }
          } else if (reimbData) {
              setReimbursements(reimbData.map(mapReimbursementFromDB));
          }
      } else {
          // Se estiver em modo demo, zera os serviços para não confundir o usuário com dados falsos
          // ou mantenha vazio para ele começar a preencher
          setServices([]);
      }
      
      setDbError(null);
    } catch (error: any) {
      console.error("Erro ao conectar com banco:", error);
      setIsDemoMode(true);
      setUsers(prev => prev.length > 0 ? prev : MOCK_USERS);
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
      if (isDemoMode) {
          alert("ATENÇÃO: Você está em MODO DE TESTE. \n\nEsse serviço NÃO SERÁ SALVO de verdade porque a Chave API do Supabase ainda não foi configurada. \n\nAtualize a chave no arquivo 'lib/supabase.ts' para salvar permanentemente.");
          setServices(prev => [service, ...prev]); 
          return;
      }

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

    if (isDemoMode) return;

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
    if (isDemoMode) {
        alert("ATENÇÃO: Você está em MODO DE TESTE. \n\nEsse reembolso aparecerá na tela agora, mas se você recarregar a página, ele SUMIRÁ. \n\nConfigure a Chave API no código para salvar de verdade.");
        setReimbursements(prev => [reimbursement, ...prev]);
        return;
    }

    // 1. Atualização Otimista
    setReimbursements(prev => [reimbursement, ...prev]);

    try {
      const dbPayload = mapReimbursementToDB(reimbursement);
      
      // Tenta inserir no banco
      const { error } = await supabase.from('reimbursements').insert(dbPayload);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Erro ao salvar reembolso no banco:", error);
      
      // Reverte a atualização otimista em caso de erro
      setReimbursements(prev => prev.filter(r => r.id !== reimbursement.id));
      
      let msg = "ERRO AO SALVAR:";
      if (error.code === '42P01') {
        msg = "ERRO CRÍTICO: A tabela 'reimbursements' NÃO EXISTE no seu Supabase.\nVocê precisa executar o comando SQL fornecido.";
      } else if (error.code === '22P02') {
        msg = "ERRO DE FORMATO: O banco esperava um UUID mas recebeu texto simples.";
      } else if (error.message && error.message.includes('payload')) {
        msg = "ARQUIVO MUITO GRANDE: O banco rejeitou o anexo. Tente uma foto menor ou sem foto.";
      } else {
        msg = `Erro desconhecido: ${error.message}`;
      }
      
      alert(msg);
    }
  };

  const handleDeleteReimbursement = async (id: string) => {
     setReimbursements(prev => prev.filter(r => r.id !== id));
     if (isDemoMode) return;
     try {
       await supabase.from('reimbursements').delete().eq('id', id);
     } catch (error) { console.error(error); }
  };

  // --- CRUD Usuários ---
  const handleSaveUser = async (user: User) => {
    if (isDemoMode) {
        setUsers(prev => [...prev, user]);
        return;
    }
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
      if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
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