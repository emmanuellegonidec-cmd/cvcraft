'use client';
import { useState } from 'react';
import { Contact } from '@/lib/jobs';
import { ContactModal } from './Modals';

type ContactWithJob = Contact & {
  job_id?: string | null;
  job_manual?: string | null;
};

type Props = {
  contacts: ContactWithJob[];
  onAddContact: () => void;
  onDeleteContact: (id: string) => void;
  onRefresh: () => void;
};

export default function ContactsView({ contacts, onDeleteContact, onRefresh }: Props) {
  const [modalOpen, setModalOpen]       = useState(false);
  const [contactEdite, setContactEdite] = useState<ContactWithJob | null>(null);

  const initials = (n: string) =>
    n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  function ouvrirAjout() {
    setContactEdite(null);
    setModalOpen(true);
  }

  function ouvrirEdition(c: ContactWithJob) {
    setContactEdite(c);
    setModalOpen(true);
  }

  return (
    <>
      <ContactModal
        isOpen={modalOpen}
        contact={contactEdite}

        onSave={() => { setModalOpen(false); onRefresh(); }}
        onClose={() => setModalOpen(false)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>

        {contacts.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#888' }}>
            Aucun contact —{' '}
            <button onClick={ouvrirAjout} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              Ajouter le premier
            </button>
          </div>
        )}

        {contacts.map(c => (
          <div key={c.id} className="ccard" style={{ cursor: 'pointer' }} onClick={() => ouvrirEdition(c)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDEAEA', border: '2px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>
                {initials(c.name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.role}</div>
                <div style={{ fontSize: 11, color: '#E8151B', fontWeight: 600 }}>{c.company}</div>
              </div>
            </div>

            {c.email    && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📧 {c.email}</div>}
            {c.phone    && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📞 {c.phone}</div>}
            {c.linkedin && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>🔗 {c.linkedin}</div>}

            {c.job_manual && (
              <div style={{ fontSize: 11, color: '#666', marginTop: 6, background: '#FFF8EC', border: '1px solid #FFE0A0', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                💼 {c.job_manual}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
              {c.email    && <button className="cbtn" onClick={() => window.open('mailto:' + c.email)}>✉️ Email</button>}
              {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin!)}>💼 LinkedIn</button>}
              <button className="cbtn" style={{ color: '#E8151B' }} onClick={() => onDeleteContact(c.id)}>✕</button>
            </div>
          </div>
        ))}

        <div className="ccard" style={{ border: '2px dashed #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 150, boxShadow: 'none' }} onClick={ouvrirAjout}>
          <div style={{ textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>+</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Ajouter un contact</div>
          </div>
        </div>

      </div>
    </>
  );
}
