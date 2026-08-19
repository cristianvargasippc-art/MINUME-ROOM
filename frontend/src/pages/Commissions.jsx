import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Icon from '../components/Icon';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const themeStyles = {
  sunrise: 'linear-gradient(135deg, #163ea8 0%, #316cef 100%)',
  ocean: 'linear-gradient(135deg, #1c4fd4 0%, #0ea5e9 100%)',
  forest: 'linear-gradient(135deg, #102a63 0%, #38bdf8 130%)',
  ember: 'linear-gradient(135deg, #08183a 0%, #2f68ee 100%)'
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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const canManage = ['superadmin', 'secretaria'].includes(user?.role);

  const loadCommissions = async () => {
    const response = await api.get('/api/commissions');
    setCommissions(Array.isArray(response.data) ? response.data : []);
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
    setSaving(true);

    try {
      await api.post('/api/commissions', form);
      toast.success('Comisión creada correctamente');
      setForm(initialForm);
      setShowForm(false);
      await loadCommissions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo crear la comisión');
    } finally {
      setSaving(false);
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
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="pill pill-blue">
            <Icon name="building" size={14} />
            Espacios de aula
          </span>
          <h1>Comisiones MINUME XVII</h1>
          <p>Cada comisión funciona como un espacio académico con tareas, personas y seguimiento propio.</p>
        </div>
        {canManage ? (
          <div className="page-heading__actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
              <Icon name={showForm ? 'close' : 'plus'} />
              {showForm ? 'Cerrar formulario' : 'Nueva comisión'}
            </button>
          </div>
        ) : null}
      </section>

      <section className="dashboard-metrics">
        <StatCard label="Comisiones" value={commissions.length} tone="var(--primary)" icon="building" helper="Espacios activos" />
        <StatCard label="Integrantes" value={totals.members} tone="var(--accent)" icon="users" helper="Delegados y mesa" />
        <StatCard label="Tareas publicadas" value={totals.assignments} tone="var(--success)" icon="tasks" helper="Trabajo de clase" />
      </section>

      {showForm ? (
        <section className="glass-card classroom-panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="panel-head__icon"><Icon name="plus" /></span>
              <div>
                <h2>Crear nueva comisión</h2>
                <p>Define el espacio base, su código y el estilo visual del aula.</p>
              </div>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
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
            <div className="form-full">
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
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Icon name="check" />
                {saving ? 'Guardando...' : 'Guardar comisión'}
              </button>
              <button type="button" className="btn btn-muted" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="classroom-grid">
        {commissions.map((commission) => (
          <Link key={commission.id} to={`/room/commissions/${commission.id}`} className="commission-card">
            <div
              className="commission-card__hero"
              style={{ background: themeStyles[commission.theme] || themeStyles.sunrise }}
            >
              <span className="pill pill-onbrand">{commission.code}</span>
              <h2>{commission.name}</h2>
              <p>{commission.section}</p>
            </div>

            <div className="commission-card__body">
              <p>{commission.description}</p>

              <div className="commission-card__stats">
                <span><Icon name="users" />{commission.members_count} integrantes</span>
                <span><Icon name="tasks" />{commission.assignments_count} tareas</span>
                <span><Icon name="target" />{commission.active_assignments} activas</span>
              </div>
            </div>
          </Link>
        ))}

        {!commissions.length ? (
          <div className="empty-card">
            <Icon name="building" />
            <strong>Todavía no hay comisiones disponibles</strong>
            <span>Cuando la secretaría cree un espacio, aparecerá aquí.</span>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default Commissions;
