import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api, { getApiBaseUrl } from '../services/api';

const Item = ({ label, value }) => (
  <div className="detail-stat">
    <p>{label}</p>
    <strong>{value}</strong>
  </div>
);

const parseEvaluationCriteria = (value) => {
  if (!value) {
    return { instructions: '', rubric: [] };
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed.rubric)) {
      return {
        instructions: parsed.instructions || '',
        rubric: parsed.rubric
      };
    }
  } catch (error) {
    // Keeps support for assignments created before dynamic rubrics.
  }

  const rubric = [];
  const instructions = [];

  value.split('\n').forEach((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(.+)\s+\((\d+)\s+pts\):\s+(.+)$/i);

    if (match) {
      rubric.push({
        criterio: match[1],
        puntos: Number(match[2]),
        descripcion: match[3]
      });
      return;
    }

    if (trimmed) {
      instructions.push(trimmed);
    }
  });

  return {
    instructions: instructions.join('\n'),
    rubric
  };
};

const AssignmentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gradingForms, setGradingForms] = useState({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);

  const loadData = useCallback(async () => {
    const [assignmentResponse, submissionsResponse] = await Promise.all([
      api.get(`/api/assignments/${id}`),
      api.get(`/api/assignments/${id}/submissions`)
    ]);

    setAssignment(assignmentResponse.data);
    setSubmissions(submissionsResponse.data);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canSubmit = assignment && user && (
    user.role === 'delegado' &&
    user.commissionId === assignment.commission_id
  );
  const canEvaluate = assignment && user && ['superadmin', 'secretaria', 'mesa'].includes(user.role);

  const evaluation = useMemo(() => parseEvaluationCriteria(assignment?.evaluation_criteria), [assignment]);
  const rubricTotal = useMemo(
    () => evaluation.rubric.reduce((sum, row) => sum + Number(row.puntos || 0), 0),
    [evaluation.rubric]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Selecciona un archivo antes de enviar');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      await api.post(`/api/assignments/${id}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Documento enviado correctamente');
      setSelectedFile(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo enviar el documento');
    } finally {
      setUploading(false);
    }
  };

  const updateGradingForm = (submissionId, field, value) => {
    setGradingForms((forms) => ({
      ...forms,
      [submissionId]: {
        score: '',
        feedback: '',
        ...(forms[submissionId] || {}),
        [field]: value
      }
    }));
  };

  const submitEvaluation = async (submission, verdict) => {
    const form = gradingForms[submission.id] || {};
    const score = Number(form.score);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast.error('Escribe una calificación entre 0 y 100');
      return;
    }

    setGradingSubmissionId(submission.id);

    try {
      await api.post(`/api/assignments/${id}/submissions/${submission.id}/evaluation`, {
        score,
        verdict,
        feedback: form.feedback
      });
      toast.success(verdict === 'return' ? 'Tarea devuelta al delegado' : 'Tarea calificada correctamente');
      setGradingForms((forms) => ({ ...forms, [submission.id]: { score: '', feedback: '' } }));
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo registrar la evaluación');
    } finally {
      setGradingSubmissionId(null);
    }
  };

  if (!assignment) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="assignment-page">
      <section className="assignment-hero">
        <div>
          <span className="pill assignment-hero__pill">{t('assignmentDetail')}</span>
          <h1>{assignment.title}</h1>
          <p>{t('assignmentDetailCopy')}</p>
        </div>
        <div className="assignment-hero__status">
          <span>{t('status')}</span>
          <strong>{assignment.status}</strong>
        </div>
      </section>

      <section className="assignment-detail-card">
        <div className="detail-stat-grid">
          <Item label={t('commission')} value={assignment.commission_name || 'General'} />
          <Item label={t('code')} value={assignment.assignment_id} />
          <Item label={t('type')} value={assignment.type} />
          <Item label={t('deadline')} value={new Date(assignment.deadline).toLocaleString('es-DO')} />
        </div>

        <div className="assignment-content-grid">
          <div className="assignment-main-stack">
            {[
              [t('description'), assignment.description],
              [t('objective'), assignment.objective]
            ].map(([label, value]) => (
              <article key={label} className="detail-section">
                <h2>{label}</h2>
                <p>{value}</p>
              </article>
            ))}

            <article className="rubric-detail">
              <div className="rubric-detail__heading">
                <div>
                  <h2>{t('rubric')}</h2>
                  <p>{t('rubricCopy')}</p>
                </div>
                <span className="pill pill-blue">{rubricTotal || 0} {t('points').toLowerCase()}</span>
              </div>

              {evaluation.instructions ? (
                <p className="rubric-instructions">{evaluation.instructions}</p>
              ) : null}

              {evaluation.rubric.length ? (
                <div className="rubric-table">
                  <div className="rubric-table__head">
                    <span>{t('criterion')}</span>
                    <span>{t('description')}</span>
                    <span>{t('points')}</span>
                  </div>
                  {evaluation.rubric.map((row, index) => (
                    <div className="rubric-table__row" key={`${row.criterio}-${index}`}>
                      <strong>{row.criterio}</strong>
                      <span>{row.descripcion}</span>
                      <b>{row.puntos}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rubric-instructions">{assignment.evaluation_criteria || 'No hay rúbrica configurada para esta tarea.'}</p>
              )}
            </article>
          </div>

          <aside className="assignment-side-stack">
            {canSubmit ? (
              <article className="detail-section">
                <h2>{t('submitDocument')}</h2>
                <form onSubmit={handleSubmit} className="submission-form">
                  <div>
                    <input type="file" accept=".pdf,.doc,.docx,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv" onChange={(event) => setSelectedFile(event.target.files[0] || null)} />
                    <p>{t('submitDocumentCopy')}</p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? t('uploading') : t('upload')}
                  </button>
                </form>
              </article>
            ) : null}

            {submissions.length > 0 ? (
              <article className="detail-section">
                <h2>{user?.role === 'delegado' ? t('mySubmission') : t('receivedSubmissions')}</h2>
                <div className="submission-list">
                  {submissions.map((submission) => (
                    <div className="submission-card" key={submission.id}>
                      <div className="submission-card__top">
                        <div>
                          <strong>{submission.file_name}</strong>
                          <p>
                            Enviado por: {submission.submitted_by_name || 'Usuario'} - {new Date(submission.submitted_at).toLocaleString('es-DO')}
                            {submission.version > 1 ? ` - versión ${submission.version}` : ''}
                          </p>
                        </div>
                        <a href={`${getApiBaseUrl()}${submission.file_url}`} target="_blank" rel="noreferrer">
                          {t('viewFile')}
                        </a>
                      </div>

                      {submission.evaluation_id ? (
                        <div className={`grade-result ${submission.verdict === 'Aprobado' ? 'is-approved' : 'is-returned'}`}>
                          <div>
                            <span>{submission.verdict === 'Aprobado' ? 'Calificada' : 'Devuelta para corrección'}</span>
                            <strong>{Number(submission.total_score).toFixed(0)} / 100</strong>
                          </div>
                          <p>{submission.recommendations || submission.improvements || submission.strengths}</p>
                          <small>Evaluado por {submission.evaluated_by_name || 'Mesa directiva'}</small>
                        </div>
                      ) : user?.role === 'delegado' ? (
                        <div className="grade-result">
                          <span>Pendiente de calificación</span>
                          <p>La mesa directiva todavía no ha publicado la calificación de esta entrega.</p>
                        </div>
                      ) : null}

                      {canEvaluate ? (
                        <div className="grading-panel">
                          <div>
                            <label className="label" htmlFor={`score-${submission.id}`}>{t('score')}</label>
                            <input
                              id={`score-${submission.id}`}
                              className="input"
                              type="number"
                              min="0"
                              max="100"
                              value={gradingForms[submission.id]?.score ?? ''}
                              onChange={(event) => updateGradingForm(submission.id, 'score', event.target.value)}
                              placeholder="0 - 100"
                            />
                          </div>
                          <div>
                            <label className="label" htmlFor={`feedback-${submission.id}`}>{t('feedback')}</label>
                            <textarea
                              id={`feedback-${submission.id}`}
                              className="input"
                              value={gradingForms[submission.id]?.feedback ?? ''}
                              onChange={(event) => updateGradingForm(submission.id, 'feedback', event.target.value)}
                              placeholder="Comentario para el delegado"
                            />
                          </div>
                          <div className="grading-actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={gradingSubmissionId === submission.id}
                              onClick={() => submitEvaluation(submission, 'grade')}
                            >
                              {t('grade')}
                            </button>
                            <button
                              type="button"
                              className="btn btn-muted"
                              disabled={gradingSubmissionId === submission.id}
                              onClick={() => submitEvaluation(submission, 'return')}
                            >
                              {t('returnTask')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default AssignmentDetail;
