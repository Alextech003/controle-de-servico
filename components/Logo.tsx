
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
        className="w-full h-full"
      >
        {/* Circuitos / Radar (Azul Claro) */}
        <circle cx="50" cy="50" r="15" stroke="#00AEEF" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="22" stroke="#00AEEF" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Linhas de Conexão */}
        <path d="M35 35L25 35" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="23" cy="35" r="2" fill="#00AEEF" />
        
        <path d="M35 50L20 50" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="50" r="2" fill="#00AEEF" />
        
        <path d="M65 35L75 35" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="77" cy="35" r="2" fill="#00AEEF" />
        
        <path d="M65 50L80 50" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="82" cy="50" r="2" fill="#00AEEF" />

        <path d="M40 25L30 20" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="28" cy="18" r="2" fill="#00AEEF" />

        <path d="M60 25L70 20" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="72" cy="18" r="2" fill="#00AEEF" />

        {/* Pin de Localização (Azul Escuro) */}
        <path 
          d="M50 15C42 15 35 21.7 35 30C35 41.2 50 55 50 55C50 55 65 41.2 65 30C65 21.7 58 15 50 15ZM50 35C47.2 35 45 32.8 45 30C45 27.2 47.2 25 50 25C52.8 25 55 27.2 55 30C55 32.8 52.8 35 50 35Z" 
          fill="#0A192F" 
        />

        {/* Carro (Azul Escuro) */}
        <path 
          d="M62 65H38C35.8 65 34 66.8 34 69V75C34 76.1 34.9 77 36 77H38V80C38 81.1 38.9 82 40 82H42C43.1 82 44 81.1 44 80V77H56V80C56 81.1 56.9 82 58 82H60C61.1 82 62 81.1 62 80V77H64C65.1 77 66 76.1 66 75V69C66 66.8 64.2 65 62 65ZM44 73H38V69H44V73ZM62 73H56V69H62V73Z" 
          fill="#0A192F" 
        />
      </svg>
    </div>
  );
};

export default Logo;
