import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const Login = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    fullName: '',
    email: 'superadmin@minume-xvii.edu.do',
    password: 'Minume2025!'
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
      toast.success(mode === 'login' ? 'Sesión iniciada correctamente' : 'Cuenta creada correctamente');
      navigate('/room/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo completar la solicitud');
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
          <span className="pill auth-pill">Centro académico</span>
          <h1>{language === 'es' ? 'Gestión de comisiones, tareas y rúbricas en un solo espacio.' : 'Committees, tasks, and rubrics managed in one space.'}</h1>
          <p>{language === 'es' ? 'Accede a tu aula, publica asignaciones, entrega documentos y consulta calificaciones con una experiencia clara, moderna y profesional.' : 'Access your room, publish assignments, submit documents, and review grades through a clean professional experience.'}</p>
        </div>

        <div className="auth-metrics">
          {[
            ['Rúbricas', 'Criterios dinámicos'],
            ['Entregas', 'Un archivo vigente'],
            ['Mesa', 'Calificar o devolver']
          ].map(([title, text]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-tools">
          <button type="button" className={language === 'es' ? 'is-active' : ''} onClick={() => setLanguage('es')}>ES</button>
          <button type="button" className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
          <span>MINUME XVII</span>
        </div>

        <div className="auth-card">
          <div className="segmented-control">
            <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>{t('login')}</button>
            <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => setMode('register')}>{t('register')}</button>
          </div>

          <div>
            <span className="eyebrow">{mode === 'login' ? t('welcomeBack') : t('newAccount')}</span>
            <h2>{mode === 'login' ? t('loginTitle') : t('registerTitle')}</h2>
            <p>
              {mode === 'login'
                ? t('loginCopy')
                : t('registerCopy')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' ? (
              <div>
                <label className="label" htmlFor="fullName">{t('fullName')}</label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName}
                  onChange={(event) => updateForm('fullName', event.target.value)}
                  placeholder="Nombre y apellido"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="label" htmlFor="email">{t('email')}</label>
              <input
                id="email"
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="tu-correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">{t('password')}</label>
              <input
                id="password"
                className="input"
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder={t('minPassword')}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('processing') : mode === 'login' ? t('enterPanel') : t('createAccount')}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
