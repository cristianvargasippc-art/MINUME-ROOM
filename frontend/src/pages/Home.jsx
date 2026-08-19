import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';

const classroomFeatures = [
  ['Tablón académico', 'Actividad reciente, tareas publicadas y accesos rápidos por comisión.', 'layers'],
  ['Entregas al instante', 'Al subir un archivo, el estado queda actualizado para seguimiento inmediato.', 'upload'],
  ['Portal exclusivo', 'Registro con correo y contraseña propios, login seguro y roles por usuario.', 'shield']
];

const meetingFeatures = [
  ['Calendario clickeable', 'Los delegados ven fechas de reunión y entran desde el día programado.', 'calendar'],
  ['Participación', 'Los enlaces quedan disponibles desde el aula para registrar asistencia operativa.', 'users'],
  ['Videos de reunión', 'La mesa directiva puede guardar enlaces de grabación para consulta posterior.', 'video']
];

const previewItems = [
  ['Tareas', 'tasks'],
  ['Foro', 'message'],
  ['Calendario', 'calendar'],
  ['Grabaciones', 'video']
];

const rubricRows = [
  ['Contenido', 30],
  ['Argumentación', 25],
  ['Formato', 20],
  ['Entrega', 25]
];

const Home = () => {
  const { t } = useLanguage();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <main className="home-page">
      <nav className="home-nav">
        <Link className="brand-mark" to="/" onClick={() => setNavOpen(false)}>
          <span className="brand-seal">MR</span>
          <span>
            <strong>MINUME ROOM</strong>
            <small>{t('academicProgram')}</small>
          </span>
        </Link>

        <div className="home-nav__actions">
          <div className={`home-nav__links ${navOpen ? 'is-open' : ''}`} id="menu-portada">
            <a href="#classroom" onClick={() => setNavOpen(false)}>Aula</a>
            <a href="#rubricas" onClick={() => setNavOpen(false)}>Rúbricas</a>
            <a href="#reuniones" onClick={() => setNavOpen(false)}>Reuniones</a>
          </div>

          <Link className="btn btn-primary btn-sm" to="/login">
            {t('enter')}
            <Icon name="arrowRight" />
          </Link>

          <button
            type="button"
            className="icon-btn home-menu-btn"
            onClick={() => setNavOpen((value) => !value)}
            aria-expanded={navOpen}
            aria-controls="menu-portada"
            aria-label={navOpen ? t('closeMenu') : t('openMenu')}
          >
            <Icon name={navOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="pill pill-blue">
            <Icon name="sparkles" size={14} />
            {t('virtualRoom')}
          </span>
          <h1>MINUME ROOM</h1>
          <p>{t('homeCopy')}</p>

          <div className="hero-actions">
            <Link className="btn btn-aurora" to="/login">
              {t('enterOrRegister')}
              <Icon name="arrowRight" />
            </Link>
            <a className="btn btn-soft-accent" href="#classroom">{t('seePlatform')}</a>
          </div>

          <div className="hero-trust">
            <div>
              <strong>5</strong>
              <span>Espacios del aula</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Seguimiento por rúbrica</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Acceso de delegados</span>
            </div>
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
            {previewItems.map(([item, icon]) => (
              <article key={item}>
                <span><Icon name={icon} /></span>
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
          <p>
            Todo el trabajo académico ocurre en un mismo lugar: publicar, entregar, evaluar
            y dar seguimiento sin cambiar de herramienta.
          </p>
        </div>
        <div className="feature-grid">
          {classroomFeatures.map(([title, text, icon]) => (
            <article className="feature-card" key={title}>
              <span className="feature-card__icon"><Icon name={icon} /></span>
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
          {rubricRows.map(([item, points], index) => (
            <div key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item}</strong>
              <small>{points} pts</small>
            </div>
          ))}
        </div>
      </section>

      <section id="reuniones" className="home-section">
        <div>
          <span className="eyebrow">Meet, Zoom y Teams</span>
          <h2>{t('meetingsHeadline')}</h2>
          <p>
            El calendario de la comisión concentra los enlaces de reunión y las grabaciones,
            listos para entrar el día programado.
          </p>
        </div>
        <div className="feature-grid">
          {meetingFeatures.map(([title, text, icon]) => (
            <article className="feature-card" key={title}>
              <span className="feature-card__icon"><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <span className="pill pill-onbrand">
          <Icon name="award" size={14} />
          MINUME XVII
        </span>
        <h2>Tu aula del modelo, lista para trabajar</h2>
        <p>
          Entra con tu correo institucional y accede a comisiones, tareas, rúbricas y calificaciones
          desde cualquier dispositivo.
        </p>
        <Link className="btn btn-aurora" to="/login">
          {t('enterOrRegister')}
          <Icon name="arrowRight" />
        </Link>
      </section>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} MINUME ROOM · Modelo de Naciones Unidas</span>
        <Link className="auth-back" to="/login">
          {t('enter')}
          <Icon name="arrowRight" />
        </Link>
      </footer>
    </main>
  );
};

export default Home;
