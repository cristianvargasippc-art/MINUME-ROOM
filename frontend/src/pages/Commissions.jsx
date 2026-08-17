import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const themeStyles = {
  sunrise: 'linear-gradient(135deg, #0b5fff 0%, #084bbf 100%)',
  ocean: 'linear-gradient(135deg, #1d5fff 0%, #12a4d9 100%)',
  forest: 'linear-gradient(135deg, #0f3d70 0%, #1f8ad6 100%)',
  ember: 'linear-gradient(135deg, #08234a 0%, #0b5fff 100%)'
};

const initialForm = {
  name: '',
  code: '',
  section: '',
  chairName: '',
  description: '',
  theme: 'sunrise'
};

const Commissions = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const canManage = ['superadmin', 'secretaria'].includes(user?.role);

  const loadCommissions = async () => {
    const response = await api.get('/api/commissions');
    setCommissions(response.data);
    setLoading(false);
  };

  useEffect(() => {
    loadCommissions().catch(() => setLoading(false));
  }, []);

  const totals = useMemo(() => (
    commissions.reduce((acc, commission) => {
      acc.members += Number(commission.members_count || 0);
      acc.assignments += Number(commission.assignments_count || 0);
      return acc;
    }, { members: 0, assignments: 0 })
  ), [commissions]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post('/api/commissions', form);
      toast.success('Comisión creada correctamente');
      setForm(initialForm);
      setShowForm(false);
      loadCommissions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo crear la comisión');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.4rem' }}>
      <section className="page-heading">
        <div>
          <span className="pill pill-blue">Espacios de aula</span>
          <h1>Comisiones MINUME XVII</h1>
          <p>
            Cada comisión funciona como un espacio académico con tareas, personas y seguimiento propio.
          </p>
        </div>
        {canManage ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cerrar formulario' : 'Nueva comisión'}
          </button>
        ) : null}
      </section>

      <section className="dashboard-metrics">
        <article className="glass-card classroom-panel">
          <div className="eyebrow">Comisiones</div>
          <div className="metric-value">{commissions.length}</div>
        </article>
        <article className="glass-card classroom-panel">
          <div className="eyebrow">Integrantes</div>
          <div className="metric-value">{totals.members}</div>
        </article>
        <article className="glass-card classroom-panel">
          <div className="eyebrow">Tareas publicadas</div>
          <div className="metric-value">{totals.assignments}</div>
        </article>
      </section>

      {showForm ? (
        <section className="glass-card classroom-panel">
          <div className="page-heading">
            <div>
              <h1 style={{ fontSize: '1.8rem' }}>Crear nueva comisión</h1>
              <p>Define el espacio base, su código y el estilo visual del aula.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: '1.2rem' }}>
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="code">Código</label>
              <input id="code" className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="section">Sección</label>
              <input id="section" className="input" value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="chairName">Mesa responsable</label>
              <input id="chairName" className="input" value={form.chairName} onChange={(event) => setForm({ ...form, chairName: event.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="description">Descripción</label>
              <textarea id="description" className="input textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="theme">Tema visual</label>
              <select id="theme" className="input" value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })}>
                <option value="sunrise">Azul institucional</option>
                <option value="ocean">Azul celeste</option>
                <option value="forest">Azul académico</option>
                <option value="ember">Azul marino</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button type="submit" className="btn btn-primary">Guardar comisión</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="classroom-grid">
        {commissions.map((commission) => (
          <Link key={commission.id} to={`/room/commissions/${commission.id}`} className="commission-card">
            <div className="commission-card__hero" style={{ background: themeStyles[commission.theme] || themeStyles.sunrise }}>
              <div className="pill" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>{commission.code}</div>
              <h2>{commission.name}</h2>
              <p>{commission.section}</p>
            </div>

            <div className="commission-card__body">
              <p>{commission.description}</p>

              <div className="commission-card__stats">
                <span>{commission.members_count} integrantes</span>
                <span>{commission.assignments_count} tareas</span>
                <span>{commission.active_assignments} activas</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Commissions;
