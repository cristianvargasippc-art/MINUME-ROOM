import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const assignmentInitial = {
  title: '',
  type: 'TAS-01',
  description: '',
  objective: '',
  expectedProduct: 'PDF',
  deadline: '',
  commissionId: '',
  evaluationCriteria: ''
};

const rubricInitial = [
  { criterio: 'Dominio del contenido', descripcion: 'Responde con precisión al objetivo de la asignación.', puntos: 30 },
  { criterio: 'Argumentación', descripcion: 'Presenta ideas claras, sustentadas y coherentes.', puntos: 25 },
  { criterio: 'Formato y evidencias', descripcion: 'Entrega el producto esperado con soporte verificable.', puntos: 20 },
  { criterio: 'Puntualidad', descripcion: 'Respeta la fecha límite y las instrucciones de entrega.', puntos: 25 }
];

const normalizeStatus = (status) => (status === 'En Validacion' ? 'En Validación' : status);

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState(assignmentInitial);
  const [rubricRows, setRubricRows] = useState(rubricInitial);
  const [search, setSearch] = useState('');

  const canCreateAssignment = ['secretaria', 'superadmin', 'mesa'].includes(user?.role);
  const rubricTotal = useMemo(
    () => rubricRows.reduce((sum, row) => sum + Number(row.puntos || 0), 0),
    [rubricRows]
  );

  const loadData = async () => {
    const [assignmentsResponse, commissionsResponse] = await Promise.all([
      api.get('/api/assignments'),
      api.get('/api/commissions')
    ]);
    const nextAssignments = Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : [];
    const nextCommissions = Array.isArray(commissionsResponse.data) ? commissionsResponse.data : [];

    setAssignments(nextAssignments);
    setCommissions(nextCommissions);
    setAssignmentForm((current) => ({
      ...current,
      commissionId: current.commissionId || nextCommissions[0]?.id || ''
    }));
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const visibleAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return assignments;
    }

    return assignments.filter((assignment) => (
      [assignment.title, assignment.commission_name, assignment.assignment_id, assignment.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    ));
  }, [assignments, search]);

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

  const submitAssignment = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      await api.post('/api/assignments', {
        ...assignmentForm,
        commissionId: Number(assignmentForm.commissionId),
        evaluationCriteria: JSON.stringify({
          instructions: assignmentForm.evaluationCriteria,
          rubric: rubricRows
        })
      });
      toast.success('Asignación publicada correctamente');
      setAssignmentForm({ ...assignmentInitial, commissionId: commissions[0]?.id || '' });
      setRubricRows(rubricInitial);
      setShowCreate(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo crear la asignación');
    } finally {
      setCreating(false);
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
    <div className="assignments-page">
      <section className="page-heading">
        <div>
          <span className="pill pill-blue">
            <Icon name="tasks" size={14} />
            Trabajo de clase
          </span>
          <h1>Asignaciones</h1>
          <p>Consulta tareas, revisa rúbricas, entrega documentos y publica nuevas asignaciones para las comisiones.</p>
        </div>
        {canCreateAssignment ? (
          <div className="page-heading__actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate((value) => !value)}>
              <Icon name={showCreate ? 'close' : 'plus'} />
              {showCreate ? 'Cerrar formulario' : 'Nueva asignación'}
            </button>
          </div>
        ) : null}
      </section>

      {showCreate && canCreateAssignment ? (
        <section className="glass-card classroom-panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="panel-head__icon"><Icon name="plus" /></span>
              <div>
                <h2>Publicar asignación</h2>
                <p>Define el encargo, la comisión y una rúbrica dinámica con criterios editables.</p>
              </div>
            </div>
            <span className="pill pill-blue">{rubricTotal} puntos</span>
          </div>

          <form className="form-grid assignment-create-form" onSubmit={submitAssignment}>
            <div>
              <label className="label" htmlFor="assignment-title">Título</label>
              <input id="assignment-title" className="input" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="assignment-commission">Comisión</label>
              <select id="assignment-commission" className="input" value={assignmentForm.commissionId} onChange={(event) => setAssignmentForm({ ...assignmentForm, commissionId: event.target.value })} required>
                {commissions.map((commission) => (
                  <option key={commission.id} value={commission.id}>{commission.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assignment-type">Tipo</label>
              <select id="assignment-type" className="input" value={assignmentForm.type} onChange={(event) => setAssignmentForm({ ...assignmentForm, type: event.target.value })}>
                {['TAS-01', 'TAS-02', 'TAS-03', 'TAS-04', 'TAS-05'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assignment-product">Producto esperado</label>
              <select id="assignment-product" className="input" value={assignmentForm.expectedProduct} onChange={(event) => setAssignmentForm({ ...assignmentForm, expectedProduct: event.target.value })}>
                <option value="PDF">PDF</option>
                <option value="Presentacion">Presentación</option>
                <option value="Planilla">Planilla</option>
              </select>
            </div>
            <div className="form-full">
              <label className="label" htmlFor="assignment-description">Descripción</label>
              <textarea id="assignment-description" className="input textarea" value={assignmentForm.description} onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })} required />
            </div>
            <div className="form-full">
              <label className="label" htmlFor="assignment-objective">Objetivo</label>
              <textarea id="assignment-objective" className="input textarea" value={assignmentForm.objective} onChange={(event) => setAssignmentForm({ ...assignmentForm, objective: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="assignment-deadline">Fecha límite</label>
              <input id="assignment-deadline" className="input" type="datetime-local" value={assignmentForm.deadline} onChange={(event) => setAssignmentForm({ ...assignmentForm, deadline: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="assignment-instructions">Instrucciones de evaluación</label>
              <textarea id="assignment-instructions" className="input" value={assignmentForm.evaluationCriteria} onChange={(event) => setAssignmentForm({ ...assignmentForm, evaluationCriteria: event.target.value })} placeholder="Indicaciones generales para la mesa evaluadora" />
            </div>

            <div className="form-full rubric-builder">
              <div className="rubric-builder__head">
                <div>
                  <h2>Rúbrica dinámica</h2>
                  <p>Agrega, elimina y ajusta criterios según la tarea.</p>
                </div>
                <button type="button" className="btn btn-muted btn-sm" onClick={addRubricRow}>
                  <Icon name="plus" />
                  Agregar criterio
                </button>
              </div>

              {rubricRows.map((row, index) => (
                <div className="rubric-row" key={`rubric-${index}`}>
                  <input className="input" value={row.criterio} onChange={(event) => updateRubricRow(index, 'criterio', event.target.value)} placeholder="Criterio" required />
                  <input className="input" value={row.descripcion} onChange={(event) => updateRubricRow(index, 'descripcion', event.target.value)} placeholder="Descripción del criterio" required />
                  <input className="input" type="number" min="1" value={row.puntos} onChange={(event) => updateRubricRow(index, 'puntos', event.target.value)} aria-label={`Puntos del criterio ${index + 1}`} required />
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

              <span className="rubric-total">Total: {rubricTotal} pts</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                <Icon name="check" />
                {creating ? 'Publicando...' : 'Publicar asignación'}
              </button>
              <button type="button" className="btn btn-muted" onClick={() => setShowCreate(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="glass-card classroom-panel">
        <div className="panel-head">
          <div className="panel-title">
            <span className="panel-head__icon"><Icon name="layers" /></span>
            <div>
              <h2>Listado de asignaciones</h2>
              <p>{visibleAssignments.length} de {assignments.length} tareas visibles para tu rol.</p>
            </div>
          </div>
          <div className="panel-head__search">
            <label className="sr-only" htmlFor="assignment-search">Buscar asignación</label>
            <input
              id="assignment-search"
              className="input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, comisión o estado"
            />
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: '1.15rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Comisión</th>
                <th>ID</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Plazo</th>
                <th>Creador</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td data-label="Comisión">
                    <div>
                      <div className="table-primary">{assignment.commission_name || 'Sin comisión'}</div>
                      <div className="table-secondary">{assignment.commission_code || '-'}</div>
                    </div>
                  </td>
                  <td data-label="ID"><strong>{assignment.assignment_id}</strong></td>
                  <td data-label="Título">
                    <div>
                      <div className="table-primary">{assignment.title}</div>
                      <div className="table-secondary">{assignment.objective}</div>
                    </div>
                  </td>
                  <td data-label="Tipo">{assignment.type}</td>
                  <td data-label="Estado">
                    <span className="status-chip" data-status={assignment.status}>
                      {normalizeStatus(assignment.status)}
                    </span>
                  </td>
                  <td data-label="Plazo">
                    {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('es-DO') : '—'}
                  </td>
                  <td data-label="Creador">{assignment.creator_name || 'Sistema'}</td>
                  <td data-label="Acción">
                    <Link to={`/room/assignments/${assignment.id}`} className="table-action">
                      Ver detalle
                      <Icon name="arrowRight" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!visibleAssignments.length ? (
            <div className="empty-card">
              <Icon name="search" />
              <strong>Sin resultados</strong>
              <span>Ajusta la búsqueda o publica una nueva asignación.</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Assignments;
