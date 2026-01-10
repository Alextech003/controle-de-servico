
import React from 'react';
import { LayoutDashboard, ClipboardList, Users, UserCircle, LogOut } from 'lucide-react';
import { User, UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Serviços', icon: ClipboardList },
    { id: 'users', label: 'Usuários', icon: Users, restricted: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full print:hidden">
      <div className="p-8 flex flex-col items-center">
        <Logo size={64} className="mb-4 shadow-xl shadow-blue-50" />
        <div className="text-center">
            <h1 className="text-xl font-black text-[#0A192F] leading-none tracking-tighter uppercase">AIRO-TECH</h1>
            <p className="text-[9px] font-bold text-[#00AEEF] uppercase tracking-[0.2em] mt-1">Monitoramento</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          if (item.restricted && item.restricted.includes(currentUser.role)) return null;
          
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-[#0A192F] text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#00AEEF]' : ''} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="px-4 py-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Identificação</p>
            <p className="text-sm font-black text-slate-800 truncate mt-1">{currentUser.name}</p>
            <div className="flex items-center space-x-2 mt-1">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</p>
            </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={18} />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
