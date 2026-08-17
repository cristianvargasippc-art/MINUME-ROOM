import React, { useEffect, useState } from 'react';
import api from '../services/api';

const severityStyles = {
  info: { background: 'rgba(11, 95, 255, 0.08)', color: '#1147ad', border: 'rgba(11,95,255,0.16)' },
  warning: { background: 'rgba(209, 134, 22, 0.09)', color: '#9f5d0d', border: 'rgba(209,134,22,0.18)' },
  critical: { background: 'rgba(197, 63, 63, 0.1)', color: '#aa2d2d', border: 'rgba(197,63,63,0.18)' }
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/api/alerts').then((response) => setAlerts(response.data));
  }, []);

  const markAsRead = async (id) => {
    await api.patch(`/api/alerts/${id}/read`);
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, is_read: true } : alert))
    );
  };

  return (
    <div style={{ display: 'grid', gap: '1.4rem' }}>
      <section className="page-heading">
        <div>
          <span className="pill" style={{ background: 'rgba(197,63,63,0.09)', color: 'var(--danger)' }}>
            Bandeja de notificaciones
          </span>
          <h1>Alertas</h1>
          <p>Centro de eventos operativos. Puedes revisar el historial reciente y marcar avisos como leidos.</p>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="glass-card"
            style={{
              borderRadius: '24px',
              padding: '1.35rem',
              opacity: alert.is_read ? 0.62 : 1,
              border: `1px solid ${severityStyles[alert.severity]?.border}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800 }}>{alert.code}</span>
                  <span className="pill" style={severityStyles[alert.severity]}>
                    {alert.severity}
                  </span>
                  {alert.is_read ? <span className="pill" style={{ background: 'rgba(19,34,56,0.08)', color: 'var(--muted)' }}>Leida</span> : null}
                </div>
                <p style={{ margin: '0.85rem 0 0', lineHeight: 1.7 }}>{alert.message}</p>
                <p style={{ margin: '0.55rem 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                  {new Date(alert.created_at).toLocaleString('es-DO')}
                </p>
              </div>

              {!alert.is_read && (
                <button type="button" className="btn btn-primary" onClick={() => markAsRead(alert.id)}>
                  Marcar leida
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Alerts;
