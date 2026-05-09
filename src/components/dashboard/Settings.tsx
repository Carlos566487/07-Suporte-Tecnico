import React, { useState, useEffect } from 'react';
import { supabase, Category, Status, SystemConfig, User } from '../../lib/supabase';

type Tab = 'profile' | 'security' | 'users' | 'tickets' | 'system' | 'categories' | 'status' | 'help';

export function Settings({ currentUser }: { currentUser: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // General Loading
  const [isLoading, setIsLoading] = useState(true);

  // Profile state
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', avatar_initials: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Security state
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');

  // System state
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [systemForm, setSystemForm] = useState({ title: '', subtitle: '' });
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Help Config state
  const [helpForm, setHelpForm] = useState({ help_text: '', help_email: '', help_site: '', help_phone: '' });
  const [isSavingHelp, setIsSavingHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');

  // Categories / Statuses state
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [newItemName, setNewItemName] = useState('');

  // Users Management state
  const [users, setUsers] = useState<User[]>([]);
  const [userForm, setUserForm] = useState({ id: '', username: '', password: '', name: '', role: 'Cliente', email: '', phone: '', avatar_initials: '' });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userMessage, setUserMessage] = useState('');

  // Bulk Delete Tickets state
  const [bulkDeleteForm, setBulkDeleteForm] = useState({ username: '', password: '' });
  const [isDeletingTickets, setIsDeletingTickets] = useState(false);
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [sysRes, catRes, statRes, usersRes] = await Promise.all([
      supabase.from('system_config').select('*').single(),
      supabase.from('categories').select('*').order('name'),
      supabase.from('statuses').select('*').order('name'),
      currentUser.role === 'Administrador' ? supabase.from('users').select('*').order('name') : Promise.resolve({ data: [] })
    ]);

    // Setup Profile Form from currentUser prop directly
    setProfileForm({
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      avatar_initials: currentUser.avatar_initials || '',
    });
    setAvatarPreview(currentUser.avatar_url || null);

    if (sysRes.data) {
      setSystemConfig(sysRes.data);
      setLogoPreview(sysRes.data.logo_url || null);
      setSystemForm({ title: sysRes.data.title, subtitle: sysRes.data.subtitle });
      setHelpForm({ 
        help_text: sysRes.data.help_text || '',
        help_email: sysRes.data.help_email || '',
        help_site: sysRes.data.help_site || '',
        help_phone: sysRes.data.help_phone || ''
      });
    }
    if (catRes.data) setCategories(catRes.data);
    if (statRes.data) setStatuses(statRes.data);
    if (usersRes.data) setUsers(usersRes.data as User[]);

    setIsLoading(false);
  };

  // ------------------------------------------------------------------
  // PROFILE LOGIC
  // ------------------------------------------------------------------
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setIsUploadingAvatar(true);
    setProfileMessage('');

    const ext = file.name.split('.').pop();
    const fileName = `user-${currentUser.id}-avatar.${ext}`;

    await supabase.storage.from('avatars').remove([fileName]);
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setProfileMessage('Erro ao enviar foto: ' + uploadError.message);
      setIsUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', currentUser.id);

    setAvatarPreview(publicUrl);
    setIsUploadingAvatar(false);
    setProfileMessage('Foto atualizada com sucesso! Recarregue a página se necessário.');
    
    // Quick hack to force a reload since currentUser is high up in App.tsx
    // In a real app we'd dispatch context
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');

    const { error } = await supabase.from('users').update({
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      avatar_initials: profileForm.avatar_initials.toUpperCase().slice(0, 2),
    }).eq('id', currentUser.id);

    setIsSavingProfile(false);
    if (error) {
      setProfileMessage('Erro ao salvar: ' + error.message);
    } else {
      setProfileMessage('Perfil atualizado com sucesso! Recarregando...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // ------------------------------------------------------------------
  // SECURITY LOGIC
  // ------------------------------------------------------------------
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage('');

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage('Erro: As novas senhas não conferem.');
      return;
    }

    setIsSavingSecurity(true);
    // Verify current password manually
    const { data: userData } = await supabase.from('users').select('password').eq('id', currentUser.id).single();
    
    if (!userData || userData.password !== securityForm.currentPassword) {
      setSecurityMessage('Erro: A senha atual está incorreta.');
      setIsSavingSecurity(false);
      return;
    }

    const { error } = await supabase.from('users').update({ password: securityForm.newPassword }).eq('id', currentUser.id);

    setIsSavingSecurity(false);
    if (error) {
      setSecurityMessage('Erro ao atualizar senha: ' + error.message);
    } else {
      setSecurityMessage('Senha atualizada com sucesso!');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  // ------------------------------------------------------------------
  // USERS LOGIC
  // ------------------------------------------------------------------
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    setUserMessage('');

    if (userForm.id) {
      // Update
      const updateData: any = {
        username: userForm.username,
        name: userForm.name,
        role: userForm.role,
        email: userForm.email,
        phone: userForm.phone,
        avatar_initials: userForm.avatar_initials.toUpperCase() || userForm.name.substring(0, 2).toUpperCase()
      };
      if (userForm.password) updateData.password = userForm.password;

      const { error } = await supabase.from('users').update(updateData).eq('id', userForm.id);
      if (error) setUserMessage('Erro ao atualizar: ' + error.message);
      else { setUserMessage('Usuário atualizado!'); fetchData(); setUserForm({ id: '', username: '', password: '', name: '', role: 'Cliente', email: '', phone: '', avatar_initials: '' }); }
    } else {
      // Insert
      if (!userForm.password) { setUserMessage('Senha obrigatória para novo usuário'); setIsSavingUser(false); return; }
      const { error } = await supabase.from('users').insert([{
        username: userForm.username,
        password: userForm.password,
        name: userForm.name,
        role: userForm.role,
        email: userForm.email,
        phone: userForm.phone,
        avatar_initials: userForm.avatar_initials.toUpperCase() || userForm.name.substring(0, 2).toUpperCase()
      }]);
      if (error) setUserMessage('Erro ao criar: ' + error.message);
      else { setUserMessage('Usuário criado!'); fetchData(); setUserForm({ id: '', username: '', password: '', name: '', role: 'Cliente', email: '', phone: '', avatar_initials: '' }); }
    }
    setIsSavingUser(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) return alert("Você não pode excluir a si mesmo!");
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;
    await supabase.from('users').delete().eq('id', id);
    fetchData();
  };

  const handleEditUser = (user: User) => {
    setUserForm({
      id: user.id,
      username: user.username,
      password: '', // require blank to not accidentally update
      name: user.name,
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      avatar_initials: user.avatar_initials
    });
    setUserMessage('');
  };

  // ------------------------------------------------------------------
  // BULK DELETE TICKETS LOGIC
  // ------------------------------------------------------------------
  const handleBulkDeleteTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkDeleteMessage('');

    if (!window.confirm('CUIDADO: Você está prestes a excluir TODOS os chamados do sistema. Deseja prosseguir?')) return;

    setIsDeletingTickets(true);
    // Verify credentials
    const { data: userData } = await supabase.from('users').select('password').eq('id', currentUser.id).eq('username', bulkDeleteForm.username).single();
    
    if (!userData || userData.password !== bulkDeleteForm.password) {
      setBulkDeleteMessage('Erro: Usuário ou senha incorretos.');
      setIsDeletingTickets(false);
      return;
    }

    const { error } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all

    setIsDeletingTickets(false);
    if (error) {
      setBulkDeleteMessage('Erro ao excluir chamados: ' + error.message);
    } else {
      setBulkDeleteMessage('Todos os chamados foram excluídos com sucesso.');
      setBulkDeleteForm({ username: '', password: '' });
      window.dispatchEvent(new Event('dashboard-stats-changed'));
    }
  };


  // ------------------------------------------------------------------
  // SYSTEM / CATEGORIES / STATUS
  // ------------------------------------------------------------------
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Logo upload logic remains the same...
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setIsUploadingLogo(true);
    setSystemMessage('');

    const ext = file.name.split('.').pop();
    const fileName = `system-logo.${ext}`;
    await supabase.storage.from('logos').remove([fileName]);
    const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) { setSystemMessage('Erro ao enviar logo: ' + uploadError.message); setIsUploadingLogo(false); return; }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('system_config').update({ logo_url: publicUrl }).eq('id', 1);
    setLogoPreview(publicUrl);
    setIsUploadingLogo(false);
    setSystemMessage('Logo atualizada com sucesso!');
    window.dispatchEvent(new Event('system-config-changed'));
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSystem(true);
    const { error } = await supabase.from('system_config').update({ title: systemForm.title, subtitle: systemForm.subtitle }).eq('id', 1);
    setIsSavingSystem(false);
    if (error) setSystemMessage('Erro ao salvar: ' + error.message);
    else { setSystemMessage('Configurações atualizadas!'); window.dispatchEvent(new Event('system-config-changed')); }
  };

  const handleSaveHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHelp(true);
    const { error } = await supabase.from('system_config').update({ 
      help_text: helpForm.help_text, 
      help_email: helpForm.help_email,
      help_site: helpForm.help_site,
      help_phone: helpForm.help_phone
    }).eq('id', 1);
    setIsSavingHelp(false);
    if (error) setHelpMessage('Erro ao salvar: ' + error.message);
    else { setHelpMessage('Informações de ajuda atualizadas!'); window.dispatchEvent(new Event('system-config-changed')); }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (activeTab === 'categories') {
      const { data, error } = await supabase.from('categories').insert([{ name: newItemName.trim(), color: 'bg-outline-variant' }]).select();
      if (!error && data) setCategories([...categories, data[0]]);
    } else {
      const { data, error } = await supabase.from('statuses').insert([{ name: newItemName.trim(), labelType: 'default' }]).select();
      if (!error && data) setStatuses([...statuses, data[0]]);
    }
    setNewItemName('');
  };

  const handleDeleteItem = async (id: string) => {
    if (activeTab === 'categories') {
      await supabase.from('categories').delete().eq('id', id);
      setCategories(categories.filter(c => c.id !== id));
    } else {
      await supabase.from('statuses').delete().eq('id', id);
      setStatuses(statuses.filter(s => s.id !== id));
    }
  };

  const getAvailableTabs = () => {
    let t: { key: Tab; label: string; icon: string }[] = [
      { key: 'profile', label: 'Meu Perfil', icon: 'account_circle' },
      { key: 'security', label: 'Segurança', icon: 'lock' },
    ];
    if (currentUser.role === 'Administrador') {
      t.push({ key: 'users', label: 'Usuários', icon: 'group' });
      t.push({ key: 'tickets', label: 'Chamados', icon: 'delete_sweep' });
      t.push({ key: 'system', label: 'Sistema', icon: 'display_settings' });
      t.push({ key: 'help', label: 'Ajuda', icon: 'help_outline' });
      t.push({ key: 'categories', label: 'Categorias', icon: 'label' });
      t.push({ key: 'status', label: 'Status', icon: 'radio_button_checked' });
    }
    return t;
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6 md:p-8">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Configurações do Sistema</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Administre o perfil e as configurações.</p>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 mb-6 gap-1 overflow-x-auto pb-1">
          {getAvailableTabs().map(tab => (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-4 py-3 font-label-bold text-label-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="max-w-lg">
            <div className="flex items-center gap-5 mb-6 p-4 bg-surface rounded-lg border border-outline-variant/20">
              <div className="relative flex-shrink-0 group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-secondary/30 shadow-md">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <span className="font-headline-sm text-headline-sm text-on-secondary font-bold">{profileForm.avatar_initials || 'AD'}</span>
                    </div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingAvatar ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>photo_camera</span>}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">{profileForm.name}</p>
                <p className="font-body-sm text-body-sm text-secondary">{currentUser.role}</p>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Nome completo</label>
                <input required type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none transition-colors" disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface">E-mail</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none transition-colors" disabled={isLoading} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface">Telefone</label>
                  <input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none transition-colors" disabled={isLoading} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="font-label-sm text-label-sm text-on-surface">Iniciais do Avatar (2 max)</label>
                <input type="text" maxLength={2} value={profileForm.avatar_initials} onChange={e => setProfileForm({ ...profileForm, avatar_initials: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none transition-colors uppercase" disabled={isLoading} />
              </div>
              {profileMessage && <p className="text-sm px-3 py-2 rounded-lg border bg-surface-variant text-on-surface">{profileMessage}</p>}
              <button type="submit" disabled={isSavingProfile || isLoading} className="flex items-center justify-center gap-2 bg-secondary text-on-secondary py-2.5 rounded-lg hover:opacity-90 transition-opacity">Salvar Perfil</button>
            </form>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="max-w-md">
            <h3 className="font-title-sm text-title-sm text-on-surface mb-4">Alterar Senha</h3>
            <form onSubmit={handleSaveSecurity} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Senha Atual</label>
                <input required type="password" value={securityForm.currentPassword} onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Nova Senha</label>
                <input required type="password" value={securityForm.newPassword} onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Confirme a Nova Senha</label>
                <input required type="password" value={securityForm.confirmPassword} onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 outline-none" />
              </div>
              {securityMessage && <p className={`text-sm px-3 py-2 rounded-lg border ${securityMessage.startsWith('Erro') ? 'text-error bg-error/10 border-error/20' : 'text-[#10B981] bg-[#10B981]/10'}`}>{securityMessage}</p>}
              <button type="submit" disabled={isSavingSecurity} className="flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-lg hover:opacity-90">Alterar Senha</button>
            </form>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && currentUser.role === 'Administrador' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="font-title-sm text-title-sm text-on-surface">Listagem de Usuários</h3>
              <ul className="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-lg">
                {users.map(u => (
                  <li key={u.id} className="p-3 hover:bg-surface-container-low transition-colors flex justify-between items-center group">
                    <div>
                      <p className="font-body-md text-on-surface font-medium">{u.name}</p>
                      <p className="font-body-sm text-on-surface-variant">{u.username} • <span className="text-secondary">{u.role}</span></p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditUser(u)} className="p-1.5 text-secondary hover:bg-secondary/10 rounded-md" title="Editar"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-error hover:bg-error/10 rounded-md" title="Excluir"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-outline-variant/30 rounded-lg p-5">
              <h3 className="font-title-sm text-title-sm text-on-surface mb-4">{userForm.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <form onSubmit={handleSaveUser} className="flex flex-col gap-3">
                <input required type="text" placeholder="Nome Completo" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30" />
                <input required type="text" placeholder="Login (Usuário)" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="w-full bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30" />
                <input type="password" placeholder={userForm.id ? "Senha (deixe em branco p/ manter)" : "Senha (Obrigatório)"} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30" />
                <select required value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30">
                  <option value="Administrador">Administrador</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Cliente">Cliente</option>
                </select>
                <div className="flex gap-2">
                  <input type="email" placeholder="E-mail (opcional)" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30" />
                  <input type="text" placeholder="Iniciais" maxLength={2} value={userForm.avatar_initials} onChange={e => setUserForm({ ...userForm, avatar_initials: e.target.value })} className="w-20 bg-surface-container px-3 py-2 rounded-md border border-outline-variant/30 uppercase" />
                </div>
                {userMessage && <p className="text-xs text-[#10B981]">{userMessage}</p>}
                <div className="flex gap-2 mt-2">
                  <button type="submit" disabled={isSavingUser} className="flex-1 bg-secondary text-on-secondary py-2 rounded-md">Salvar</button>
                  {userForm.id && <button type="button" onClick={() => setUserForm({ id: '', username: '', password: '', name: '', role: 'Cliente', email: '', phone: '', avatar_initials: '' })} className="px-3 bg-surface border border-outline-variant rounded-md">Cancelar</button>}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── SYSTEM TAB ── */}
        {activeTab === 'system' && currentUser.role === 'Administrador' && (
          <div className="max-w-lg">
            <div className="flex items-center gap-5 mb-6 p-4 bg-surface rounded-lg border border-outline-variant/20">
              <div className="relative flex-shrink-0 group">
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-secondary/30 shadow-md bg-white flex items-center justify-center">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>domain</span>}
                </div>
                <label htmlFor="logo-upload" className="absolute inset-0 rounded-lg bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingLogo ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>upload</span>}
                </label>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">Logo do Sistema</p>
                <p className="font-body-xs text-body-xs text-on-surface-variant mt-0.5">A imagem será ajustada automaticamente</p>
              </div>
            </div>
            <form onSubmit={handleSaveSystem} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Título do Sistema</label>
                <input required type="text" value={systemForm.title} onChange={e => setSystemForm({ ...systemForm, title: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Subtítulo</label>
                <input required type="text" value={systemForm.subtitle} onChange={e => setSystemForm({ ...systemForm, subtitle: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              {systemMessage && <p className="text-sm px-3 py-2 rounded-lg border text-[#10B981] bg-[#10B981]/10">{systemMessage}</p>}
              <button type="submit" disabled={isSavingSystem} className="bg-secondary text-on-secondary py-2.5 rounded-lg">Salvar Configurações</button>
            </form>
          </div>
        )}

        {/* ── BULK DELETE TICKETS TAB ── */}
        {activeTab === 'tickets' && currentUser.role === 'Administrador' && (
          <div className="max-w-md">
            <div className="bg-error/10 border border-error/20 p-5 rounded-lg mb-6">
              <h3 className="font-title-sm text-error flex items-center gap-2 mb-2"><span className="material-symbols-outlined">warning</span> Zona de Perigo</h3>
              <p className="font-body-sm text-on-surface-variant">Esta ação irá apagar definitivamente <strong>todos os chamados</strong> registrados no sistema. Esta ação não pode ser desfeita.</p>
            </div>
            <form onSubmit={handleBulkDeleteTickets} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Confirme seu Usuário</label>
                <input required type="text" value={bulkDeleteForm.username} onChange={e => setBulkDeleteForm({ ...bulkDeleteForm, username: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-error focus:ring-1 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Confirme sua Senha</label>
                <input required type="password" value={bulkDeleteForm.password} onChange={e => setBulkDeleteForm({ ...bulkDeleteForm, password: e.target.value })} className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-error focus:ring-1 outline-none" />
              </div>
              {bulkDeleteMessage && <p className={`text-sm px-3 py-2 rounded-lg border ${bulkDeleteMessage.startsWith('Erro') ? 'text-error bg-error/10 border-error/20' : 'text-[#10B981] bg-[#10B981]/10'}`}>{bulkDeleteMessage}</p>}
              <button type="submit" disabled={isDeletingTickets} className="flex items-center justify-center gap-2 bg-error text-white py-2.5 rounded-lg hover:opacity-90">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_forever</span> Excluir Todos os Chamados
              </button>
            </form>
          </div>
        )}

        {/* ── HELP TAB ── */}
        {activeTab === 'help' && currentUser.role === 'Administrador' && (
          <div className="max-w-lg">
            <div className="mb-6">
              <h3 className="font-title-sm text-title-sm text-on-surface">Informações de Ajuda</h3>
              <p className="font-body-xs text-body-xs text-on-surface-variant">Estas informações aparecerão no menu de ajuda para os usuários.</p>
            </div>
            <form onSubmit={handleSaveHelp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Título (Máx 20 caracteres)</label>
                <input type="text" maxLength={20} value={helpForm.help_text} onChange={e => setHelpForm({ ...helpForm, help_text: e.target.value })} placeholder="Ex: Central de Ajuda" className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">E-mail de Suporte (Opcional)</label>
                <input type="email" value={helpForm.help_email} onChange={e => setHelpForm({ ...helpForm, help_email: e.target.value })} placeholder="suporte@empresa.com" className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Site / Portal (Opcional)</label>
                <input type="text" value={helpForm.help_site} onChange={e => setHelpForm({ ...helpForm, help_site: e.target.value })} placeholder="www.empresa.com.br" className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface">Telefone de Contato (Opcional)</label>
                <input type="text" value={helpForm.help_phone} onChange={e => setHelpForm({ ...helpForm, help_phone: e.target.value })} placeholder="(11) 99999-9999" className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1" />
              </div>
              {helpMessage && <p className={`text-sm px-3 py-2 rounded-lg border ${helpMessage.startsWith('Erro') ? 'text-error bg-error/10' : 'text-[#10B981] bg-[#10B981]/10'}`}>{helpMessage}</p>}
              <button type="submit" disabled={isSavingHelp} className="bg-secondary text-on-secondary py-2.5 rounded-lg">Salvar Informações de Ajuda</button>
            </form>
          </div>
        )}

        {/* ── CATEGORIES / STATUS TABS ── */}
        {(activeTab === 'categories' || activeTab === 'status') && currentUser.role === 'Administrador' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 flex flex-col gap-4">
              <h3 className="font-title-sm text-title-sm text-on-surface">{activeTab === 'categories' ? 'Categorias Atuais' : 'Status Atuais'}</h3>
              <div className="bg-surface border border-outline-variant/30 rounded-lg overflow-hidden">
                <ul className="divide-y divide-outline-variant/20">
                  {(activeTab === 'categories' ? categories : statuses).map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low transition-colors group">
                      <div className="flex items-center gap-3">
                        {activeTab === 'categories' ? <span className={`w-3 h-3 rounded-full ${(item as Category).color}`}></span> : <span className="material-symbols-outlined text-outline-variant">label</span>}
                        <span className="font-body-md text-on-surface">{item.name}</span>
                      </div>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-error hover:bg-error/10 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"><span className="material-symbols-outlined">delete</span></button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-surface border border-outline-variant/30 rounded-lg p-5 h-fit">
              <h3 className="font-title-sm text-title-sm text-on-surface mb-4">{activeTab === 'categories' ? 'Nova Categoria' : 'Novo Status'}</h3>
              <form onSubmit={handleAddItem} className="flex flex-col gap-4">
                <input required type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Nome do item..." className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/30 focus:border-secondary" />
                <button type="submit" className="w-full flex justify-center gap-2 bg-secondary text-on-secondary py-2 rounded-lg hover:opacity-90"><span className="material-symbols-outlined">add</span> Cadastrar</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
