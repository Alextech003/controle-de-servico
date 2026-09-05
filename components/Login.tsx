import React, { useState } from 'react';
import { User } from '../types';
import { AlertCircle, Loader2, ArrowRight, User as UserIcon, Lock, Eye, EyeOff, ShieldCheck, Radio } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    }, 700);
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-[#07090D] relative overflow-hidden text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* --- ESTILOS & ANIMAÇÕES CUSTOMIZADAS --- */}
      <style>{`
        /* Animação de rotação 3D suave da Logo */
        @keyframes spin-3d {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          50% {
            transform: perspective(1000px) rotateY(180deg) scale(1.05);
          }
          100% {
            transform: perspective(1000px) rotateY(360deg);
          }
        }

        /* Rotação contínua dos anéis de radar */
        @keyframes rotate-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        /* Pulso vermelho neon */
        @keyframes red-pulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.04);
          }
        }

        /* Feixes de laser / rabiscos correndo pelo fundo metálico */
        @keyframes beam-dash {
          0% {
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .animate-spin-3d {
          animation: spin-3d 9s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .animate-radar-cw {
          animation: rotate-clockwise 14s linear infinite;
        }

        .animate-radar-ccw {
          animation: rotate-counter 22s linear infinite;
        }

        .animate-red-pulse {
          animation: red-pulse 3.5s ease-in-out infinite;
        }

        /* Textura de Metal Escovado */
        .brushed-metal {
          background-color: #080A0F;
          background-image: 
            radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.12) 0%, transparent 45%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(225deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(315deg, rgba(255, 255, 255, 0.02) 25%, #080A0F 25%);
          background-size: 100% 100%, 20px 20px, 20px 20px, 20px 20px, 20px 20px;
        }

        /* Grid tático */
        .tactical-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* --- CAMADA DE FUNDO PRETO METÁLICO COM RABISCOS EM VERMELHO --- */}
      <div className="absolute inset-0 brushed-metal pointer-events-none overflow-hidden">
        
        {/* Grid tático de fundo */}
        <div className="absolute inset-0 tactical-grid opacity-60"></div>

        {/* Efeito Glow Vermelho Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-700/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* RABISCOS E CIRCUITOS VETORIAIS EM VERMELHO NEON (SVG) */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="redLaser" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#DC2626" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0" />
              <stop offset="50%" stopColor="#FF1E1E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity="0" />
            </linearGradient>

            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Rabiscos angulares - Canto Superior Esquerdo */}
          <path 
            d="M -50 140 L 180 140 L 260 220 L 400 220" 
            fill="none" 
            stroke="url(#redLaser)" 
            strokeWidth="1.8" 
            filter="url(#laserGlow)"
            strokeDasharray="12 6"
            className="opacity-70"
          />
          <path 
            d="M 120 -20 L 120 180 L 190 250 L 190 400" 
            fill="none" 
            stroke="url(#redLaser)" 
            strokeWidth="1.2" 
            strokeDasharray="6 8"
            className="opacity-40"
          />

          {/* Rabiscos e ângulos - Canto Inferior Direito */}
          <path 
            d="M 600 800 L 750 650 L 980 650 L 1100 530" 
            fill="none" 
            stroke="url(#redLaser)" 
            strokeWidth="1.8" 
            filter="url(#laserGlow)"
            strokeDasharray="16 6"
            className="opacity-60"
          />
          <path 
            d="M 450 900 L 580 770 L 850 770" 
            fill="none" 
            stroke="#EF4444" 
            strokeWidth="1" 
            strokeDasharray="4 6"
            className="opacity-30"
          />

          {/* Linhas diagonais estilizadas ("Rabiscos táticos de velocidade") */}
          <g filter="url(#laserGlow)" className="opacity-50">
            <line x1="20" y1="350" x2="160" y2="490" stroke="#FF2E2E" strokeWidth="1.5" strokeDasharray="8 4" />
            <line x1="45" y1="350" x2="185" y2="490" stroke="#FF2E2E" strokeWidth="0.8" />
            
            <line x1="90%" y1="120" x2="98%" y2="200" stroke="#FF2E2E" strokeWidth="1.5" strokeDasharray="10 5" />
            <line x1="92%" y1="120" x2="100%" y2="200" stroke="#FF2E2E" strokeWidth="0.8" />
          </g>

          {/* Marcadores de Mira / Pontos Cardeais Tecnológicos */}
          <circle cx="260" cy="220" r="3" fill="#EF4444" />
          <circle cx="750" cy="650" r="3" fill="#EF4444" />
        </svg>

        {/* Linha de feixe horizontal animada sutil */}
        <div className="absolute top-[28%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
        <div className="absolute top-[72%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
      </div>

      {/* --- LADO ESQUERDO: BRANDING DESKTOP (PRETO METÁLICO & LOGO 3D) --- */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 z-10 border-r border-red-500/10">
        <div className="relative flex flex-col items-center text-center max-w-lg">
          
          {/* MOLDURA DO LOGO COM ANÉIS DE RADAR & ROTAÇÃO 3D */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-10">
            
            {/* Brilho pulsante atrás */}
            <div className="absolute inset-4 rounded-full bg-red-600/20 filter blur-2xl animate-red-pulse"></div>

            {/* Anel Exterior de Radar (Sentido Horário) com Rabiscos e Graus */}
            <div className="absolute inset-0 rounded-full border border-red-500/30 border-dashed animate-radar-cw pointer-events-none">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]"></div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]"></div>
            </div>

            {/* Anel Intermediário de Mira (Sentido Anti-horário) */}
            <div className="absolute inset-4 rounded-full border-2 border-red-500/20 border-t-red-500 border-b-cyan-400 animate-radar-ccw pointer-events-none"></div>

            {/* Base Metálica com Efeito Chanfrado */}
            <div className="relative w-44 h-44 rounded-3xl bg-gradient-to-b from-[#1E2638] via-[#0E131D] to-[#080B10] p-[2px] shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.25)] border border-red-500/40">
              <div className="w-full h-full rounded-[22px] bg-[#0A0D14] flex items-center justify-center overflow-hidden relative">
                {/* Linha de reflexo metálico */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                
                {/* LOGO GIRANDO EM 3D */}
                <img 
                  src="/icon.svg" 
                  alt="AiroTracker Logo" 
                  className="w-32 h-32 object-contain animate-spin-3d drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* TÍTULO PRINCIPAL */}
          <h1 className="text-5xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            AIRO<span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">TRACKER</span>
          </h1>

          <div className="flex items-center justify-center mb-6 gap-2">
            <span className="text-red-500 text-3xl font-black">+</span>
            <span className="text-slate-200 text-2xl font-black uppercase tracking-wider">Técnicos</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-[0.25em] mb-12 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Radio size={14} className="animate-pulse text-red-400" />
            Monitoramento 24H
          </div>

          {/* CARDS DE STATUS TÁTICO */}
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="bg-[#0F141E]/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center hover:border-red-500/40 transition-colors shadow-lg">
              <span className="text-2xl font-black text-white mb-0.5">100%</span>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Operacional</span>
            </div>
            <div className="bg-[#0F141E]/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center hover:border-red-500/40 transition-colors shadow-lg">
              <span className="text-lg font-black text-white mb-0.5 uppercase">GPS</span>
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Sincronizado</span>
            </div>
            <div className="bg-[#0F141E]/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center hover:border-red-500/40 transition-colors shadow-lg">
              <span className="text-2xl font-black text-white mb-0.5">BI</span>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Inteligência</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- LADO DIREITO & VERSÃO MOBILE: FORMULÁRIO PRETO METÁLICO COM LOGO GIRATÓRIA --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 lg:p-16 relative z-10">
        
        {/* CONTAINER DO CARD METÁLICO */}
        <div className="max-w-md w-full bg-[#0B0F17]/90 backdrop-blur-xl border border-red-500/20 rounded-3xl p-7 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(239,68,68,0.12)] relative overflow-hidden">
          
          {/* Cantoneiras táticas em vermelho nos 4 cantos do card */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500 pointer-events-none"></div>

          {/* Linha sutil de topo com brilho em vermelho */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

          {/* --- CABEÇALHO MOBILE COM A LOGO GIRANDO --- */}
          <div className="flex flex-col items-center text-center mb-8">
            
            {/* CONTAINER DA LOGO GIRATÓRIA (VISÍVEL NO MOBILE & REFORÇADA NO FORMULÁRIO) */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              
              {/* Brilho pulsante */}
              <div className="absolute inset-1 rounded-full bg-red-600/25 filter blur-lg animate-red-pulse"></div>

              {/* Anel Externo Girando em Sentido Horário */}
              <div className="absolute inset-0 rounded-full border border-red-500/40 border-dashed animate-radar-cw pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_#EF4444]"></div>
              </div>

              {/* Anel Interno em Sentido Anti-Horário */}
              <div className="absolute inset-2 rounded-full border-2 border-red-500/20 border-t-red-500 border-r-cyan-400 animate-radar-ccw pointer-events-none"></div>

              {/* Base Metálica da Logo */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1C2331] via-[#0E121B] to-[#07090E] p-[1.5px] shadow-[0_8px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(239,68,68,0.3)] border border-red-500/50 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-[#080B11] flex items-center justify-center overflow-hidden">
                  
                  {/* A LOGO GIRANDO EM 3D */}
                  <img 
                    src="/icon.svg" 
                    alt="AiroTracker Logo" 
                    className="w-14 h-14 object-contain animate-spin-3d drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Identidade do Aplicativo */}
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                AIRO<span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">TRACKER</span>
              </h2>
              <span className="text-red-500 text-xl font-black">+</span>
              <span className="text-slate-300 text-lg font-black uppercase">Técnicos</span>
            </div>

            <p className="text-slate-400 text-xs font-semibold tracking-wide">
              Acesso restrito à plataforma operacional
            </p>
          </div>

          {/* --- FORMULÁRIO DE LOGIN --- */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-in shake">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <span className="font-bold text-xs leading-relaxed">{error}</span>
              </div>
            )}

            {/* Campo Usuário / Identificador */}
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2 ml-1 flex items-center justify-between">
                <span>Usuário / Telefone</span>
                <span className="text-[10px] text-red-400 font-bold tracking-normal">ID ou Celular</span>
              </label>
              
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <UserIcon size={18} />
                </div>

                <input 
                  type="text" 
                  required
                  placeholder="Ex: ADM ou 21999999999"
                  className="w-full pl-11 pr-4 py-4 bg-[#111622] border-2 border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-2xl outline-none transition-all font-bold text-white placeholder:text-slate-500 placeholder:font-normal text-sm shadow-inner focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2 ml-1 flex items-center justify-between">
                <span>Senha de Acesso</span>
                <span className="text-[10px] text-slate-500 font-medium">Protegido</span>
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>

                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-4 bg-[#111622] border-2 border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-2xl outline-none transition-all font-bold text-white placeholder:text-slate-500 text-sm shadow-inner focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar Estilo Metálico Vermelho */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 py-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl shadow-[0_8px_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 group border border-red-400/30 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">Conectando ao Terminal...</span>
                </>
              ) : (
                <>
                  <span className="font-black uppercase tracking-widest text-xs drop-shadow-md">Acessar Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform drop-shadow-md" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
              <ShieldCheck size={15} className="text-red-400 shrink-0" />
              <span>Conexão Criptografada SSL 256-bit</span>
            </div>
            
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              v1.0.1
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
