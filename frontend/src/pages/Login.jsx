import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const metrics = [
  ['Rúbricas', 'Criterios dinámicos', 'award'],
  ['Entregas', 'Un archivo vigente', 'upload'],
  ['Mesa', 'Calificar o devolver', 'checkCircle']
];

const Login = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { fullName: form.fullName, email: form.email, password: form.password };
      const response = await api.post(endpoint, payload);
      login(response.data.token, response.data.user);
      toast.success(mode === 'login'
        ? (language === 'es' ? 'Sesión iniciada correctamente' : 'Signed in successfully')
        : (language === 'es' ? 'Cuenta creada correctamente' : 'Account created successfully'));
      navigate('/room/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'es' ? 'No se pudo completar la solicitud' : 'The request could not be completed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page--dark">
      <section className="auth-showcase">
        <Link className="brand-mark brand-mark--light" to="/">
          <span className="brand-seal">MR</span>
          <span>
            <strong>MINUME ROOM</strong>
            <small>Modelo de Naciones Unidas</small>
          </span>
        </Link>

        <div className="auth-showcase__copy">
          <span className="pill auth-pill">
            <Icon name="sparkles" size={14} />
            {language === 'es' ? 'Centro académico' : 'Academic center'}
          </span>
          <h1>
            {language === 'es'
              ? 'Gestión de comisiones, tareas y rúbricas en un solo espacio.'
              : 'Committees, tasks, and rubrics managed in one space.'}
          </h1>
          <p>
            {language === 'es'
              ? 'Accede a tu aula, publica asignaciones, entrega documentos y consulta calificaciones con una experiencia clara, moderna y profesional.'
              : 'Access your room, publish assignments, submit documents, and review grades through a clean professional experience.'}
          </p>
        </div>

        <div className="auth-metrics">
          {metrics.map(([title, text, icon]) => (
            <div key={title}>
              <strong>
                <Icon name={icon} size={15} /> {title}
              </strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tools">
          <span>MINUME XVII</span>
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

        <div className="auth-card">
          <div className="segmented-control">
            <button
              type="button"
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => setMode('login')}
              aria-pressed={mode === 'login'}
            >
              {t('login')}
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => setMode('register')}
              aria-pressed={mode === 'register'}
            >
              {t('register')}
            </button>
          </div>

          <div>
            <span className="eyebrow">{mode === 'login' ? t('welcomeBack') : t('newAccount')}</span>
            <h2>{mode === 'login' ? t('loginTitle') : t('registerTitle')}</h2>
            <p>{mode === 'login' ? t('loginCopy') : t('registerCopy')}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
            {mode === 'register' ? (
              <div>
                <label className="label" htmlFor="fullName">{t('fullName')}</label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName}
                  onChange={(event) => updateForm('fullName', event.target.value)}
                  placeholder={language === 'es' ? 'Nombre y apellido' : 'First and last name'}
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="label" htmlFor="email">{t('email')}</label>
              <input
                id="email"
                name="minume-user"
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="tu-correo@ejemplo.com"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">{t('password')}</label>
              <div className="input-group">
                <input
                  id="password"
                  name="minume-pass"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateForm('password', event.target.value)}
                  placeholder={t('minPassword')}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="input-affix"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword
                    ? (language === 'es' ? 'Ocultar contraseña' : 'Hide password')
                    : (language === 'es' ? 'Mostrar contraseña' : 'Show password')}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('processing') : mode === 'login' ? t('enterPanel') : t('createAccount')}
              {loading ? null : <Icon name="arrowRight" />}
            </button>
          </form>

          <Link className="auth-back" to="/">
            <Icon name="arrowLeft" />
            {language === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Login;
