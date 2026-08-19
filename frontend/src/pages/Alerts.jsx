import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import api from '../services/api';

const severityPill = {
  info: 'pill-blue',
  warning: 'pill-warning',
  critical: 'pill-danger'
};

const severityLabel = {
  info: 'Informativo',
  warning: 'Atención',
  critical: 'Crítico'
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/alerts')
      .then((response) => setAlerts(Array.isArray(response.data) ? response.data : []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const unread = useMemo(() => alerts.filter((alert) => !alert.is_read).length, [alerts]);

  const markAsRead = async (id) => {
    await api.patch(`/api/alerts/${id}/read`);
    setAlerts((current) => current.map((alert) => (
      alert.id === id ? { ...alert, is_read: true } : alert
    )));
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
            <Icon name="inbox" size={14} />
            Bandeja de notificaciones
          </span>
          <h1>Avisos</h1>
          <p>
            Centro de eventos operativos del aula. Revisa el historial reciente y marca los avisos como leídos.
          </p>
        </div>
        <div className="page-heading__actions">
          <span className="pill">{unread} sin leer</span>
        </div>
      </section>

      <section className="alerts-list">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className={`alert-card ${alert.is_read ? 'is-read' : ''}`}
            data-severity={alert.severity}
          >
            <div className="alert-card__body">
              <div className="alert-card__head">
                <span className="alert-card__code">{alert.code}</span>
                <span className={`pill ${severityPill[alert.severity] || 'pill-blue'}`}>
                  {severityLabel[alert.severity] || alert.severity}
                </span>
                {alert.is_read ? <span className="pill">Leído</span> : null}
              </div>

              <p>{alert.message}</p>

              <span className="alert-card__time">
                <Icon name="clock" />
                {new Date(alert.created_at).toLocaleString('es-DO')}
              </span>
            </div>

            {!alert.is_read ? (
              <button type="button" className="btn btn-muted btn-sm" onClick={() => markAsRead(alert.id)}>
                <Icon name="check" />
                Marcar leído
              </button>
            ) : null}
          </article>
        ))}

        {!alerts.length ? (
          <div className="empty-card">
            <Icon name="inbox" />
            <strong>No hay avisos por ahora</strong>
            <span>Cuando ocurra un evento en tus comisiones, aparecerá aquí.</span>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default Alerts;
