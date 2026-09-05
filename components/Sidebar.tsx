
import React from 'react';
import { LayoutDashboard, ClipboardList, Users, UserCircle, LogOut, X, Receipt, Radio, Shield, Zap } from 'lucide-react';
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
    { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard },
    { id: 'services', label: 'Serviços', icon: ClipboardList },
    { id: 'trackers', label: 'Rastreadores', icon: Radio },
    { id: 'reimbursements', label: 'Reembolsos', icon: Receipt },
    { id: 'users', label: 'Usuários', icon: Users, restricted: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'profile', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <>
      {/* Overlay Escuro para Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Tema Preto Metálico com Feixe Vermelho Neon (Estilo Login) */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-60 bg-[#080B10] border-r border-red-500/20 
        flex flex-col h-full print:hidden shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:shadow-none
        transform transition-transform duration-300 ease-in-out overflow-hidden select-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Linha vertical de feixe laser vermelho na borda direita */}
        <div className="absolute top-0 right-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-red-500/40 to-transparent pointer-events-none"></div>

        {/* Botão fechar apenas no mobile */}
        <div className="md:hidden absolute top-4 right-4 z-50">
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-[#121824] border border-red-500/30 rounded-xl text-slate-400 hover:text-red-400 active:scale-90 transition-all cursor-pointer"
          >
             <X size={20} />
          </button>
        </div>

        {/* FOTO DO USUÁRIO LOGADO (SUBSTITUINDO O LOGO ESCURO) */}
        <div className="p-5 flex flex-col items-center relative">
          
          {/* Brilho vermelho suave atrás da foto */}
          <div className="absolute top-5 w-24 h-24 bg-red-600/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Moldura Tática com a Foto do Usuário Logado */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            title="Clique para gerenciar foto e perfil"
            className="relative mb-2.5 group cursor-pointer active:scale-95 transition-all outline-none"
          >
            {/* Anel Chanfrado Neon Metálico */}
            <div className="w-20 h-20 rounded-2xl p-[2px] bg-gradient-to-b from-red-500 via-[#1C2638] to-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] transition-all">
              <div className="w-full h-full rounded-[14px] bg-[#0A0D15] overflow-hidden flex items-center justify-center relative">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-[#1A2336] via-[#0E1522] to-[#070A10] flex flex-col items-center justify-center text-white relative">
                    <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_8px_rgba(0,174,239,0.8)]">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 group-hover:text-cyan-400 transition-colors">
                      Foto de Perfil
                    </span>
                  </div>
                )}

                {/* Overlay hover para indicar clique para perfil */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <UserCircle size={22} className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </div>

            {/* Ponto Verde de Status Online */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#080B10] shadow-[0_0_8px_#10B981]"></span>
            </span>
          </button>

          {/* Nome e Cargo do Usuário Logado */}
          <div className="text-center w-full px-2">
              <h2 className="text-sm font-black text-white leading-snug tracking-tight uppercase truncate" title={currentUser.name}>
                {currentUser.name}
              </h2>
              <div className="flex items-center justify-center space-x-1.5 mt-0.5">
                 <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                   {currentUser.role}
                 </span>
              </div>
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 mt-1.5 rounded-full bg-[#111724] border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.18em]">SISTEMA 24H</p>
              </div>
          </div>
        </div>

        {/* MENU DE NAVEGAÇÃO ESTILO COCKPIT */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            if (item.restricted && item.restricted.includes(currentUser.role)) return null;
            
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-left relative group cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600/30 via-[#182030] to-[#0F1420] text-white font-black border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {/* Feixe ativo no lado esquerdo */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-red-500 rounded-r-full shadow-[0_0_8px_#EF4444]"></span>
                )}

                <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-red-500/20 text-red-400' : 'text-slate-400 group-hover:text-cyan-400 group-hover:scale-105'}`}>
                  <Icon size={17} />
                </div>
                <span className="text-xs md:text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* IDENTIFICAÇÃO DO USUÁRIO & LOGOUT METÁLICO */}
        <div className="p-3 border-t border-red-500/20 bg-[#06080C]/90">
          <div className="px-3 py-2.5 bg-[#0D121B] rounded-xl mb-2 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Operador</p>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs font-black text-white truncate mt-0.5">{currentUser.name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                 <Shield size={10} className="text-red-400" />
                 <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
              </div>
          </div>
          
          <button 
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <LogOut size={14} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
