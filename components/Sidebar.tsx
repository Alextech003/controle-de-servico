import React from 'react';
import { LayoutDashboard, ClipboardList, Users, UserCircle, LogOut, X, Receipt } from 'lucide-react';
import { User, UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Serviços', icon: ClipboardList },
    { id: 'reimbursements', label: 'Reembolsos', icon: Receipt },
    { id: 'users', label: 'Usuários', icon: Users, restricted: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <>
      {/* Overlay Escuro para Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0A192F]/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Drawer no Mobile, Fixo no Desktop */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-slate-200 
        flex flex-col h-full print:hidden shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Botão fechar apenas no mobile */}
        <div className="md:hidden absolute top-4 right-4 z-50">
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-rose-600">
             <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <Logo size={64} className="mb-4 shadow-xl shadow-blue-50" />
          <div className="text-center">
              <h1 className="text-xl font-black text-[#0A192F] leading-none tracking-tighter uppercase">
                AIRO<span className="text-red-600">TRACKER</span>
              </h1>
              <div className="flex items-center justify-center -mt-1 mb-2">
                 <span className="text-red-600 text-lg font-black mr-1">+</span>
                 <span className="text-[#0A192F] text-base font-black uppercase">Técnicos</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monitoramento 24H</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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

        <div className="p-4 border-t border-slate-100 bg-white">
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
    </>
  );
};

export default Sidebar;