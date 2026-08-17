import React from 'react';

const StatCard = ({ label, value, tone, helper }) => (
  <article
    className="glass-card"
    style={{
      borderRadius: '24px',
      padding: '1.35rem',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 'auto -20px -25px auto',
        width: 96,
        height: 96,
        borderRadius: '999px',
        background: tone,
        opacity: 0.12
      }}
    />
    <p style={{ margin: 0, color: 'var(--muted)', fontWeight: 600 }}>{label}</p>
    <p style={{ margin: '0.6rem 0 0', fontSize: '2rem', fontWeight: 800, color: tone }}>{value}</p>
    {helper ? <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>{helper}</p> : null}
  </article>
);

export default StatCard;
