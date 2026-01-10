
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Shield, Phone, Save, Lock, Camera } from 'lucide-react';
import Logo from './Logo';

interface ProfileProps {
  user: User;
  onUpdateUser: (userData: User) => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
      name: user.name,
      phone: user.phone,
      password: '',
      avatar: user.avatar
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
      const updatedUser = { ...user, ...formData };
      if (!formData.password) {
        // Se a senha estiver vazia, restaura a original (para não sobrescrever com string vazia)
        updatedUser.password = user.password;
      }
      await onUpdateUser(updatedUser);
      alert("Perfil atualizado com sucesso!");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Logo size={40} />
          </div>
          <div>
              <h1 className="text-3xl font-black text-[#0A192F] tracking-tight">Meu Perfil</h1>
              <p className="text-slate-500 font-medium">Configurações da sua conta AIRO-TECH</p>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 bg-[#0A192F] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00AEEF]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 relative z-10">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-md border border-white/20 overflow-hidden shadow-2xl transition-all group-hover:scale-105">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-white/40 font-black text-4xl">{user.name.charAt(0)}</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={32} className="text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight uppercase">{user.name}</h2>
                    <div className="flex items-center justify-center md:justify-start space-x-2 mt-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#00AEEF] text-white shadow-lg`}>
                            {user.role}
                        </span>
                        <div className="flex items-center space-x-2 text-slate-400 ml-2">
                            <Shield size={14} className="text-[#00AEEF]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Acesso Verificado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nome de Exibição</label>
                    <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0A192F] transition-all font-bold text-slate-800"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Telefone / Login</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00AEEF]" size={18} />
                        <input 
                            type="tel" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0A192F] transition-all font-bold text-slate-800"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center tracking-tight uppercase">
                    <Lock size={20} className="mr-3 text-[#00AEEF]" /> Segurança da Conta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nova Senha</label>
                        <input 
                            type="password" 
                            placeholder="Deixe em branco para manter a atual"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0A192F] transition-all font-bold text-slate-800"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-10 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="px-12 py-5 bg-[#0A192F] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-[#162942] transition-all flex items-center space-x-3 active:scale-95"
                >
                    <Save size={20} />
                    <span>Salvar Alterações</span>
                </button>
            </div>
        </div>
      </div>
      
      <div className="bg-[#0A192F] p-10 rounded-[2.5rem] border border-slate-800 flex items-start space-x-6 text-white relative overflow-hidden shadow-2xl shadow-blue-900/10">
          <div className="absolute top-0 right-0 p-10 opacity-10">
             <Logo size={180} />
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10 border border-white/5">
            <Shield className="text-[#00AEEF]" size={24} />
          </div>
          <div className="relative z-10">
              <p className="text-lg font-black tracking-tight uppercase">AIRO-TECH Operational Security</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                  Seu login nível <strong>{user.role}</strong> concede acesso às ferramentas críticas de monitoramento. 
                  Sempre mantenha sua senha atualizada e evite compartilhamentos de conta.
              </p>
          </div>
      </div>
    </div>
  );
};

export default Profile;
