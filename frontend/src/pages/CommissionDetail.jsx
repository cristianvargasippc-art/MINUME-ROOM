import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const tabs = [
  { id: 'Resumen', icon: 'layers' },
  { id: 'Tareas', icon: 'tasks' },
  { id: 'Calendario', icon: 'calendar' },
  { id: 'Foro', icon: 'message' },
  { id: 'Personas', icon: 'users' }
];

const assignmentFormInitial = {
  title: '',
  type: 'TAS-01',
  description: '',
  objective: '',
  expectedProduct: 'PDF',
  deadline: '',
  evaluationCriteria: ''
};

const rubricInitial = [
  { criterio: 'Dominio del contenido', descripcion: 'Responde con precisión al objetivo de la asignación.', puntos: 30 },
  { criterio: 'Argumentación', descripcion: 'Presenta ideas claras, sustentadas y coherentes.', puntos: 25 },
  { criterio: 'Formato y evidencias', descripcion: 'Entrega el producto esperado con soporte verificable.', puntos: 20 },
  { criterio: 'Puntualidad', descripcion: 'Respeta la fecha límite y las instrucciones de entrega.', puntos: 25 }
];

const eventInitial = {
  title: '',
  date: '',
  platform: 'Google Meet',
  link: '',
  recording: ''
};

const forumInitial = {
  title: '',
  body: ''
};

const personFormInitial = {
  fullName: '',
  email: '',
  role: 'delegado'
};

const CommissionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Resumen');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignmentForm, setAssignmentForm] = useState(assignmentFormInitial);
  const [personForm, setPersonForm] = useState(personFormInitial);
  const [newCredential, setNewCredential] = useState(null);
  const [rubricRows, setRubricRows] = useState(rubricInitial);
  const [eventForm, setEventForm] = useState(eventInitial);
  const [forumForm, setForumForm] = useState(forumInitial);
  const [roomEvents, setRoomEvents] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);

  const canCreateTask = ['superadmin', 'secretaria', 'mesa'].includes(user?.role);
  const canManagePeople = ['superadmin', 'secretaria', 'mesa'].includes(user?.role);

  const loadCommission = useCallback(async () => {
    const response = await api.get(`/api/commissions/${id}`);
    setPayload(response.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadCommission().catch(() => setLoading(false));
  }, [loadCommission]);

  useEffect(() => {
    const savedEvents = localStorage.getItem(`minume-room-events-${id}`);
    const savedPosts = localStorage.getItem(`minume-room-forum-${id}`);
    setRoomEvents(savedEvents ? JSON.parse(savedEvents) : []);
    setForumPosts(savedPosts ? JSON.parse(savedPosts) : []);
  }, [id]);

  const groupedPeople = useMemo(() => ({
    mesa: payload?.people?.filter((person) => person.role === 'mesa') || [],
    delegado: payload?.people?.filter((person) => person.role === 'delegado') || []
  }), [payload]);

  const submitAssignment = async (event) => {
    event.preventDefault();

    try {
      await api.post('/api/assignments', {
        ...assignmentForm,
        evaluationCriteria: JSON.stringify({
          instructions: assignmentForm.evaluationCriteria,
          rubric: rubricRows
        }),
        commissionId: Number(id)
      });
      toast.success('Tarea publicada en la comisión');
      setAssignmentForm(assignmentFormInitial);
      setRubricRows(rubricInitial);
      loadCommission();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo crear la tarea');
    }
  };

  const updateRubricRow = (index, field, value) => {
    setRubricRows((rows) => rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: field === 'puntos' ? Number(value) : value } : row
    )));
  };

  const addRubricRow = () => {
    setRubricRows((rows) => [...rows, { criterio: '', descripcion: '', puntos: 10 }]);
  };

  const removeRubricRow = (index) => {
    setRubricRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const submitEvent = (event) => {
    event.preventDefault();
    const nextEvents = [
      ...roomEvents,
      { ...eventForm, id: Date.now(), createdBy: user?.fullName || 'Mesa Directiva' }
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(`minume-room-events-${id}`, JSON.stringify(nextEvents));
    setRoomEvents(nextEvents);
    setEventForm(eventInitial);
    toast.success('Reunión agregada al calendario');
  };

  const submitForumPost = (event) => {
    event.preventDefault();
    const nextPosts = [
      { ...forumForm, id: Date.now(), author: user?.fullName || 'Usuario', createdAt: new Date().toISOString() },
      ...forumPosts
    ];
    localStorage.setItem(`minume-room-forum-${id}`, JSON.stringify(nextPosts));
    setForumPosts(nextPosts);
    setForumForm(forumInitial);
    toast.success('Publicación creada en el foro');
  };

  const submitPerson = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post(`/api/commissions/${id}/people`, personForm);
    
      setNewCredential({ email: response.data.email, password: response.data.temporaryPassword });
      toast.success('Integrante agregada. Copia su contraseña temporal.');
      setPersonForm(personFormInitial);
      loadCommission();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo agregar la integrante');
    }
  };

  if (loading || !payload) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const { commission, assignments, recentActivity } = payload;

  return (
    <div className="page-stack">
      <section className="classroom-banner">
        <div>
          <span className="pill pill-onbrand">{commission.code}</span>
          <h1>{commission.name}</h1>
          <p>{commission.description}</p>
        </div>
        <div className="classroom-banner__meta">
          <span><Icon name="building" />{commission.section}</span>
          <span><Icon name="users" />{commission.members_count} integrantes</span>
          <span><Icon name="tasks" />{commission.assignments_count} tareas</span>
        </div>
      </section>

      <section className="tab-strip">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            <Icon name={tab.icon} />
            {tab.id}
          </button>
        ))}
      </section>

      {activeTab === 'Resumen' ? (
        <div className="split-grid split-grid--wide-first">
          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Actividad reciente</h2>
                <p>Tablón principal del aula: tareas nuevas, avisos y pulso de la comisión.</p>
              </div>
            </div>

            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              {recentActivity.length ? recentActivity.map((item) => (
                <article key={`${item.item_type}-${item.item_id}`} className="feed-item">
                  <div>
                    <div className="eyebrow">Nueva tarea</div>
                    <strong>{item.title}</strong>
                    <p>{item.status}</p>
                  </div>
                  <span>{new Date(item.created_at).toLocaleDateString('es-DO')}</span>
                </article>
              )) : (
                <div className="empty-card">Todavía no hay actividad reciente en esta comisión.</div>
              )}
            </div>
          </section>

          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Accesos rápidos</h2>
                <p>Salta directo a miembros o al tablero global.</p>
              </div>
            </div>

            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              <Link to="/room/dashboard" className="quick-link-card">
                Volver al panel general
                <Icon name="arrowRight" />
              </Link>
              <button type="button" className="quick-link-card" onClick={() => setActiveTab('Tareas')}>
                Ir a tareas
                <Icon name="tasks" />
              </button>
              <button type="button" className="quick-link-card" onClick={() => setActiveTab('Calendario')}>
                Ver calendario y reuniones
                <Icon name="calendar" />
              </button>
              <button type="button" className="quick-link-card" onClick={() => setActiveTab('Foro')}>
                Abrir foro
                <Icon name="message" />
              </button>
              <button type="button" className="quick-link-card" onClick={() => setActiveTab('Personas')}>
                Ir a personas
                <Icon name="users" />
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'Tareas' ? (
        <div className="split-grid split-grid--wide-first">
          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Trabajo de clase</h2>
                <p>Tareas, materiales y rúbricas publicadas dentro de este espacio.</p>
              </div>
            </div>

            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              {assignments.length ? assignments.map((assignment) => (
                <Link key={assignment.id} to={`/room/assignments/${assignment.id}`} className="task-card">
                  <div>
                    <div className="eyebrow">{assignment.type}</div>
                    <strong>{assignment.title}</strong>
                    <p>{assignment.objective}</p>
                  </div>
                  <div className="task-card__meta">
                    <span className="status-chip" data-status={assignment.status}>
                      {assignment.status === 'En Validacion' ? 'En Validacion' : assignment.status}
                    </span>
                    <span>{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('es-DO') : '-'}</span>
                  </div>
                </Link>
              )) : (
                <div className="empty-card">Aún no hay tareas publicadas en esta comisión.</div>
              )}
            </div>
          </section>

          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Publicar tarea</h2>
                <p>Disponible para superadmin, secretaría y mesa responsable.</p>
              </div>
            </div>

            {canCreateTask ? (
              <form className="form-grid" onSubmit={submitAssignment}>
                <div>
                  <label className="label" htmlFor="task-title">Título</label>
                  <input id="task-title" className="input" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="task-type">Tipo</label>
                  <select id="task-type" className="input" value={assignmentForm.type} onChange={(event) => setAssignmentForm({ ...assignmentForm, type: event.target.value })}>
                    <option value="TAS-01">TAS-01</option>
                    <option value="TAS-02">TAS-02</option>
                    <option value="TAS-03">TAS-03</option>
                    <option value="TAS-04">TAS-04</option>
                    <option value="TAS-05">TAS-05</option>
                  </select>
                </div>
                <div className="form-full">
                  <label className="label" htmlFor="task-description">Descripción</label>
                  <textarea id="task-description" className="input textarea" value={assignmentForm.description} onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })} required />
                </div>
                <div className="form-full">
                  <label className="label" htmlFor="task-objective">Objetivo</label>
                  <textarea id="task-objective" className="input textarea" value={assignmentForm.objective} onChange={(event) => setAssignmentForm({ ...assignmentForm, objective: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="task-product">Producto esperado</label>
                  <select id="task-product" className="input" value={assignmentForm.expectedProduct} onChange={(event) => setAssignmentForm({ ...assignmentForm, expectedProduct: event.target.value })}>
                    <option value="PDF">PDF</option>
                    <option value="Presentacion">Presentación</option>
                    <option value="Planilla">Planilla</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="task-deadline">Fecha límite</label>
                  <input id="task-deadline" className="input" type="datetime-local" value={assignmentForm.deadline} onChange={(event) => setAssignmentForm({ ...assignmentForm, deadline: event.target.value })} required />
                </div>
                <div className="form-full">
                  <label className="label" htmlFor="task-criteria">Instrucciones de evaluación</label>
                  <textarea id="task-criteria" className="input textarea" value={assignmentForm.evaluationCriteria} onChange={(event) => setAssignmentForm({ ...assignmentForm, evaluationCriteria: event.target.value })} placeholder="Instrucciones generales adicionales para la evaluación" />
                </div>
                <div className="form-full rubric-builder">
                  <div className="rubric-builder__head">
                    <div>
                      <h2>Rúbrica dinámica</h2>
                      <p>Define criterios, descripciones y cuánto vale cada parte de la tarea.</p>
                    </div>
                    <button type="button" className="btn btn-muted btn-sm" onClick={addRubricRow}>
                      <Icon name="plus" />
                      Agregar criterio
                    </button>
                  </div>
                  {rubricRows.map((row, index) => (
                    <div className="rubric-row" key={`${row.criterio}-${index}`}>
                      <input className="input" value={row.criterio} onChange={(event) => updateRubricRow(index, 'criterio', event.target.value)} placeholder="Criterio" required />
                      <input className="input" value={row.descripcion} onChange={(event) => updateRubricRow(index, 'descripcion', event.target.value)} placeholder="Descripción del criterio" required />
                      <input className="input" type="number" min="1" value={row.puntos} onChange={(event) => updateRubricRow(index, 'puntos', event.target.value)} aria-label="Puntos" required />
                      <button
                        type="button"
                        className="btn btn-muted btn-sm"
                        onClick={() => removeRubricRow(index)}
                        disabled={rubricRows.length === 1}
                        aria-label={`Quitar criterio ${index + 1}`}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  ))}
                  <span className="rubric-total">Total: {rubricRows.reduce((sum, row) => sum + Number(row.puntos || 0), 0)} pts</span>
                </div>
                <div className="form-actions"><button type="submit" className="btn btn-primary"><Icon name="check" />Publicar tarea</button></div>
              </form>
            ) : (
              <div className="empty-card">Tu rol solo puede consultar el trabajo de clase de la comisión.</div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === 'Calendario' ? (
        <div className="split-grid split-grid--wide-first">
          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Calendario de reuniones</h2>
                <p>Enlaces de Google Meet, Zoom o Teams para que los delegados entren desde el día programado.</p>
              </div>
            </div>
            <div className="calendar-grid" style={{ marginTop: '1rem' }}>
              {roomEvents.length ? roomEvents.map((item) => (
                <article className="calendar-item" key={item.id}>
                  <div className="calendar-date">
                    <strong>{new Date(item.date).toLocaleDateString('es-DO', { day: '2-digit' })}</strong>
                    <span>{new Date(item.date).toLocaleDateString('es-DO', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.platform} - {new Date(item.date).toLocaleString('es-DO')}</p>
                    <div className="meeting-actions">
                      <a className="btn btn-primary btn-sm" href={item.link} target="_blank" rel="noreferrer">
                        <Icon name="video" />
                        Entrar a reunión
                      </a>
                      {item.recording ? (
                        <a className="btn btn-muted btn-sm" href={item.recording} target="_blank" rel="noreferrer">
                          <Icon name="link" />
                          Ver grabación
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              )) : (
                <div className="empty-card">Aún no hay reuniones programadas para esta comisión.</div>
              )}
            </div>
          </section>

          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Crear reunión</h2>
                <p>La mesa directiva puede agregar enlaces y videos de grabación.</p>
              </div>
            </div>
            {canCreateTask ? (
              <form className="form-grid" onSubmit={submitEvent}>
                <div className="form-full">
                  <label className="label" htmlFor="meeting-title">Título</label>
                  <input id="meeting-title" className="input" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="meeting-date">Fecha y hora</label>
                  <input id="meeting-date" className="input" type="datetime-local" value={eventForm.date} onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="meeting-platform">Plataforma</label>
                  <select id="meeting-platform" className="input" value={eventForm.platform} onChange={(event) => setEventForm({ ...eventForm, platform: event.target.value })}>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                  </select>
                </div>
                <div className="form-full">
                  <label className="label" htmlFor="meeting-link">Enlace de reunión</label>
                  <input id="meeting-link" className="input" type="url" value={eventForm.link} onChange={(event) => setEventForm({ ...eventForm, link: event.target.value })} required />
                </div>
                <div className="form-full">
                  <label className="label" htmlFor="meeting-recording">Video de grabación</label>
                  <input id="meeting-recording" className="input" type="url" value={eventForm.recording} onChange={(event) => setEventForm({ ...eventForm, recording: event.target.value })} placeholder="Opcional" />
                </div>
                <div className="form-actions"><button type="submit" className="btn btn-primary"><Icon name="check" />Guardar reunión</button></div>
              </form>
            ) : (
              <div className="empty-card">Tu rol puede visualizar reuniones y abrir enlaces disponibles.</div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === 'Foro' ? (
        <div className="split-grid split-grid--wide-last">
          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Nuevo tema</h2>
                <p>Espacio profesional para dudas, acuerdos y avisos de la comisión.</p>
              </div>
            </div>
            <form onSubmit={submitForumPost} className="stack" style={{ marginTop: '1.15rem' }}>
              <div>
                <label className="label" htmlFor="forum-title">Título</label>
                <input id="forum-title" className="input" value={forumForm.title} onChange={(event) => setForumForm({ ...forumForm, title: event.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="forum-body">Mensaje</label>
                <textarea id="forum-body" className="input textarea" value={forumForm.body} onChange={(event) => setForumForm({ ...forumForm, body: event.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary"><Icon name="message" />Publicar en foro</button>
            </form>
          </section>

          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Foro de aula</h2>
                <p>Conversaciones guardadas para la comisión actual.</p>
              </div>
            </div>
            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              {forumPosts.length ? forumPosts.map((post) => (
                <article className="forum-post" key={post.id}>
                  <div>
                    <strong>{post.title}</strong>
                    <span>{post.author} - {new Date(post.createdAt).toLocaleString('es-DO')}</span>
                  </div>
                  <p>{post.body}</p>
                </article>
              )) : (
                <div className="empty-card">Todavía no hay publicaciones en el foro.</div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'Personas' ? (
        <div className="split-grid split-grid--even">
          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Mesa directiva</h2>
                <p>Responsables del aula y su coordinación.</p>
              </div>
            </div>

            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              {groupedPeople.mesa.map((person) => (
                <article key={person.id} className="person-card">
                  <strong>{person.full_name}</strong>
                  <p>{person.email}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-card classroom-panel">
            <div className="panel-head">
              <div>
                <h2>Delegadas e integrantes</h2>
                <p>Miembros vinculados a la comisión.</p>
              </div>
            </div>

            <div className="stack-sm" style={{ marginTop: '1.15rem' }}>
              {groupedPeople.delegado.map((person) => (
                <article key={person.id} className="person-card">
                  <strong>{person.full_name}</strong>
                  <p>{person.email}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-card classroom-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-head">
              <div>
                <h2>Agregar integrante</h2>
                <p>Al crear la cuenta se genera una contraseña temporal única. Se muestra una sola vez: cópiala y entrégasela a su titular.</p>
              </div>
            </div>

            {newCredential ? (
              <div className="credential-card">
                <strong>Contraseña temporal de {newCredential.email}</strong>
                <code>{newCredential.password}</code>
                <p className="field-hint">
                  Anótala ahora: no se puede volver a consultar. Pídele que la cambie al entrar.
                </p>
                <div>
                  <button type="button" className="btn btn-muted btn-sm" onClick={() => setNewCredential(null)}>
                    <Icon name="check" />
                    Ya la copié
                  </button>
                </div>
              </div>
            ) : null}

            {canManagePeople ? (
              <form className="form-grid" onSubmit={submitPerson}>
                <div>
                  <label className="label" htmlFor="person-full-name">Nombre completo</label>
                  <input id="person-full-name" className="input" value={personForm.fullName} onChange={(event) => setPersonForm({ ...personForm, fullName: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="person-email">Correo</label>
                  <input id="person-email" className="input" type="email" value={personForm.email} onChange={(event) => setPersonForm({ ...personForm, email: event.target.value })} required />
                </div>
                <div>
                  <label className="label" htmlFor="person-role">Rol</label>
                  <select id="person-role" className="input" value={personForm.role} onChange={(event) => setPersonForm({ ...personForm, role: event.target.value })}>
                    <option value="delegado">Delegado</option>
                    <option value="mesa">Mesa</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary"><Icon name="plus" />Agregar integrante</button>
                </div>
              </form>
            ) : (
              <div className="empty-card">Tu rol solo puede consultar la lista de personas.</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default CommissionDetail;
