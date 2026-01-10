
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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

    setTimeout(() => {
      const user = users.find(u => 
        (u.name.toLowerCase() === login.toLowerCase() || u.phone === login) && 
        u.password === password
      );

      if (user) {
        if (!user.isActive) {
          setError('Sua conta está suspensa. Entre em contato com a administração.');
          setIsLoading(false);
          return;
        }
        onLogin(user);
      } else {
        setError('Acesso negado. Verifique suas credenciais.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Lado Esquerdo - Branding Azul */}
      <div className="hidden lg:flex lg:w-3/5 bg-[#0A192F] items-center justify-center p-12 relative overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00AEEF]/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -ml-64 -mb-64"></div>
        
        <div className="relative z-10 text-center space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="flex flex-col items-center">
            <div className="p-6 rounded-[3rem] bg-white shadow-2xl shadow-blue-900/40 mb-8 transform hover:scale-105 transition-transform duration-500">
               <Logo size={140} />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase">
                AIRO-<span className="text-[#00AEEF]">TECH</span>
            </h1>
            <div className="h-1.5 w-24 bg-[#00AEEF] mt-4 rounded-full"></div>
            <p className="text-slate-400 mt-8 max-w-md text-xl font-medium leading-relaxed">
                Gestão inteligente e monitoramento em tempo real para frotas e serviços técnicos.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 pt-10">
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-[10px] text-[#00AEEF] uppercase tracking-[0.2em] font-black mt-1">Operacional</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">Cloud</p>
                <p className="text-[10px] text-[#00AEEF] uppercase tracking-[0.2em] font-black mt-1">Sincronizado</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">BI</p>
                <p className="text-[10px] text-[#00AEEF] uppercase tracking-[0.2em] font-black mt-1">Inteligência</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-sm space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <Logo size={56} className="lg:hidden mx-auto mb-6" />
            <h2 className="text-4xl font-black text-[#0A192F] tracking-tight">Login</h2>
            <p className="text-slate-500 font-medium">Bem-vindo à plataforma AIRO-TECH.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-sm animate-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Usuário / ID</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00AEEF] transition-colors" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Seu identificador"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#0A192F] transition-all text-slate-900 font-black placeholder:text-slate-300"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Senha Segura</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00AEEF] transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#0A192F] transition-all text-slate-900 font-black placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-[#0A192F] hover:bg-[#162942] text-white font-black rounded-2xl shadow-2xl shadow-blue-100 transition-all flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-70 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="uppercase tracking-widest text-xs">Acessando...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-widest text-xs">Entrar no Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-[#00AEEF]" />
                </>
              )}
            </button>
          </form>

          <div className="pt-10 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
              &copy; 2024 AIRO-TECH | MONITORAMENTO 24H
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
