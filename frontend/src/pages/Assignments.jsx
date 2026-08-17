import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusStyles = {
  Borrador: { background: 'rgba(122, 133, 151, 0.14)', color: '#7a8597' },
  Asignada: { background: 'rgba(11, 95, 255, 0.14)', color: '#0b5fff' },
  'En Progreso': { background: 'rgba(209, 134, 22, 0.14)', color: '#d18616' },
  Entregada: { background: 'rgba(31, 138, 214, 0.16)', color: '#1f8ad6' },
  'En Validacion': { background: 'rgba(15, 101, 201, 0.14)', color: '#0f65c9' },
  Evaluada: { background: 'rgba(19, 138, 99, 0.14)', color: '#138a63' },
  Rechazada: { background: 'rgba(197, 63, 63, 0.14)', color: '#c53f3f' },
  Vencida: { background: 'rgba(141, 31, 31, 0.14)', color: '#8d1f1f' },
  Validada: { background: 'rgba(19, 138, 99, 0.14)', color: '#138a63' }
};

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

const normalizeStatus = (status) => status === 'En Validacion' ? 'En Validación' : status;

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState(assignmentInitial);
  const [rubricRows, setRubricRows] = useState(rubricInitial);

  const canCreateAssignment = ['secretaria', 'superadmin', 'mesa'].includes(user?.role);
  const rubricTotal = useMemo(() => rubricRows.reduce((sum, row) => sum + Number(row.puntos || 0), 0), [rubricRows]);

  const loadData = async () => {
    const [assignmentsResponse, commissionsResponse] = await Promise.all([
      api.get('/api/assignments'),
      api.get('/api/commissions')
    ]);
    setAssignments(assignmentsResponse.data);
    setCommissions(commissionsResponse.data);
    setAssignmentForm((current) => ({
      ...current,
      commissionId: current.commissionId || commissionsResponse.data[0]?.id || ''
    }));
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

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
          <span className="pill pill-blue">Trabajo de clase</span>
          <h1>Asignaciones</h1>
          <p>
            Consulta tareas, revisa rúbricas, entrega documentos y publica nuevas asignaciones para las comisiones.
          </p>
        </div>
        {canCreateAssignment ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate((value) => !value)}>
            {showCreate ? 'Cerrar formulario' : 'Nueva asignación'}
          </button>
        ) : null}
      </section>

      {showCreate && canCreateAssignment ? (
        <section className="glass-card classroom-panel">
          <div className="page-heading">
            <div>
              <h1 style={{ fontSize: '1.7rem' }}>Publicar asignación</h1>
              <p>Define el encargo, la comisión y una rúbrica dinámica con criterios editables.</p>
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
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="assignment-description">Descripción</label>
              <textarea id="assignment-description" className="input textarea" value={assignmentForm.description} onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
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

            <div style={{ gridColumn: '1 / -1' }} className="rubric-builder">
              <div className="rubric-builder__head">
                <div>
                  <h2>Rúbrica dinámica</h2>
                  <p>Agrega, elimina y ajusta criterios según la tarea.</p>
                </div>
                <button type="button" className="btn btn-muted" onClick={addRubricRow}>Agregar criterio</button>
              </div>
              {rubricRows.map((row, index) => (
                <div className="rubric-row" key={`${row.criterio}-${index}`}>
                  <input className="input" value={row.criterio} onChange={(event) => updateRubricRow(index, 'criterio', event.target.value)} placeholder="Criterio" required />
                  <input className="input" value={row.descripcion} onChange={(event) => updateRubricRow(index, 'descripcion', event.target.value)} placeholder="Descripción del criterio" required />
                  <input className="input" type="number" min="1" value={row.puntos} onChange={(event) => updateRubricRow(index, 'puntos', event.target.value)} aria-label="Puntos" required />
                  <button type="button" className="btn btn-muted" onClick={() => removeRubricRow(index)} disabled={rubricRows.length === 1}>Quitar</button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Publicando...' : 'Publicar asignación'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="glass-card table-wrap">
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
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{assignment.commission_name || 'Sin comisión'}</div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--muted)' }}>{assignment.commission_code || '-'}</div>
                </td>
                <td style={{ fontWeight: 800 }}>{assignment.assignment_id}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{assignment.title}</div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--muted)', maxWidth: 320 }}>
                    {assignment.objective}
                  </div>
                </td>
                <td>{assignment.type}</td>
                <td>
                  <span className="pill" style={statusStyles[assignment.status]}>
                    {normalizeStatus(assignment.status)}
                  </span>
                </td>
                <td>{new Date(assignment.deadline).toLocaleDateString('es-DO')}</td>
                <td>{assignment.creator_name || 'Sistema'}</td>
                <td>
                  <Link to={`/room/assignments/${assignment.id}`} className="table-action">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Assignments;
