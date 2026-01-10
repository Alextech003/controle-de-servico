
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { UserPlus, Phone, Lock, User as UserIcon, Trash2, Edit, X, Save, Camera, AlertTriangle, UserMinus, UserCheck, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface UsersProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const Users: React.FC<UsersProps> = ({ users, onUpdateUsers }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<User>>({
    role: UserRole.TECHNICIAN,
    isActive: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

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

  const handleSave = () => {
    if (!formData.name || !formData.phone || (!editingUser && !formData.password)) {
      alert("Preencha todos os campos obrigatórios (Nome, Telefone e Senha).");
      return;
    }

    let updatedList: User[];

    // Fixed: Removed erroneous 'if (editingService)' block which was an artifact from copy-pasting
    if (editingUser) {
      updatedList = users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u);
    } else {
      const newUser: User = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as User;
      updatedList = [...users, newUser];
    }
    
    onUpdateUsers(updatedList);
    setShowForm(false);
    setEditingUser(null);
    setFormData({ role: UserRole.TECHNICIAN, isActive: true });
  };

  const handleToggleStatus = (user: User) => {
    // Proteger Alex Master de ser suspenso também
    if (user.id === '1' || user.name === 'Alex Master') {
       alert("Este usuário é vitalício e não pode ser suspenso.");
       return;
    }
    const updatedList = users.map(u => 
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    );
    onUpdateUsers(updatedList);
  };

  const executeDelete = () => {
    if (confirmDeleteId) {
      // Proteção extra no executeDelete
      const userToDelete = users.find(u => u.id === confirmDeleteId);
      if (userToDelete?.id === '1' || userToDelete?.name === 'Alex Master') {
         alert("Usuário vitalício não pode ser excluído.");
         setConfirmDeleteId(null);
         return;
      }
      onUpdateUsers(users.filter(u => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 font-medium">Controle total de acessos e senhas da equipe</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({ role: UserRole.TECHNICIAN, isActive: true }); setShowForm(true); }}
          className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          <span>Novo Colaborador</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((user) => {
          const isVitalicio = user.id === '1' || user.name === 'Alex Master';
          
          return (
            <div key={user.id} className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 ${!user.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="p-5 flex justify-between items-center bg-slate-50/50">
                 <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${user.role === UserRole.MASTER ? 'bg-indigo-100 text-indigo-700' : user.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isVitalicio && <ShieldCheck size={12} className="text-blue-600" />}
                  <span>{user.role} {!user.isActive && '(CONTA SUSPENSA)'}</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleToggleStatus(user)} 
                    disabled={isVitalicio}
                    className={`p-2.5 border rounded-xl shadow-sm transition-all ${isVitalicio ? 'opacity-30 cursor-not-allowed' : (user.isActive ? 'text-amber-600 bg-white border-slate-100 hover:bg-amber-50' : 'text-emerald-600 bg-white border-slate-100 hover:bg-emerald-50')}`} 
                    title={isVitalicio ? "Protegido" : (user.isActive ? "Suspender" : "Ativar")}
                  >
                    {user.isActive ? <UserMinus size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button onClick={() => { setEditingUser(user); setFormData(user); setShowForm(true); }} className="p-2.5 text-blue-600 bg-white border border-slate-100 hover:bg-blue-50 rounded-xl shadow-sm transition-all" title="Editar">
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(user.id)} 
                    disabled={isVitalicio}
                    className={`p-2.5 border rounded-xl shadow-sm transition-all ${isVitalicio ? 'opacity-30 cursor-not-allowed' : 'text-rose-600 bg-white border-slate-100 hover:bg-rose-50'}`} 
                    title={isVitalicio ? "Impossível Excluir" : "Excluir"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-8 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className={`w-28 h-28 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-all duration-500`}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={48} className="text-slate-300" />
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${user.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight uppercase tracking-tight">{user.name}</h3>
                
                <div className="w-full bg-slate-50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-slate-500">
                    <Phone size={14} className="text-blue-500" />
                    <span className="text-sm font-bold">{user.phone}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-slate-200 pt-3">
                    <div className="flex items-center space-x-2">
                      <Lock size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</span>
                    </div>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-sm font-black text-slate-900 tracking-[0.2em]">{visiblePasswords[user.id] ? user.password : '••••••••'}</span>
                      <button onClick={() => togglePasswordVisibility(user.id)} className="p-1 text-slate-300 hover:text-blue-600 transition-colors">
                        {visiblePasswords[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingUser ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
              <button onClick={() => setShowForm(false)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <div className="w-36 h-36 rounded-[2rem] bg-white border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500 group-hover:bg-blue-50">
                     {formData.avatar ? (
                       <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <div className="text-center p-6">
                         <Camera size={40} className="text-slate-300 mx-auto mb-2" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolher Foto</span>
                       </div>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo *</label>
                  <input type="text" placeholder="Nome do Técnico" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone / Login *</label>
                  <input type="tel" placeholder="(00) 00000-0000" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha de Acesso *</label>
                  <input type="text" placeholder="Senha do usuário" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nível de Permissão *</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-black text-slate-900" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.TECHNICIAN}>Técnico (Individual)</option>
                  <option value={UserRole.ADMIN}>Administração (Visualização)</option>
                  <option value={UserRole.MASTER}>Master (Gestão Total)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button onClick={() => setShowForm(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-12 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center space-x-3 active:scale-95">
                  <Save size={20} />
                  <span>Finalizar Cadastro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Excluir Usuário?</h3>
                <p className="text-slate-500 text-sm mb-8">Esta ação removerá o colaborador permanentemente do sistema.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setConfirmDeleteId(null)} className="py-4 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl">Cancelar</button>
                    <button onClick={executeDelete} className="py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-red-200">Excluir</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
