import React, { useState } from 'react';
import { User } from '../types';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulação de delay para feedback visual
    setTimeout(() => {
      const cleanLogin = login.trim().toLowerCase();
      const cleanPassword = password.trim();

      const user = users.find(u => {
        const uName = u.name.toLowerCase().trim();
        const uPhone = u.phone.trim();
        return (uName === cleanLogin || uPhone === cleanLogin) && u.password === cleanPassword;
      });

      if (user) {
        if (!user.isActive) {
          setError('Acesso suspenso. Contate o administrador.');
          setIsLoading(false);
          return;
        }
        onLogin(user);
      } else {
        setError('Credenciais inválidas. Verifique seus dados.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">
      
      {/* LADO ESQUERDO - BRANDING (Escuro) */}
      <div className="hidden lg:flex w-1/2 bg-[#0A192F] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Efeitos de Fundo */}
        <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#00AEEF]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <div className="bg-white rounded-[2.5rem] w-48 h-48 flex items-center justify-center shadow-2xl mb-10 animate-in zoom-in duration-700">
             <Logo size={120} />
          </div>
          
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 leading-none">
            AIRO<span className="text-red-600">TRACKER</span>
          </h1>
          <div className="flex items-center justify-center mb-8 gap-2">
             <span className="text-red-600 text-4xl font-black">+</span>
             <span className="text-white text-3xl font-black uppercase">Técnicos</span>
          </div>
          
          <p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em] mb-16">
            Monitoramento 24H
          </p>

          <div className="grid grid-cols-3 gap-6 w-full">
             <div className="bg-[#112240] border border-slate-700/50 p-6 rounded-3xl flex flex-col items-center justify-center group hover:bg-[#1A2F55] transition-colors">
                <span className="text-3xl font-black text-white mb-1">100%</span>
                <span className="text-[8px] font-black text-[#00AEEF] uppercase tracking-widest">Operacional</span>
             </div>
             <div className="bg-[#112240] border border-slate-700/50 p-6 rounded-3xl flex flex-col items-center justify-center group hover:bg-[#1A2F55] transition-colors">
                <span className="text-xl font-black text-white mb-1 uppercase">Cloud</span>
                <span className="text-[8px] font-black text-[#00AEEF] uppercase tracking-widest">Sincronizado</span>
             </div>
             <div className="bg-[#112240] border border-slate-700/50 p-6 rounded-3xl flex flex-col items-center justify-center group hover:bg-[#1A2F55] transition-colors">
                <span className="text-3xl font-black text-white mb-1">BI</span>
                <span className="text-[8px] font-black text-[#00AEEF] uppercase tracking-widest">Inteligência</span>
             </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO - FORMULÁRIO (Branco) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-8 duration-700">
          
          <div className="mb-12">
            <h2 className="text-4xl font-black text-[#0A192F] mb-3">Login</h2>
            <p className="text-slate-500 font-medium text-lg">Bem-vindo à plataforma AIROTRACKER.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-center gap-3 text-rose-700 animate-in shake">
                <AlertCircle size={20} />
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Usuário / ID</label>
              <input 
                type="text" 
                required
                placeholder="Seu identificador"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#0A192F] transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Senha Segura</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#0A192F] transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-[#0A192F] hover:bg-[#162942] text-white rounded-2xl shadow-xl shadow-[#0A192F]/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">Autenticando...</span>
                </>
              ) : (
                <>
                  <span className="font-black uppercase tracking-widest text-xs">Entrar no Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 text-center lg:text-left border-t border-slate-100 pt-8">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              © 2024 AIROTRACKER | Monitoramento 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;