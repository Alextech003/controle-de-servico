
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full transform hover:scale-105 transition-transform duration-500"
      >
        <defs>
          {/* Sombra para efeito 3D profundo */}
          <filter id="shadow3d" x="-20%" y="-20%" width="150%" height="150%">
            <feOffset dx="3" dy="3" result="offset" />
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="black" floodOpacity="0.5" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente Preto da Identidade */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#333333" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Gradiente Vermelho da Identidade */}
          <linearGradient id="redDetail" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3D3D" />
            <stop offset="100%" stopColor="#B30000" />
          </linearGradient>
        </defs>

        {/* Base da Letra 'A' Tridimensional (Inspirada na imagem) */}
        <g filter="url(#shadow3d)">
          {/* Parte esquerda da extrusão (preto) */}
          <path 
            d="M50 15L20 85H38L50 55L62 85H80L50 15Z" 
            fill="url(#bodyGrad)" 
          />
          
          {/* Detalhe interno/central em Vermelho (Efeito do logo novo) */}
          <path 
            d="M44 65H56L50 50L44 65Z" 
            fill="url(#redDetail)" 
          />
          
          {/* Barra horizontal característica (vermelho tridimensional) */}
          <rect 
            x="40" y="68" 
            width="20" height="6" 
            rx="1" 
            fill="url(#redDetail)" 
          />
        </g>
        
        {/* Brilho de acabamento */}
        <path 
          d="M50 20L25 80" 
          stroke="white" 
          strokeWidth="0.5" 
          strokeOpacity="0.2" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
