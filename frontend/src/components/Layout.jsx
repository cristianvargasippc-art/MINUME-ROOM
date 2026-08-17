import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api, { getApiBaseUrl } from '../services/api';

const navItems = [
  { path: '/room/dashboard', labelKey: 'panel', shortcut: '01', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
  { path: '/room/commissions', labelKey: 'commissions', shortcut: '02', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
  { path: '/room/assignments', labelKey: 'tasks', shortcut: '03', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
  { path: '/room/alerts', labelKey: 'alerts', shortcut: '04', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] }
];

const Layout = () => {
  const { user, logout, login, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('minume-theme') || 'dark');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''));
  const initials = (user?.fullName || 'MR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const avatarUrl = useMemo(() => {
    if (!user?.profileImageUrl) {
      return null;
    }

    return user.profileImageUrl.startsWith('http')
      ? user.profileImageUrl
      : `${getApiBaseUrl()}${user.profileImageUrl}`;
  }, [user?.profileImageUrl]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('minume-theme', theme);
  }, [theme]);

  useEffect(() => {
    setProfileName(user?.fullName || '');
  }, [user?.fullName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/api/auth/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const token = localStorage.getItem('token');
      login(token, response.data);
      await refreshProfile().catch(() => null);
      toast.success('Imagen de perfil actualizada');
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar la imagen');
    } finally {
      event.target.value = '';
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await api.patch('/api/auth/profile', { fullName: profileName });
      const token = localStorage.getItem('token');
      login(token, response.data);
      setProfileOpen(false);
      toast.success(language === 'es' ? 'Perfil actualizado' : 'Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'es' ? 'No se pudo actualizar el perfil' : 'Profile could not be updated'));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="app-shell shell-grid">
      <aside className={`shell-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="room-sidebar">
          <div>
            <div className="sidebar-brand">
              <span className="brand-seal">MR</span>
              <div>
                <strong>MINUME ROOM</strong>
                <small>{t('model')}</small>
              </div>
            </div>
            <p className="sidebar-intro">
              {t('sidebarIntro')}
            </p>
          </div>

          <nav className="sidebar-nav">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
              >
                <span>{item.shortcut}</span>
                <strong>{t(item.labelKey)}</strong>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-profile">
            <button type="button" className="avatar-button" onClick={() => fileInputRef.current?.click()} title="Cambiar imagen de perfil">
              {avatarUrl ? <img src={avatarUrl} alt={user?.fullName || 'Perfil'} /> : <span>{initials}</span>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            <div>
              <p>{user?.fullName}</p>
              <span>{user?.role}</span>
            </div>
            <button type="button" className="btn btn-muted sidebar-edit" onClick={() => setProfileOpen((value) => !value)}>
              {t('editProfile')}
            </button>
            {profileOpen ? (
              <form className="profile-editor" onSubmit={handleProfileSubmit}>
                <label className="label" htmlFor="profileName">{t('fullName')}</label>
                <input id="profileName" className="input" value={profileName} onChange={(event) => setProfileName(event.target.value)} required />
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? '...' : t('save')}
                </button>
              </form>
            ) : null}
            <div className="theme-switch" role="group" aria-label={t('language')}>
              <button type="button" className={language === 'es' ? 'is-active' : ''} onClick={() => setLanguage('es')}>ES</button>
              <button type="button" className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
            </div>
            <div className="theme-switch" role="group" aria-label="Modo visual">
              <button type="button" className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')}>{t('light')}</button>
              <button type="button" className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')}>{t('dark')}</button>
            </div>
            <button type="button" className="btn btn-muted sidebar-logout" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      <main className="shell-main">
        <div className="mobile-nav-toggle">
          <button type="button" className="btn btn-muted" onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? t('hideMenu') : t('showMenu')}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
