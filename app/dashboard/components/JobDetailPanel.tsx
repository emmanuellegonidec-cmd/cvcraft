'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job } from '@/lib/jobs';
import { Stage, formatDate, isInterviewStage } from './types';
import { HeartDisplay } from './HeartComponents';

type Props = {
  job: Job;
  stages: Stage[];
  userId: string | null;
  accessToken: string | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onFieldUpdate: (id: string, field: string, value: any) => void;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
};

export default function JobDetailPanel({ job, stages, userId, accessToken, onClose, onStatusChange, onFieldUpdate, onEdit, onDelete }: Props) {
  const router = useRouter();
  const cvInputRef = useRef<HTMLInputElement>(null);
  const lmInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingLm, setUploadingLm] = useState(false);

  async function uploadDocument(file: File, type: 'cv' | 'lm') {
    if (!userId || !accessToken) return;
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${userId}/${job.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from('job-documents').upload(path, file, { upsert: true });
    if (error) { alert('Erreur upload : ' + error.message); return; }
    const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
    const field = type === 'cv' ? 'cv_url' : 'cover_letter_url';
    const checkField = type === 'cv' ? 'cv_sent' : 'cover_letter_sent';
    onFieldUpdate(job.id, field, signedData?.signedUrl ?? '');
    onFieldUpdate(job.id, checkField, true);
  }

  const currentStage = stages.find(s => s.id === job.status);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.5)', zIndex: 200 }} onClick={onClose}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', borderLeft: '2px solid #111', padding: '1.5rem', overflowY: 'auto', boxShadow: '-4px 0 0 #111' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 3, fontWeight: 600 }}>{job.company}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{job.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.location}</span>}
          {(job as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A' }}>💰 {(job as any).salary_text}</span>}
          {currentStage && <span className="pill" style={{ background: currentStage.color + '22', color: currentStage.color }}>{currentStage.label}</span>}
        </div>

        {(job as any).favorite > 0 && <div style={{ marginBottom: '0.75rem' }}><HeartDisplay value={(job as any).favorite} /></div>}
        <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: '1rem' }}>📅 Créé le {formatDate(job.created_at)}</div>

        {/* Étapes */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="fl">Étape</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {stages.map(col => (
              <button key={col.id} onClick={() => onStatusChange(job.id, col.id)}
                style={{ background: job.status === col.id ? col.color + '22' : '#fff', color: job.status === col.id ? col.color : '#888', border: `2px solid ${job.status === col.id ? col.color : '#E0E0E0'}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        {job.status !== 'to_apply' && (
          <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Documents</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* CV */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={'check-box' + ((job as any).cv_sent ? ' checked' : '')} onClick={() => onFieldUpdate(job.id, 'cv_sent', !(job as any).cv_sent)}>
                  {(job as any).cv_sent && '✓'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>CV</span>
                <button className={'doc-btn' + ((job as any).cv_url ? ' done' : '')}
                  onClick={() => { if ((job as any).cv_url) window.open((job as any).cv_url); else cvInputRef.current?.click(); }}>
                  {(job as any).cv_url ? '📎 Voir' : '📎 Joindre'}
                </button>
                <input ref={cvInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingCv(true); await uploadDocument(f, 'cv'); setUploadingCv(false); } }} />
                {uploadingCv && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
              </div>

              <div style={{ width: 1, background: '#E0E0E0' }} />

              {/* LM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={'check-box' + ((job as any).cover_letter_sent ? ' checked' : '')} onClick={() => onFieldUpdate(job.id, 'cover_letter_sent', !(job as any).cover_letter_sent)}>
                  {(job as any).cover_letter_sent && '✓'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>LM</span>
                <button className={'doc-btn' + ((job as any).cover_letter_url ? ' done' : '')}
                  onClick={() => { if ((job as any).cover_letter_url) window.open((job as any).cover_letter_url); else lmInputRef.current?.click(); }}>
                  {(job as any).cover_letter_url ? '📎 Voir' : '📎 Joindre'}
                </button>
                <input ref={lmInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingLm(true); await uploadDocument(f, 'lm'); setUploadingLm(false); } }} />
                {uploadingLm && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
              </div>
            </div>
          </div>
        )}

        {/* Synthèse entretien */}
        {isInterviewStage(job.status, stages) && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="fl">Synthèse de l&apos;entretien</label>
            <textarea
              defaultValue={(job as any).interview_summary || ''}
              placeholder="Notes sur le déroulement, questions posées, impressions..."
              className="fi" rows={4} style={{ resize: 'vertical' }}
              onBlur={async e => onFieldUpdate(job.id, 'interview_summary', e.target.value)}
            />
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="fl">Description</label>
            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
              {job.description}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="fl">Mes notes</label>
          <textarea defaultValue={job.notes || ''} placeholder="Notes, impressions..." className="fi" style={{ resize: 'vertical', minHeight: 70 }}
            onBlur={async e => onFieldUpdate(job.id, 'notes', e.target.value)} />
        </div>

        <button className="btn-main" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => router.push('/dashboard/editor?targetJob=' + encodeURIComponent(job.title + ' chez ' + job.company))}>
          ✦ Générer un CV pour ce poste →
        </button>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => onEdit(job)}>
          ✏️ Modifier l&apos;offre
        </button>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#E8151B', borderColor: '#FDEAEA' }} onClick={() => onDelete(job.id)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
