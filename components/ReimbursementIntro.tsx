
import React, { useEffect, useState } from 'react';
import { Receipt, Camera, CheckCircle2, X } from 'lucide-react';

const ReimbursementIntro: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já visualizou o tutorial da nova aba
    const hasSeen = localStorage.getItem('has_seen_reimbursement_intro_v1');
    if (!hasSeen) {
      // Pequeno delay para animação de entrada ficar suave após o login
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Marca como visto permanentemente
    localStorage.setItem('has_seen_reimbursement_intro_v1', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0A192F]/90 backdrop-blur-md p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-500">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-20 transition-all"
        >
          <X size={20} />
        </button>

        {/* Header Visual */}
        <div className="bg-[#0A192F] pt-10 pb-8 px-8 text-center relative overflow-hidden">
           {/* Elementos decorativos de fundo */}
           <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#00AEEF] rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
           </div>
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="flex -space-x-4 mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 z-10 border-4 border-[#0A192F]">
                    <Receipt size={32} className="text-[#00AEEF]" />
                </div>
                <div className="w-16 h-16 bg-[#00AEEF] rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 z-20 border-4 border-[#0A192F]">
                    <Camera size={32} className="text-white" />
                </div>
             </div>
             
             <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">Novidade no Sistema!</h2>
             <span className="bg-white/10 text-[#00AEEF] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                Módulo Financeiro
             </span>
           </div>
        </div>

        {/* Conteúdo */}
        <div className="p-8 space-y-6">
           <div className="text-center">
             <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Aba de Reembolsos</h3>
             <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Chega de perder comprovantes! Agora você pode lançar suas despesas operacionais diretamente pelo App.
             </p>
           </div>

           <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-start space-x-3">
                 <div className="mt-0.5 min-w-[20px]"><CheckCircle2 size={20} className="text-emerald-500" /></div>
                 <div>
                    <p className="text-xs font-black text-slate-700 uppercase mb-0.5">Tipos de Gastos</p>
                    <p className="text-xs text-slate-500">Registre Combustível, Pedágio, Estacionamento, Alimentação e Materiais.</p>
                 </div>
              </div>
              
              <div className="h-px bg-slate-200 w-full"></div>

              <div className="flex items-start space-x-3">
                 <div className="mt-0.5 min-w-[20px]"><Camera size={20} className="text-[#00AEEF]" /></div>
                 <div>
                    <p className="text-xs font-black text-slate-700 uppercase mb-0.5">Foto Obrigatória</p>
                    <p className="text-xs text-slate-500">Tire uma foto do recibo/comprovante na hora do lançamento para garantir seu reembolso.</p>
                 </div>
              </div>
           </div>

           <button 
             onClick={handleClose}
             className="w-full py-4 bg-[#0A192F] text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#162942] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center space-x-2"
           >
             <span>Entendi, Vamos Começar!</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementIntro;
