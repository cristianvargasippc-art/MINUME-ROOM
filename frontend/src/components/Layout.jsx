import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';
import api, { getApiBaseUrl } from '../services/api';

const ALL_ROLES = ['superadmin', 'secretaria', 'mesa', 'delegado'];

const navItems = [
  { path: '/room/dashboard', labelKey: 'panel', icon: 'dashboard', roles: ALL_ROLES },
  { path: '/room/commissions', labelKey: 'commissions', icon: 'users', roles: ALL_ROLES },
  { path: '/room/assignments', labelKey: 'tasks', icon: 'tasks', roles: ALL_ROLES },
  { path: '/room/alerts', labelKey: 'alerts', icon: 'bell', roles: ALL_ROLES }
];

const getInitials = (fullName) => (fullName || 'MR')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const Layout = () => {
  const { user, logout, login, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const accountRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [railMode, setRailMode] = useState(() => localStorage.getItem('minume-rail') === '1');
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('minume-theme') || 'dark');

  const filteredNav = useMemo(
    () => navItems.filter((item) => item.roles.includes(user?.role || '')),
    [user?.role]
  );

  const activeItem = useMemo(
    () => filteredNav.find((item) => location.pathname.startsWith(item.path)),
    [filteredNav, location.pathname]
  );

  const initials = getInitials(user?.fullName);

  const avatarUrl = useMemo(() => {
    if (!user?.profileImageUrl) {
      return null;
    }

    return user.profileImageUrl.startsWith('http')
      ? user.profileImageUrl
      : `${getApiBaseUrl()}${user.profileImageUrl}`;
  }, [user?.profileImageUrl]);

  /* --- Tema --- */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('minume-theme', theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#060f22' : '#f2f6fd');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('minume-rail', railMode ? '1' : '0');
  }, [railMode]);

  useEffect(() => {
    setProfileName(user?.fullName || '');
  }, [user?.fullName]);

  /* --- El cajón se cierra al navegar --- */
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  /* --- Bloqueo del scroll de fondo mientras el cajón está abierto --- */
  useEffect(() => {
    document.body.classList.toggle('has-locked-scroll', menuOpen);

    return () => document.body.classList.remove('has-locked-scroll');
  }, [menuOpen]);

  /* --- Escape cierra cajón y menú de cuenta --- */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setAccountOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* --- Clic fuera del menú de cuenta --- */
  useEffect(() => {
    if (!accountOpen) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [accountOpen]);

  /* --- Contador de avisos sin leer --- */
  useEffect(() => {
    let mounted = true;

    const loadUnread = () => {
      api.get('/api/dashboard/metrics')
        .then((response) => {
          if (mounted) {
            setUnreadAlerts(Number(response.data?.unreadAlerts) || 0);
          }
        })
        .catch(() => null);
    };

    loadUnread();
    const interval = setInterval(loadUnread, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

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
      toast.success(language === 'es' ? 'Imagen de perfil actualizada' : 'Profile picture updated');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'es' ? 'No se pudo actualizar la imagen' : 'The picture could not be updated'));
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
      setProfileFormOpen(false);
      toast.success(language === 'es' ? 'Perfil actualizado' : 'Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'es' ? 'No se pudo actualizar el perfil' : 'Profile could not be updated'));
    } finally {
      setSavingProfile(false);
    }
  };

  const currentTitle = activeItem ? t(activeItem.labelKey) : 'MINUME ROOM';

  return (
    <div className={`app-shell ${railMode ? 'is-rail' : ''}`}>
      <a className="skip-link" href="#contenido">{t('skipToContent')}</a>

      {/* ---------------------------------------------------------------- */}
      {/* Barra lateral                                                     */}
      {/* ---------------------------------------------------------------- */}
      <aside
        id="menu-lateral"
        className={`shell-sidebar ${menuOpen ? 'is-open' : ''}`}
        aria-label={t('mainNavigation')}
      >
        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setRailMode((value) => !value)}
          aria-label={railMode ? t('expandMenu') : t('collapseMenu')}
          title={railMode ? t('expandMenu') : t('collapseMenu')}
        >
          <Icon name="chevronLeft" />
        </button>

        <div className="room-sidebar">
          <div className="sidebar-brand">
            <span className="brand-seal">MR</span>
            <div>
              <strong>MINUME ROOM</strong>
              <small>{t('model')}</small>
            </div>
          </div>

          <p className="sidebar-intro">{t('sidebarIntro')}</p>

          <span className="sidebar-section-label">{t('classroom')}</span>

          <nav className="sidebar-nav">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                title={t(item.labelKey)}
              >
                <span className="sidebar-link__icon">
                  <Icon name={item.icon} />
                </span>
                <strong>{t(item.labelKey)}</strong>
                {item.labelKey === 'alerts' && unreadAlerts > 0 ? (
                  <span className="sidebar-link__count">{unreadAlerts}</span>
                ) : <span />}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-foot">
            <div className="sidebar-user">
              <span className="avatar avatar-sm">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
              </span>
              <div>
                <p>{user?.fullName}</p>
                <span>{user?.role}</span>
              </div>
            </div>

            <button type="button" className="sidebar-ghost-btn is-danger" onClick={handleLogout}>
              <Icon name="logout" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="shell-scrim"
          aria-label={t('closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Columna principal                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="shell-main">
        <header className="app-topbar">
          <div className="topbar-lead">
            <button
              type="button"
              className="icon-btn topbar-menu"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={menuOpen}
              aria-controls="menu-lateral"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>

            <Link className="topbar-brand" to="/room/dashboard">
              <span className="brand-seal">MR</span>
            </Link>

            <div className="topbar-title">
              <small>MINUME ROOM</small>
              <strong>{currentTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-lang" role="group" aria-label={t('language')}>
              <button
                type="button"
                className={language === 'es' ? 'is-active' : ''}
                onClick={() => setLanguage('es')}
                aria-pressed={language === 'es'}
              >
                ES
              </button>
              <button
                type="button"
                className={language === 'en' ? 'is-active' : ''}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? t('light') : t('dark')}
              title={theme === 'dark' ? t('light') : t('dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>

            <Link
              to="/room/alerts"
              className="icon-btn has-badge"
              aria-label={`${t('alerts')}${unreadAlerts ? ` (${unreadAlerts})` : ''}`}
              title={t('alerts')}
            >
              <Icon name="bell" />
              {unreadAlerts > 0 ? (
                <span className="badge-dot">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
              ) : null}
            </Link>

            <span className="topbar-divider" aria-hidden="true" />

            <div ref={accountRef}>
              <button
                type="button"
                className="avatar-trigger"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={t('account')}
              >
                <span className="avatar avatar-sm">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                </span>
                <div>
                  <strong>{user?.fullName?.split(' ')[0]}</strong>
                  <span>{user?.role}</span>
                </div>
                <Icon name="chevronDown" size={16} />
              </button>

              {accountOpen ? (
                <div className="account-menu" role="menu">
                  <div className="account-menu__head">
                    <button
                      type="button"
                      className="avatar-button"
                      onClick={() => fileInputRef.current?.click()}
                      title={t('changePhoto')}
                      aria-label={t('changePhoto')}
                    >
                      {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      onChange={handleAvatarUpload}
                      hidden
                    />
                    <div>
                      <strong>{user?.fullName}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="account-menu__group">
                    <button
                      type="button"
                      className="account-action"
                      onClick={() => setProfileFormOpen((value) => !value)}
                    >
                      <Icon name="edit" />
                      {t('editProfile')}
                    </button>

                    {profileFormOpen ? (
                      <form className="profile-editor" onSubmit={handleProfileSubmit}>
                        <div>
                          <label className="label" htmlFor="profileName">{t('fullName')}</label>
                          <input
                            id="profileName"
                            className="input"
                            value={profileName}
                            onChange={(event) => setProfileName(event.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
                          {savingProfile ? t('processing') : t('save')}
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <div className="account-menu__group">
                    <span className="account-menu__label">{t('appearance')}</span>
                    <div className="theme-switch" role="group" aria-label={t('appearance')}>
                      <button
                        type="button"
                        className={theme === 'light' ? 'is-active' : ''}
                        onClick={() => setTheme('light')}
                        aria-pressed={theme === 'light'}
                      >
                        {t('light')}
                      </button>
                      <button
                        type="button"
                        className={theme === 'dark' ? 'is-active' : ''}
                        onClick={() => setTheme('dark')}
                        aria-pressed={theme === 'dark'}
                      >
                        {t('dark')}
                      </button>
                    </div>

                    <span className="account-menu__label">{t('language')}</span>
                    <div className="theme-switch" role="group" aria-label={t('language')}>
                      <button
                        type="button"
                        className={language === 'es' ? 'is-active' : ''}
                        onClick={() => setLanguage('es')}
                        aria-pressed={language === 'es'}
                      >
                        Español
                      </button>
                      <button
                        type="button"
                        className={language === 'en' ? 'is-active' : ''}
                        onClick={() => setLanguage('en')}
                        aria-pressed={language === 'en'}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <div className="account-menu__group">
                    <button type="button" className="account-action is-danger" onClick={handleLogout}>
                      <Icon name="logout" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="contenido" className="shell-content">
          <Outlet />
        </main>

        {/* Navegación inferior para teléfonos */}
        <nav className="bottom-nav" aria-label={t('mainNavigation')}>
          <div className="bottom-nav__list">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}
              >
                <span className="bottom-nav__pill">
                  <Icon name={item.icon} />
                </span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
