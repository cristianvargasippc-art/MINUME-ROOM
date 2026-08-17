import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  return (
  <main className="home-page">
    <nav className="home-nav">
      <Link className="brand-mark" to="/">
        <span className="brand-seal">MR</span>
        <span>
          <strong>MINUME ROOM</strong>
          <small>{t('academicProgram')}</small>
        </span>
      </Link>
      <div className="home-nav__actions">
        <a href="#classroom">Aula</a>
        <a href="#rubricas">Rúbricas</a>
        <a href="#reuniones">Reuniones</a>
        <Link className="btn btn-muted" to="/login">{t('enter')}</Link>
      </div>
    </nav>

    <section className="home-hero">
      <div className="home-hero__copy">
        <span className="pill pill-blue">{t('virtualRoom')}</span>
        <h1>MINUME ROOM</h1>
        <p>{t('homeCopy')}</p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-aurora" to="/login">{t('enterOrRegister')}</Link>
          <a className="btn btn-muted btn-soft-accent" href="#classroom">{t('seePlatform')}</a>
        </div>
      </div>

      <div className="room-preview" aria-label="Vista previa de MINUME ROOM">
        <div className="preview-topbar">
          <span>MINUME XVII</span>
          <strong>Room Control</strong>
        </div>
        <div className="preview-banner">
          <small>Comisión de Educación</small>
          <h2>{t('roomPreview')}</h2>
          <p>{t('roomPreviewText')}</p>
        </div>
        <div className="preview-grid">
          {['Tareas', 'Foro', 'Calendario', 'Grabaciones'].map((item) => (
            <article key={item}>
              <span />
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="classroom" className="home-section">
      <div>
        <span className="eyebrow">{t('allAsRoom')}</span>
        <h2>{t('dashboardHeadline')}</h2>
      </div>
      <div className="feature-grid">
        {[
          ['Tablón académico', 'Actividad reciente, tareas publicadas y accesos rápidos por comisión.'],
          ['Entregas al instante', 'Al subir un archivo, el estado queda actualizado para seguimiento inmediato.'],
          ['Portal exclusivo', 'Registro con correo y contraseña propios, login seguro y roles por usuario.']
        ].map(([title, text]) => (
          <article className="feature-card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>

    <section id="rubricas" className="home-section section-split">
      <div>
        <span className="eyebrow">{t('rubricsAssignments')}</span>
        <h2>{t('rubricHeadline')}</h2>
        <p>
          Cada asignación puede incluir una rúbrica por criterio, valor en puntos, producto esperado,
          fecha límite y descripción completa para que los delegados sepan exactamente cómo serán evaluados.
        </p>
      </div>
      <div className="rubric-preview">
        {['Contenido', 'Argumentación', 'Formato', 'Entrega'].map((item, index) => (
          <div key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item}</strong>
            <small>{[30, 25, 20, 25][index]} pts</small>
          </div>
        ))}
      </div>
    </section>

    <section id="reuniones" className="home-section">
      <div>
        <span className="eyebrow">Meet, Zoom y Teams</span>
        <h2>{t('meetingsHeadline')}</h2>
      </div>
      <div className="feature-grid">
        {[
          ['Calendario clickeable', 'Los delegados ven fechas de reunión y entran desde el día programado.'],
          ['Participación', 'Los enlaces quedan disponibles desde el aula para registrar asistencia operativa.'],
          ['Videos de reunión', 'La mesa directiva puede guardar enlaces de grabación para consulta posterior.']
        ].map(([title, text]) => (
          <article className="feature-card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  </main>
  );
};

export default Home;
