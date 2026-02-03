
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Service, ServiceStatus, Reimbursement, Tracker, TrackerStatus, AppNotification } from './types';
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
import NotificationsPanel from './components/NotificationsPanel';
import { supabase, mapServiceFromDB, mapServiceToDB, mapUserFromDB, mapUserToDB, mapReimbursementFromDB, mapReimbursementToDB, mapTrackerFromDB, mapTrackerToDB, mapNotificationFromDB, mapNotificationToDB } from './lib/supabase';
import { MOCK_USERS, MOCK_REIMBURSEMENTS, MOCK_TRACKERS, MOCK_SERVICES } from './constants';
import { Loader2, Menu, Database, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'reimbursements' | 'users' | 'profile' | 'trackers'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [viewingTechnicianId, setViewingTechnicianId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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

      // Buscar Serviços, Reembolsos, Rastreadores e Notificações
      if (!isDemoMode) {
          const { data: servicesData } = await supabase.from('services').select('*').order('date', { ascending: false });
          if (servicesData) setServices(servicesData.map(mapServiceFromDB));

          const { data: reimbData } = await supabase.from('reimbursements').select('*').order('date', { ascending: false });
          if (reimbData) setReimbursements(reimbData.map(mapReimbursementFromDB));

          const { data: trackersData } = await supabase.from('trackers').select('*').order('date', { ascending: false });
          if (trackersData) setTrackers(trackersData.map(mapTrackerFromDB));
          
          // Buscar Notificações
          const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
          if (notifData) setNotifications(notifData.map(mapNotificationFromDB));
      } 
      
      setDbError(null);
    } catch (error: any) {
      console.error("Erro ao conectar com banco:", error);
      setIsDemoMode(true);
      setUsers(prev => prev.length > 0 ? prev : MOCK_USERS);
      setTrackers(MOCK_TRACKERS);
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

  // === SISTEMA DE NOTIFICAÇÃO (GHOST MODE: Alex Master Invisível) ===
  const notifyTechnician = async (recipientId: string, title: string, message: string, relatedEntityId?: string) => {
      // 1. Ghost Mode: Se for Alex Master (ID 1) ou master_main, NÃO gera notificação
      if (currentUser?.id === '1' || currentUser?.name === 'Alex Master' || currentUser?.id === 'master_main') {
          return;
      }

      // 2. Não notificar a si mesmo (ex: Admin editando algo que está no nome dele, se aplicável)
      if (currentUser?.id === recipientId) return;

      const newNotif: AppNotification = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          recipientId,
          authorName: currentUser?.name || 'Administração',
          title,
          message,
          isRead: false,
          relatedEntityId
      };

      setNotifications(prev => [newNotif, ...prev]);

      if (!isDemoMode) {
          await supabase.from('notifications').insert(mapNotificationToDB(newNotif));
      }
  };

  const handleMarkAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (!isDemoMode) await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleMarkAllAsRead = async () => {
      const myNotifs = notifications.filter(n => n.recipientId === currentUser?.id && !n.isRead);
      if (myNotifs.length === 0) return;
      
      setNotifications(prev => prev.map(n => n.recipientId === currentUser?.id ? { ...n, isRead: true } : n));
      
      if (!isDemoMode) {
          // Atualiza em lote ou um por um (Supabase suporta update com filtro)
          await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', currentUser?.id);
      }
  };

  // --- CRUD Serviços & BAIXA DE ESTOQUE & DEVOLUÇÃO ---
  const handleSaveService = async (service: Service) => {
    const oldService = services.find(s => s.id === service.id);

    // Optimistic Update
    setServices(prev => {
        const exists = prev.find(s => s.id === service.id);
        if (exists) return prev.map(s => s.id === service.id ? service : s);
        return [service, ...prev];
    });

    // --- NOTIFICAÇÃO ---
    // Se quem está salvando NÃO é o dono do serviço (ou seja, é um Master/Admin editando)
    if (currentUser?.role !== UserRole.TECHNICIAN && service.technicianId !== currentUser?.id) {
        if (!oldService) {
            notifyTechnician(service.technicianId, "Novo Serviço Adicionado", `O serviço para ${service.customerName} (${service.plate}) foi adicionado em sua lista.`, service.id);
        } else {
            notifyTechnician(service.technicianId, "Serviço Alterado", `O serviço de ${service.customerName} (${service.plate}) sofreu alterações.`, service.id);
        }
    }

    if (isDemoMode) {
        alert("Modo Demo: Serviço salvo localmente.");
        return;
    }

    try {
      const dbPayload = mapServiceToDB(service);
      const { error } = oldService 
        ? await supabase.from('services').update(dbPayload).eq('id', service.id)
        : await supabase.from('services').insert(dbPayload);

      if (error) throw error;

      // Lógica de Estoque (Instalação e Devolução) - Mantida igual
      if (oldService && oldService.imei && oldService.imei !== service.imei) {
          const oldTracker = trackers.find(t => t.imei === oldService.imei);
          if (oldTracker) {
              const releasedTracker = { ...oldTracker, status: TrackerStatus.DISPONIVEL, installationDate: undefined };
              setTrackers(prev => prev.map(t => t.id === releasedTracker.id ? releasedTracker : t));
              await supabase.from('trackers').update(mapTrackerToDB(releasedTracker)).eq('id', releasedTracker.id);
          }
      }

      if (service.imei && (!oldService || oldService.imei !== service.imei)) {
         const tracker = trackers.find(t => t.imei === service.imei);
         if (tracker && tracker.status === TrackerStatus.DISPONIVEL) {
             const updatedTracker = { ...tracker, status: TrackerStatus.INSTALADO, installationDate: service.date };
             setTrackers(prev => prev.map(t => t.id === tracker.id ? updatedTracker : t));
             await supabase.from('trackers').update(mapTrackerToDB(updatedTracker)).eq('id', tracker.id);
         }
      }

      if (service.removedImei && service.removedModel) {
          const existingTracker = trackers.find(t => t.imei === service.removedImei);
          if (existingTracker) {
              const returnedTracker = {
                  ...existingTracker,
                  status: TrackerStatus.DEVOLUCAO,
                  model: service.removedModel,
                  company: service.removedCompany || existingTracker.company,
                  technicianId: service.technicianId,
                  technicianName: service.technicianName
              };
              setTrackers(prev => prev.map(t => t.id === returnedTracker.id ? returnedTracker : t));
              await supabase.from('trackers').update(mapTrackerToDB(returnedTracker)).eq('id', returnedTracker.id);
          } else {
              const newReturnTracker: Tracker = {
                  id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                  date: service.date,
                  model: service.removedModel,
                  imei: service.removedImei,
                  company: service.removedCompany || service.company,
                  status: TrackerStatus.DEVOLUCAO,
                  technicianId: service.technicianId,
                  technicianName: service.technicianName
              };
              setTrackers(prev => [...prev, newReturnTracker]);
              await supabase.from('trackers').insert(mapTrackerToDB(newReturnTracker));
          }
      }

    } catch (error: any) {
      console.error("Erro ao salvar serviço:", error);
      fetchAllData();
    }
  };

  const handleDeleteService = async (id: string) => {
    const serviceToDelete = services.find(s => String(s.id) === String(id));
    
    // Notificação de Exclusão
    if (serviceToDelete && currentUser?.role !== UserRole.TECHNICIAN && serviceToDelete.technicianId !== currentUser?.id) {
        notifyTechnician(serviceToDelete.technicianId, "Serviço Removido", `O serviço de ${serviceToDelete.customerName} (${serviceToDelete.plate}) foi removido da sua lista.`);
    }

    const previousServices = [...services];
    setServices(prev => prev.filter(s => String(s.id) !== String(id)));

    // Reversão de Estoque
    if (serviceToDelete && serviceToDelete.imei) {
        const tracker = trackers.find(t => t.imei === serviceToDelete.imei);
        if (tracker) {
            const updatedTracker = { ...tracker, status: TrackerStatus.DISPONIVEL, installationDate: undefined };
            setTrackers(prev => prev.map(t => t.id === tracker.id ? updatedTracker : t));
            if (!isDemoMode) supabase.from('trackers').update(mapTrackerToDB(updatedTracker)).eq('id', tracker.id).then();
        }
    }

    if (isDemoMode) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      setServices(previousServices); 
      fetchAllData();
    }
  };

  // --- CRUD Reembolsos ---
  const handleSaveReimbursement = async (reimbursement: Reimbursement) => {
    const oldReimb = reimbursements.find(r => r.id === reimbursement.id);

    setReimbursements(prev => {
        const exists = prev.find(r => r.id === reimbursement.id);
        if (exists) return prev.map(r => r.id === reimbursement.id ? reimbursement : r);
        return [reimbursement, ...prev];
    });

    // Notificação
    if (currentUser?.role !== UserRole.TECHNICIAN && reimbursement.technicianId !== currentUser?.id) {
         if (!oldReimb) {
             notifyTechnician(reimbursement.technicianId, "Despesa Adicionada", `Uma nova despesa (${reimbursement.type}) foi lançada para você.`, reimbursement.id);
         } else {
             // Se mudou o status (ex: PAGO)
             if (oldReimb.status !== reimbursement.status) {
                 notifyTechnician(reimbursement.technicianId, `Status de Reembolso: ${reimbursement.status}`, `Sua despesa de ${reimbursement.description} agora está ${reimbursement.status}.`, reimbursement.id);
             } else {
                 notifyTechnician(reimbursement.technicianId, "Despesa Atualizada", `Os detalhes da despesa de ${reimbursement.description} foram atualizados.`, reimbursement.id);
             }
         }
    }

    if (isDemoMode) return;

    try {
      const dbPayload = mapReimbursementToDB(reimbursement);
      const exists = reimbursements.find(r => r.id === reimbursement.id);
      
      const { error } = exists 
        ? await supabase.from('reimbursements').update(dbPayload).eq('id', reimbursement.id)
        : await supabase.from('reimbursements').insert(dbPayload);

      if (error) throw error;
    } catch (error) { fetchAllData(); }
  };

  const handleDeleteReimbursement = async (id: string) => {
     const reimbToDelete = reimbursements.find(r => r.id === id);
     if (reimbToDelete && currentUser?.role !== UserRole.TECHNICIAN && reimbToDelete.technicianId !== currentUser?.id) {
         notifyTechnician(reimbToDelete.technicianId, "Despesa Removida", `A despesa ${reimbToDelete.description} foi removida.`);
     }

     setReimbursements(prev => prev.filter(r => r.id !== id));
     if (isDemoMode) return;
     try { await supabase.from('reimbursements').delete().eq('id', id); } catch (error) {}
  };

  // --- CRUD Rastreadores (Estoque) ---
  const handleSaveTracker = async (tracker: Tracker) => {
     const oldTracker = trackers.find(t => t.id === tracker.id);

     const previousTrackers = [...trackers];
     setTrackers(prev => {
        const exists = prev.find(t => t.id === tracker.id);
        if (exists) return prev.map(t => t.id === tracker.id ? tracker : t);
        return [tracker, ...prev];
     });

     // Notificação de Estoque
     if (currentUser?.role !== UserRole.TECHNICIAN && tracker.technicianId !== currentUser?.id) {
         if (!oldTracker) {
             notifyTechnician(tracker.technicianId, "Novo Equipamento", `O rastreador ${tracker.model} (IMEI: ${tracker.imei}) foi adicionado ao seu estoque.`, tracker.id);
         } else {
             // Se mudou o técnico dono
             if (oldTracker.technicianId !== tracker.technicianId) {
                 notifyTechnician(tracker.technicianId, "Transferência de Equipamento", `Você recebeu o rastreador ${tracker.model} (IMEI: ${tracker.imei}).`, tracker.id);
             } 
             // Se mudou status (ex: DEVOLVIDO)
             else if (oldTracker.status !== tracker.status) {
                 notifyTechnician(tracker.technicianId, `Status de Equipamento: ${tracker.status}`, `O rastreador IMEI ${tracker.imei} agora consta como ${tracker.status}.`, tracker.id);
             }
         }
     }

     if (isDemoMode) return;
     try {
        const exists = previousTrackers.find(t => t.id === tracker.id);
        const dbPayload = mapTrackerToDB(tracker);
        const { error } = exists 
            ? await supabase.from('trackers').update(dbPayload).eq('id', tracker.id)
            : await supabase.from('trackers').insert(dbPayload);
        if (error) throw error;
     } catch (error) { setTrackers(previousTrackers); }
  };

  const handleDeleteTracker = async (id: string) => {
      const trackerToDelete = trackers.find(t => t.id === id);
      if (trackerToDelete && currentUser?.role !== UserRole.TECHNICIAN && trackerToDelete.technicianId !== currentUser?.id) {
          notifyTechnician(trackerToDelete.technicianId, "Equipamento Removido", `O rastreador IMEI ${trackerToDelete.imei} foi removido do seu estoque.`);
      }

      const previousTrackers = [...trackers];
      setTrackers(prev => prev.filter(t => t.id !== id));
      if (isDemoMode) return;
      try { await supabase.from('trackers').delete().eq('id', id); } catch (error) { setTrackers(previousTrackers); }
  };

  const handleSaveUser = async (user: User) => {
    // Não vamos notificar alterações de usuário por enquanto, para simplificar.
    setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev.map(u => u.id === user.id ? user : u);
        return [...prev, user];
    });
    if (currentUser && currentUser.id === user.id) {
        setCurrentUser(user);
        localStorage.setItem('sc_session', JSON.stringify(user));
    }
    if (isDemoMode) return;
    try {
       const dbPayload = mapUserToDB(user);
       const exists = users.find(u => u.id === user.id);
       exists ? await supabase.from('users').update(dbPayload).eq('id', user.id) : await supabase.from('users').insert(dbPayload);
    } catch(e) {}
  };

  const handleDeleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
  };

  // Filtros de Visualização
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

  const visibleTrackers = useMemo(() => trackers, [trackers]);

  const dashboardServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.TECHNICIAN) return services.filter(s => s.technicianId === currentUser.id);
    if (viewingTechnicianId) return services.filter(s => s.technicianId === viewingTechnicianId);
    return services;
  }, [services, currentUser, viewingTechnicianId]);

  // Contagem de notificações não lidas
  const unreadCount = useMemo(() => {
      return notifications.filter(n => n.recipientId === currentUser?.id && !n.isRead).length;
  }, [notifications, currentUser]);

  // Filtrar notificações do usuário atual para passar ao painel
  const myNotifications = useMemo(() => {
      return notifications.filter(n => n.recipientId === currentUser?.id);
  }, [notifications, currentUser]);


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
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard services={dashboardServices} currentUser={currentUser} users={users} viewingTechnicianId={viewingTechnicianId} onViewTechnician={(id) => { setViewingTechnicianId(id); setActiveTab('services'); }} trackers={trackers} />;
      case 'services':
        return <Services services={visibleServices} currentUser={currentUser} users={users} onSaveService={handleSaveService} onDeleteService={handleDeleteService} viewingTechnicianId={viewingTechnicianId} onClearFilter={() => setViewingTechnicianId(null)} onFilterByTech={(id) => setViewingTechnicianId(id)} trackers={trackers} />;
      case 'trackers':
        return <Trackers trackers={visibleTrackers} currentUser={currentUser} users={users} onSaveTracker={handleSaveTracker} onDeleteTracker={handleDeleteTracker} />;
      case 'reimbursements':
        return <Reimbursements reimbursements={visibleReimbursements} currentUser={currentUser} users={users} onSaveReimbursement={handleSaveReimbursement} onDeleteReimbursement={handleDeleteReimbursement} />;
      case 'users':
        if (currentUser.role !== UserRole.MASTER) return <div className="p-4 md:p-8">Acesso restrito.</div>;
        return <Users users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />;
      case 'profile':
        return <Profile user={currentUser} onUpdateUser={handleSaveUser} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      
      {/* ALERTA DE MODO DEMO */}
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
      
      {/* PAINEL DE NOTIFICAÇÕES (SLIDE OVER) */}
      <NotificationsPanel 
         isOpen={isNotificationsOpen} 
         onClose={() => setIsNotificationsOpen(false)} 
         notifications={myNotifications}
         onMarkAsRead={handleMarkAsRead}
         onMarkAllAsRead={handleMarkAllAsRead}
      />

      {/* HEADER MOBILE */}
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
        <div className="flex items-center space-x-2">
            <button 
               onClick={() => setIsNotificationsOpen(true)}
               className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl relative"
            >
               <Bell size={24} />
               {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
               )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              <Menu size={28} />
            </button>
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* HEADER DESKTOP (Agora inclui o botão de Notificação) */}
          <header className={`hidden md:flex items-center justify-end px-8 py-4 bg-white/50 backdrop-blur-sm z-30 ${isDemoMode ? 'mt-14' : ''}`}>
              <button 
                 onClick={() => setIsNotificationsOpen(true)}
                 className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#00AEEF] hover:shadow-lg transition-all relative group"
                 title="Notificações"
              >
                 <Bell size={20} className="group-hover:scale-110 transition-transform" />
                 {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                    </span>
                 )}
              </button>
          </header>

          <main className={`flex-1 overflow-y-auto pt-20 md:pt-0 transition-all duration-300 relative`}>
            {renderContent()}
          </main>
      </div>
    </div>
  );
};

export default App;
