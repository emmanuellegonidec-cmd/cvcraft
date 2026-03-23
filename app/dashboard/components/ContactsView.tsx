'use client';
import { useState, useEffect } from 'react';
import { Contact } from '@/lib/jobs';
import { ContactModal } from './Modals';

type ContactWithJob = Contact & {
  job_id?: string | null;
  job_manual?: string | null;
};

type Props = {
  contacts: ContactWithJob[];
  onAddContact: number;
  onDeleteContact: (id: string) => void;
  onRefresh: () => void;
};

function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? (window as any).__jfmj_token : null;
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function ContactsView({ contacts, onAddContact, onDeleteContact, onRefresh }: Props) {
  const [modalOpen, setModalOpen]         = useState(false);
  const [contactEdite, setContactEdite]   = useState<ContactWithJob | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContactWithJob | null>(null);
  const [noteCounts, setNoteCounts]       = useState<Record<string, number>>({});
  const [jobNames, setJobNames]           = useState<Record<string, string>>({});

  // Réagir au trigger du bouton parent
  useEffect(() => {
    if (onAddContact > 0) ouvrirAjout();
  }, [onAddContact]);

  const initials = (n: string) =>
    n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  // Charger le nombre de notes par contact
  useEffect(() => {
    if (contacts.length === 0) return;
    contacts.forEach(async (c) => {
      const res = await fetch(`/api/contacts/notes?contact_id=${c.id}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.notes) setNoteCounts(prev => ({ ...prev, [c.id]: data.notes.length }));
    });
  }, [contacts]);

  // Charger les noms des jobs liés
  useEffect(() => {
    const hasJobIds = contacts.some(c => c.job_id);
    if (!hasJobIds) return;
    fetch('/api/jobs', { headers: getAuthHeaders() }).then(r => r.json()).then(data => {
      if (!data.jobs) return;
      const map: Record<string, string> = {};
      data.jobs.forEach((j: any) => {
        map[j.id] = j.title + (j.company ? ` — ${j.company}` : '');
      });
      setJobNames(map);
    });
  }, [contacts]);

  function ouvrirAjout() { setContactEdite(null); setModalOpen(true); }
  function ouvrirEdition(c: ContactWithJob) { setContactEdite(c); setModalOpen(true); }

  async function confirmerSuppression() {
    if (!confirmDelete) return;
    onDeleteContact(confirmDelete.id);
    setConfirmDelete(null);
  }

  function posteLabel(c: ContactWithJob) {
    if (c.job_id && jobNames[c.job_id]) return jobNames[c.job_id];
    if (c.job_manual) return c.job_manual;
    return null;
  }

  return (
    <>
      <ContactModal
        isOpen={modalOpen}
        contact={contactEdite}
        onSave={() => { setModalOpen(false); onRefresh(); }}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="modal-bg" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 12 }}>Supprimer ce contact ?</h2>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              Tu es sur le point de supprimer <strong>{confirmDelete.name}</strong> et toutes ses notes associées.
            </p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 20, fontWeight: 600 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
              <button
                onClick={confirmerSuppression}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#E8151B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>

        {contacts.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#888' }}>
            Aucun contact —{' '}
            <button onClick={ouvrirAjout} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              Ajouter le premier
            </button>
          </div>
        )}

        {contacts.map(c => {
          const poste = posteLabel(c);
          const nbEchanges = noteCounts[c.id] || 0;
          return (
            <div key={c.id} className="ccard" style={{ cursor: 'pointer' }} onClick={() => ouvrirEdition(c)}>

              {/* Avatar + Nom + Rôle + Entreprise */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDEAEA', border: '2px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                  {c.role    && <div style={{ fontSize: 11, color: '#888' }}>{c.role}</div>}
                  {c.company && <div style={{ fontSize: 11, color: '#E8151B', fontWeight: 600 }}>{c.company}</div>}
                </div>
              </div>

              {/* Téléphone */}
              {c.phone && <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>📞 {c.phone}</div>}

              {/* Poste associé */}
              {poste && (
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6, background: '#FFF8EC', border: '1px solid #FFE0A0', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                  💼 {poste}
                </div>
              )}

              {/* Nombre d'échanges */}
              {nbEchanges > 0 && (
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                  💬 {nbEchanges} échange{nbEchanges > 1 ? 's' : ''}
                </div>
              )}

              {/* Boutons actions */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                {c.email    && <button className="cbtn" onClick={() => window.open('mailto:' + c.email)}>✉️ Email</button>}
                {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin!)}>💼 LinkedIn</button>}
                <button
                  className="cbtn"
                  style={{ color: '#E8151B', marginLeft: 'auto' }}
                  onClick={() => setConfirmDelete(c)}
                >
                  Supprimer
                </button>
              </div>

            </div>
          );
        })}

        {/* Carte + Ajouter */}
        <div
          className="ccard"
          style={{ border: '2px dashed #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 150, boxShadow: 'none' }}
          onClick={ouvrirAjout}
        >
          <div style={{ textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>+</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Ajouter un contact</div>
          </div>
        </div>

      </div>
    </>
  );
}
