
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Service, ServiceStatus } from './types';
import { MOCK_USERS, MOCK_SERVICES } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Users from './components/Users';
import Profile from './components/Profile';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'users' | 'profile'>('dashboard');
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [viewingTechnicianId, setViewingTechnicianId] = useState<string | null>(null);

  useEffect(() => {
    const savedServices = localStorage.getItem('sc_services');
    if (savedServices) setServices(JSON.parse(savedServices));
    const savedUsers = localStorage.getItem('sc_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    const savedSession = localStorage.getItem('sc_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

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

  const handleUpdateServices = (newServices: Service[]) => {
    setServices(newServices);
    localStorage.setItem('sc_services', JSON.stringify(newServices));
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('sc_users', JSON.stringify(newUsers));
  };

  const handleProfileUpdate = (userData: Partial<User>) => {
    if (!currentUser) return;
    const dataToUpdate = { ...userData };
    if (!dataToUpdate.password) delete dataToUpdate.password;
    const updatedUser = { ...currentUser, ...dataToUpdate };
    setCurrentUser(updatedUser);
    localStorage.setItem('sc_session', JSON.stringify(updatedUser));
    const updatedUsersList = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsersList);
    localStorage.setItem('sc_users', JSON.stringify(updatedUsersList));
  };

  // Serviços visíveis na aba de Serviços (Técnico vê só o dele, Admin vê tudo ou filtro)
  const visibleServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.MASTER || currentUser.role === UserRole.ADMIN) {
        if (viewingTechnicianId) return services.filter(s => s.technicianId === viewingTechnicianId);
        return services;
    }
    return services.filter(s => s.technicianId === currentUser.id);
  }, [services, currentUser, viewingTechnicianId]);

  // Serviços visíveis no Dashboard (Técnico vê resumo próprio, Admin vê resumo geral)
  const dashboardServices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.TECHNICIAN) {
      return services.filter(s => s.technicianId === currentUser.id);
    }
    // Para Master/Admin, se estiver visualizando um técnico específico via sidebar, o dashboard reflete ele
    if (viewingTechnicianId) {
      return services.filter(s => s.technicianId === viewingTechnicianId);
    }
    return services;
  }, [services, currentUser, viewingTechnicianId]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderContent = () => {
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
            allServices={services}
            currentUser={currentUser} 
            users={users}
            onUpdateServices={handleUpdateServices}
            viewingTechnicianId={viewingTechnicianId}
            onClearFilter={() => setViewingTechnicianId(null)}
            onFilterByTech={(id) => setViewingTechnicianId(id)}
          />
        );
      case 'users':
        if (currentUser.role !== UserRole.MASTER) return <div className="p-8">Acesso restrito.</div>;
        return <Users users={users} onUpdateUsers={handleUpdateUsers} />;
      case 'profile':
        return <Profile user={currentUser} onUpdateUser={handleProfileUpdate} />;
      default:
        return <Dashboard services={dashboardServices} currentUser={currentUser} users={users} viewingTechnicianId={viewingTechnicianId} onViewTechnician={(id) => setViewingTechnicianId(id)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
