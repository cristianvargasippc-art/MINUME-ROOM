import React from 'react';
import Icon from './Icon';

/**
 * Tarjeta de métrica del panel. `tone` acepta cualquier color CSS y alimenta
 * la variable --stat-tone, que tiñe valor, icono y halo de forma coherente.
 */
const StatCard = ({ label, value, tone = 'var(--primary)', helper, icon = 'chart' }) => (
  <article className="stat-card" style={{ '--stat-tone': tone }}>
    <div className="stat-card__top">
      <p className="stat-card__label">{label}</p>
      <span className="stat-card__icon">
        <Icon name={icon} />
      </span>
    </div>
    <p className="stat-card__value">{value}</p>
    {helper ? <p className="stat-card__helper">{helper}</p> : null}
  </article>
);

export default StatCard;
