import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const statusTones = {
  Borrador: 'var(--muted)',
  Asignada: 'var(--primary)',
  'En Progreso': 'var(--warning)',
  Entregada: 'var(--accent)',
  'En Validacion': 'var(--primary)',
  Evaluada: 'var(--success)',
  Rechazada: 'var(--danger)',
  Vencida: 'var(--danger)'
};

const normalizeStatus = (status) => (status === 'En Validacion' ? 'En Validación' : status);

// La API puede devolver un error o una respuesta intermedia del proxy:
// nunca confiamos en que la respuesta sea el arreglo esperado.
const toList = (value) => (Array.isArray(value) ? value : []);

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
  const { t, language } = useLanguage();
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
        setCommissions(toList(commissionsResponse.data));
        setAssignments(toList(assignmentsResponse.data));
        setError('');
        setLoading(false);
      }
    };

    loadData().catch(() => {
      if (mounted) {
        setError(t('loadError'));
        setLoading(false);
      }
    });

    const interval = setInterval(() => {
      loadData().catch(() => null);
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingAssignments = useMemo(() => (
    [...assignments]
      .filter((assignment) => assignment.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  ), [assignments]);

  const locale = language === 'en' ? 'en-US' : 'es-DO';

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
          <span className="pill dashboard-kicker">
            <Icon name="sparkles" size={14} />
            {t('academicCenter')}
          </span>
          <h1>{getGreeting(t)}, {user?.fullName?.split(' ')[0] || 'delegado'}</h1>
          <p>{t('dashboardCopy')}</p>

          <div className="hero-meta">
            <span>
              <Icon name="users" />
              {commissions.length} {t('commissions').toLowerCase()}
            </span>
            <span>
              <Icon name="tasks" />
              {metrics?.activeTasks || 0} {t('activeTasks').toLowerCase()}
            </span>
            <span>
              <Icon name="clock" />
              {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="btn btn-primary" to="/room/assignments">
            <Icon name="tasks" />
            {t('tasks')}
          </Link>
          <Link className="btn btn-muted" to="/room/commissions">
            <Icon name="users" />
            {t('commissions')}
          </Link>
        </div>
      </section>

      {error ? (
        <section className="notice" role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </section>
      ) : null}

      <section className="dashboard-metrics">
        <StatCard label={t('visibleCommissions')} value={commissions.length} tone="var(--primary)" helper="MINUME ROOM" icon="users" />
        <StatCard label={t('activeTasks')} value={metrics?.activeTasks || 0} tone="var(--accent)" helper="Classwork" icon="tasks" />
        <StatCard label={t('deliveryRate')} value={`${metrics?.deliveryRate || 0}%`} tone="var(--success)" helper="Submissions" icon="trendUp" />
        <StatCard label={t('pendingAlerts')} value={metrics?.unreadAlerts || 0} tone="var(--warning)" helper="Room updates" icon="bell" />
      </section>

      <section className="split-grid split-grid--wide-first">
        <article className="glass-card classroom-panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="panel-head__icon"><Icon name="layers" /></span>
              <div>
                <h2>{t('taskRhythm')}</h2>
                <p>{t('pipelineCopy')}</p>
              </div>
            </div>
          </div>

          <div className="status-grid">
            {Object.entries(pipeline || {}).map(([status, count]) => (
              <article className="status-tile" key={status}>
                <p>{normalizeStatus(status)}</p>
                <strong style={{ color: statusTones[status] || 'var(--text)' }}>{count}</strong>
              </article>
            ))}
            {!pipeline || !Object.keys(pipeline).length ? (
              <div className="empty-card">
                <Icon name="layers" />
                <strong>{t('noAssignments')}</strong>
              </div>
            ) : null}
          </div>
        </article>

        <article className="glass-card classroom-panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="panel-head__icon"><Icon name="calendar" /></span>
              <div>
                <h2>{t('upcomingAgenda')}</h2>
                <p>{t('agendaCopy')}</p>
              </div>
            </div>
          </div>

          <div className="agenda-list">
            {upcomingAssignments.length ? upcomingAssignments.map((assignment) => (
              <Link key={assignment.id} to={`/room/assignments/${assignment.id}`} className="agenda-item">
                <span>
                  {new Date(assignment.deadline).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                </span>
                <div>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.commission_name || t('generalRoom')}</p>
                </div>
                <span className="agenda-item__chevron"><Icon name="chevronRight" /></span>
              </Link>
            )) : (
              <div className="empty-card">
                <Icon name="calendar" />
                <strong>{t('noUpcoming')}</strong>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="glass-card classroom-panel">
        <div className="panel-head">
          <div className="panel-title">
            <span className="panel-head__icon"><Icon name="tasks" /></span>
            <div>
              <h2>{t('recentAssignments')}</h2>
              <p>{t('recentCopy')}</p>
            </div>
          </div>
          <Link className="btn btn-muted btn-sm" to="/room/assignments">
            {t('viewAll')}
            <Icon name="arrowRight" />
          </Link>
        </div>

        <div className="dashboard-task-list">
          {assignments.slice(0, 6).map((assignment) => (
            <Link key={assignment.id} to={`/room/assignments/${assignment.id}`} className="task-card">
              <div>
                <span className="eyebrow">{assignment.commission_name || t('generalRoom')}</span>
                <strong>{assignment.title}</strong>
                <p>{assignment.objective}</p>
              </div>
              <div className="task-card__meta">
                <span className="status-chip" data-status={assignment.status}>
                  {normalizeStatus(assignment.status)}
                </span>
                <span>
                  {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString(locale) : '—'}
                </span>
              </div>
            </Link>
          ))}
          {!assignments.length ? (
            <div className="empty-card">
              <Icon name="tasks" />
              <strong>{t('noAssignments')}</strong>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
