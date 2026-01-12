import React, { useEffect, useState } from 'react';
import { BellRing, CalendarCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User, UserRole } from '../types';

interface MonthlyReminderProps {
  currentUser: User;
}

const MonthlyReminder: React.FC<MonthlyReminderProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonthName, setCurrentMonthName] = useState('');

  useEffect(() => {
    // Verificar se é Técnico
    if (currentUser.role !== UserRole.TECHNICIAN) return;

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Regra: Aparecer apenas nos primeiros 5 dias do mês
    // Isso garante que se o dia 1 cair num domingo e ele logar na segunda (dia 2), ele ainda verá.
    if (day >= 1 && day <= 5) {
      // Chave única para este mês/ano/usuário
      const storageKey = `monthly_reminder_seen_${month}_${year}_${currentUser.id}`;
      const hasSeen = localStorage.getItem(storageKey);

      if (!hasSeen) {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        setCurrentMonthName(monthNames[month]);
        setIsOpen(true);
      }
    }
  }, [currentUser]);

  const handleClose = () => {
    const now = new Date();
    // Salva no navegador que este usuário já viu o aviso deste mês específico
    const storageKey = `monthly_reminder_seen_${now.getMonth()}_${now.getFullYear()}_${currentUser.id}`;
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A192F]/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-500">
        
        {/* Cabeçalho Chamativo */}
        <div className="bg-[#0A192F] p-8 text-center relative overflow-hidden">
           {/* Efeitos de fundo */}
           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-blue-500/10 rounded-full animate-pulse pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
                <BellRing size={40} className="text-[#FF3D3D] animate-bounce" />
             </div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tight">Atenção, {currentUser.name.split(' ')[0]}!</h2>
             <p className="text-[#00AEEF] text-xs font-black uppercase tracking-[0.2em] mt-2">Fechamento de Mês • {currentMonthName}</p>
           </div>
        </div>

        {/* Corpo da Mensagem */}
        <div className="p-8 text-center space-y-6">
           <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-start space-x-3 text-left">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
              <div>
                 <h3 className="font-black text-slate-800 text-sm uppercase mb-1">Conferência Obrigatória</h3>
                 <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Estamos iniciando um novo mês. Por favor, verifique se <strong>TODOS</strong> os seus serviços do mês anterior foram lançados corretamente no sistema.
                 </p>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center space-x-3 text-slate-600">
                 <CalendarCheck size={20} className="text-[#00AEEF]" />
                 <span className="text-xs font-bold uppercase">Revise as datas e placas</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                 <CheckCircle2 size={20} className="text-[#00AEEF]" />
                 <span className="text-xs font-bold uppercase">Confirme os status (Realizado/Cancelado)</span>
              </div>
           </div>

           <button 
             onClick={handleClose}
             className="w-full py-4 bg-[#0A192F] text-white font-black uppercase text-sm tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#162942] hover:scale-[1.02] transition-all active:scale-95"
           >
             Ok, Vou Conferir!
           </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReminder;