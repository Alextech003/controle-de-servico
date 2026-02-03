
import React from 'react';
import { AppNotification } from '../types';
import { X, Bell, CheckCheck, Clock } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
  isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead 
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-[#0A192F]/50 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#00AEEF]/10 rounded-xl text-[#00AEEF]">
                 <Bell size={20} />
              </div>
              <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">Notificações</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Histórico de Alterações</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
           {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Bell size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhuma mensagem</p>
              </div>
           ) : (
              notifications.map(notif => (
                 <div 
                    key={notif.id} 
                    className={`p-4 rounded-2xl border transition-all relative group ${notif.isRead ? 'bg-white border-slate-100 opacity-70' : 'bg-white border-blue-100 shadow-lg shadow-blue-50'}`}
                    onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
                 >
                    {!notif.isRead && (
                       <div className="absolute top-4 right-4 w-2 h-2 bg-[#00AEEF] rounded-full animate-pulse"></div>
                    )}
                    
                    <div className="mb-2 pr-4">
                        <h4 className={`text-xs font-black uppercase ${notif.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                            {notif.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[9px] text-slate-400">•</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                Por: <span className="text-[#00AEEF]">{notif.authorName}</span>
                            </span>
                        </div>
                    </div>
                    
                    <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {notif.message}
                    </p>
                 </div>
              ))
           )}
        </div>

        {/* Footer */}
        {notifications.some(n => !n.isRead) && (
            <div className="p-4 border-t border-slate-100 bg-white">
                <button 
                    onClick={onMarkAllAsRead}
                    className="w-full py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
                >
                    <CheckCheck size={16} />
                    <span>Marcar todas como lidas</span>
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPanel;
