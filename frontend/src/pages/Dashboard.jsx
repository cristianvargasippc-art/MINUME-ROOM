import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const statusTones = {
  Borrador: '#7a8597',
  Asignada: '#0b5fff',
  'En Progreso': '#d18616',
  Entregada: '#1f8ad6',
  'En Validacion': '#0f65c9',
  Evaluada: '#138a63',
  Rechazada: '#c53f3f',
  Vencida: '#8d1f1f'
};

const getGreeting = (t) => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return t('greetingMorning');
  }

  if (hour < 19) {
    return t('greetingAfternoon');
  }

  return t('greetingNight');
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [metricsResponse, pipelineResponse, commissionsResponse, assignmentsResponse] = await Promise.all([
        api.get('/api/dashboard/metrics'),
        api.get('/api/dashboard/pipeline'),
        api.get('/api/commissions'),
        api.get('/api/assignments')
      ]);

      if (mounted) {
        setMetrics(metricsResponse.data);
        setPipeline(pipelineResponse.data);
        setCommissions(commissionsResponse.data);
        setAssignments(assignmentsResponse.data);
        setError('');
        setLoading(false);
      }
    };

    loadData().catch(() => {
      setError('No se pudo cargar el panel. Verifica que el backend esté activo en http://localhost:3001.');
      setLoading(false);
    });
    const interval = setInterval(() => {
      loadData().catch(() => null);
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const upcomingAssignments = useMemo(() => (
    [...assignments]
      .filter((assignment) => assignment.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  ), [assignments]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="pill dashboard-kicker">{t('academicCenter')}</span>
          <h1>{getGreeting(t)}, {user?.fullName?.split(' ')[0] || 'delegado'}</h1>
          <p>{t('dashboardCopy')}</p>
        </div>
        <Link className="btn btn-primary" to="/room/assignments">{t('tasks')}</Link>
      </section>

      {error ? (
        <section className="empty-card" style={{ borderColor: 'rgba(197,63,63,0.28)', color: 'var(--danger)' }}>
          {error}
        </section>
      ) : null}

      <section className="dashboard-metrics">
        <StatCard label={t('visibleCommissions')} value={commissions.length} tone="#0b5fff" helper="MINUME ROOM" />
        <StatCard label={t('activeTasks')} value={metrics?.activeTasks || 0} tone="var(--accent)" helper="Classwork" />
        <StatCard label={t('deliveryRate')} value={`${metrics?.deliveryRate || 0}%`} tone="var(--success)" helper="Submissions" />
        <StatCard label={t('pendingAlerts')} value={metrics?.unreadAlerts || 0} tone="#0f65c9" helper="Room updates" />
      </section>

      <section className="dashboard-grid">
        <article className="glass-card classroom-panel">
          <div className="page-heading">
            <div>
              <h1 style={{ fontSize: '1.7rem' }}>{t('taskRhythm')}</h1>
              <p>Estado general del trabajo académico de tus comisiones.</p>
            </div>
          </div>

          <div className="status-grid" style={{ marginTop: '1.25rem' }}>
            {Object.entries(pipeline || {}).map(([status, count]) => (
              <article className="status-tile" key={status}>
                <p>{status === 'En Validacion' ? 'En Validación' : status}</p>
                <strong style={{ color: statusTones[status] }}>{count}</strong>
              </article>
            ))}
          </div>
        </article>

        <article className="glass-card classroom-panel">
          <div className="page-heading">
            <div>
              <h1 style={{ fontSize: '1.7rem' }}>{t('upcomingAgenda')}</h1>
              <p>Fechas de entrega ordenadas por prioridad.</p>
            </div>
          </div>

          <div className="agenda-list">
            {upcomingAssignments.length ? upcomingAssignments.map((assignment) => (
              <Link key={assignment.id} to={`/room/assignments/${assignment.id}`} className="agenda-item">
                <span>{new Date(assignment.deadline).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</span>
                <div>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.commission_name || 'Aula general'}</p>
                </div>
              </Link>
            )) : (
              <div className="empty-card">No hay fechas próximas registradas.</div>
            )}
          </div>
        </article>
      </section>

      <section className="glass-card classroom-panel">
        <div className="page-heading">
          <div>
            <h1 style={{ fontSize: '1.7rem' }}>{t('recentAssignments')}</h1>
            <p>Acceso directo a las tareas publicadas, su rúbrica y su estado de entrega.</p>
          </div>
          <Link className="btn btn-primary" to="/room/assignments">{t('viewAll')}</Link>
        </div>

        <div className="dashboard-task-list">
          {assignments.slice(0, 6).map((assignment) => (
            <Link key={assignment.id} to={`/room/assignments/${assignment.id}`} className="task-card">
              <div>
                <div className="eyebrow">{assignment.commission_name || 'Aula general'}</div>
                <strong>{assignment.title}</strong>
                <p>{assignment.objective}</p>
              </div>
              <div className="task-card__meta">
                <span>{assignment.status === 'En Validacion' ? 'En Validación' : assignment.status}</span>
                <span>{new Date(assignment.deadline).toLocaleDateString('es-DO')}</span>
              </div>
            </Link>
          ))}
          {!assignments.length ? (
            <div className="empty-card">Aún no hay asignaciones publicadas para tu cuenta.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
