'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Montserrat } from 'next/font/google';
import CVsSection from './components/CVsSection';
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700', '800', '900'] });

interface UserProfile {
  first_name?: string;
  last_name?: string;
  current_title?: string;
  target_title?: string;
  sector?: string;
  experience_level?: string;
  city?: string;
  region?: string;
  mobility?: string;
  summary?: string;
  key_skills?: string[];
  languages?: string[];
  availability?: string;
  contract_types?: string[];
  salary_expectation?: string;
}

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Choisir…' },
  { value: 'junior', label: 'Junior (0–3 ans)' },
  { value: 'confirmed', label: 'Confirmé (3–8 ans)' },
  { value: 'senior', label: 'Senior (8–15 ans)' },
  { value: 'executive', label: 'Cadre dirigeant (15 ans+)' },
];

const MOBILITY_OPTIONS = [
  { value: '', label: 'Choisir…' },
  { value: 'local', label: 'Locale (même ville)' },
  { value: 'regional', label: 'Régionale' },
  { value: 'national', label: 'Nationale' },
  { value: 'international', label: 'Internationale' },
  { value: 'remote_only', label: 'Télétravail uniquement' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Choisir…' },
  { value: 'immediate', label: 'Immédiate' },
  { value: '1_month', label: 'Dans 1 mois' },
  { value: '3_months', label: 'Dans 3 mois' },
  { value: '6_months', label: 'Dans 6 mois' },
];

const CONTRACT_OPTIONS = ['CDI', 'CDD', 'Freelance / Mission', 'Alternance', 'Stage', 'Intérim'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #111',
  borderRadius: 6,
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  background: '#fff',
  color: '#111',
  boxSizing: 'border-box',
  outline: 'none',
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return; }
      (window as Window & { __jfmj_token?: string }).__jfmj_token = session.access_token;
      setToken(session.access_token);
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.profile) {
          setProfile({
            first_name: data.profile.first_name ?? '',
            last_name: data.profile.last_name ?? '',
            current_title: data.profile.current_title ?? '',
            target_title: data.profile.target_title ?? '',
            sector: data.profile.sector ?? '',
            experience_level: data.profile.experience_level ?? '',
            city: data.profile.city ?? '',
            region: data.profile.region ?? '',
            mobility: data.profile.mobility ?? '',
            summary: data.profile.summary ?? '',
            key_skills: data.profile.key_skills ?? [],
            languages: data.profile.languages ?? [],
            availability: data.profile.availability ?? '',
            contract_types: data.profile.contract_types ?? [],
            salary_expectation: data.profile.salary_expectation ?? '',
          });
          setSkillsText((data.profile.key_skills ?? []).join(', '));
          setLanguagesText((data.profile.languages ?? []).join(', '));
        }
        if (data.email) setEmail(data.email);
      } catch (_) {
        setError('Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const handleSave = useCallback(async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...profile,
        key_skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
        languages: languagesText.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setProfile(data.profile);

      // Synchroniser aussi user_metadata Supabase pour que le dashboard principal
      // et les autres pages affichent le bon prénom immédiatement
      try {
        const supabase = createClient();
        const fn = (data.profile?.first_name ?? '').trim();
        const ln = (data.profile?.last_name ?? '').trim();
        const fullName = [fn, ln].filter(Boolean).join(' ');
        await supabase.auth.updateUser({
          data: {
            first_name: fn,
            last_name: ln,
            full_name: fullName,
          },
        });
      } catch (metaErr) {
        console.warn('Impossible de synchroniser user_metadata:', metaErr);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }, [profile, skillsText, languagesText, token]);

  const handleChangePassword = useCallback(async () => {
    setPwdError(''); setPwdSuccess(false);
    if (newPassword.length < 8) { setPwdError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Les deux mots de passe ne correspondent pas.'); return; }
    setPwdSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setPwdSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setPwdSaving(false);
    }
  }, [newPassword, confirmPassword]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      await fetch('/api/profile', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (_) {
      setError('Erreur lors de la suppression du compte.');
      setDeleting(false);
    }
  }, [token, router]);

  const toggleContract = (ct: string) => {
    setProfile((prev) => {
      const current = prev.contract_types ?? [];
      return { ...prev, contract_types: current.includes(ct) ? current.filter((c) => c !== ct) : [...current, ct] };
    });
  };

  const pwdStrength = (() => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2) return { label: 'Faible', color: '#E8151B', width: '33%' };
    if (score <= 3) return { label: 'Moyen', color: '#F5C400', width: '66%' };
    return { label: 'Fort', color: '#1A7A4A', width: '100%' };
  })();

  if (loading) {
    return (
      <div className={montserrat.className} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ fontSize: 16, color: '#111', fontWeight: 600 }}>Chargement…</div>
      </div>
    );
  }

  const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || email?.[0]?.toUpperCase() || '?';
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || email?.split('@')[0] || 'Mon profil';

  return (
    <div className={montserrat.className} style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* Header */}
      <div style={{ background: '#111', color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, height: 64, borderBottom: '3px solid #F5C400', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: '2px solid #444', color: '#fff', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13 }}>
          ← Retour
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', border: '2px solid #333', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#F5C400', letterSpacing: -0.5 }}>{displayName}</div>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{email}</div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>

        {error && (
          <div style={{ background: '#FEE', border: '2px solid #E8151B', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#E8151B', fontWeight: 600, fontSize: 14 }}>{error}</div>
        )}

        {/* 1 — Infos de base */}
        <Section title="👤 Informations de base">
          <Row>
            <Field label="Prénom"><Input value={profile.first_name ?? ''} onChange={(v) => setProfile((p) => ({ ...p, first_name: v }))} placeholder="Votre prénom" /></Field>
            <Field label="Nom"><Input value={profile.last_name ?? ''} onChange={(v) => setProfile((p) => ({ ...p, last_name: v }))} placeholder="Votre nom" /></Field>
          </Row>
          <Field label="Email" hint="Non modifiable ici">
            <input type="text" value={email} disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }} />
          </Field>
        </Section>

        {/* 2 — Situation pro */}
        <Section title="💼 Situation professionnelle">
          <Field label="Poste actuel / dernier poste"><Input value={profile.current_title ?? ''} onChange={(v) => setProfile((p) => ({ ...p, current_title: v }))} placeholder="Ex : Directrice Marketing" /></Field>
          <Field label="Poste recherché"><Input value={profile.target_title ?? ''} onChange={(v) => setProfile((p) => ({ ...p, target_title: v }))} placeholder="Ex : CMO / Head of Marketing" /></Field>
          <Row>
            <Field label="Secteur d'activité"><Input value={profile.sector ?? ''} onChange={(v) => setProfile((p) => ({ ...p, sector: v }))} placeholder="Ex : Tech, Retail, Santé…" /></Field>
            <Field label="Niveau d'expérience">
              <select value={profile.experience_level ?? ''} onChange={(e) => setProfile((p) => ({ ...p, experience_level: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        {/* 3 — Localisation */}
        <Section title="📍 Localisation">
          <Row>
            <Field label="Ville"><Input value={profile.city ?? ''} onChange={(v) => setProfile((p) => ({ ...p, city: v }))} placeholder="Ex : Paris" /></Field>
            <Field label="Région"><Input value={profile.region ?? ''} onChange={(v) => setProfile((p) => ({ ...p, region: v }))} placeholder="Ex : Île-de-France" /></Field>
          </Row>
          <Field label="Mobilité géographique">
            <select value={profile.mobility ?? ''} onChange={(e) => setProfile((p) => ({ ...p, mobility: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {MOBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </Section>

        {/* 4 — Infos CV (texte) */}
        <Section title="📝 Informations CV">
          <Field label="Résumé / pitch personnel">
            <textarea value={profile.summary ?? ''} onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))} placeholder="Ex : Directrice marketing avec 20 ans d'expérience dans le digital et le retail…" rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </Field>
          <Field label="Compétences clés" hint="Séparées par des virgules">
            <Input value={skillsText} onChange={setSkillsText} placeholder="Ex : Marketing digital, SEO, Management d'équipe, CRM, Data Analytics" />
          </Field>
          <Field label="Langues parlées" hint="Séparées par des virgules">
            <Input value={languagesText} onChange={setLanguagesText} placeholder="Ex : Français (natif), Anglais (courant), Espagnol (notions)" />
          </Field>
        </Section>

        {/* 5 — Mes CV (fichiers) */}
        {token && <CVsSection token={token} />}

        {/* 6 — Disponibilité */}
        <Section title="🗓️ Disponibilité & contrat">
          <Row>
            <Field label="Disponibilité">
              <select value={profile.availability ?? ''} onChange={(e) => setProfile((p) => ({ ...p, availability: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Prétentions salariales">
              <Input value={profile.salary_expectation ?? ''} onChange={(v) => setProfile((p) => ({ ...p, salary_expectation: v }))} placeholder="Ex : 55 000 – 65 000 € brut / an" />
            </Field>
          </Row>
          <Field label="Types de contrat recherchés">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {CONTRACT_OPTIONS.map((ct) => {
                const active = (profile.contract_types ?? []).includes(ct);
                return (
                  <button key={ct} onClick={() => toggleContract(ct)} style={{ padding: '7px 14px', border: `2px solid ${active ? '#111' : '#ccc'}`, borderRadius: 6, background: active ? '#111' : '#fff', color: active ? '#F5C400' : '#555', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: active ? '2px 2px 0 #F5C400' : 'none', transition: 'all 0.15s' }}>
                    {ct}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* Bouton enregistrer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <button onClick={handleSave} disabled={saving} style={{ background: saved ? '#1A7A4A' : '#F5C400', color: saved ? '#fff' : '#111', border: '2px solid #111', borderRadius: 8, padding: '12px 32px', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #111', transition: 'all 0.15s' }}>
            {saving ? '⏳ Enregistrement…' : saved ? '✅ Enregistré !' : '💾 Enregistrer le profil'}
          </button>
        </div>

        {/* 7 — Mot de passe */}
        <Section title="🔒 Modifier le mot de passe">
          <Field label="Nouveau mot de passe">
            <div style={{ position: 'relative' }}>
              <input type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwdError(''); setPwdSuccess(false); }} placeholder="••••••••••••" style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setShowNewPwd((v) => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 0 }}>{showNewPwd ? '🙈' : '👁️'}</button>
            </div>
            {newPassword && pwdStrength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pwdStrength.width, background: pwdStrength.color, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: pwdStrength.color, marginTop: 4 }}>Sécurité : {pwdStrength.label}</div>
              </div>
            )}
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(''); }} placeholder="••••••••••••" style={{ ...inputStyle, paddingRight: 44, borderColor: confirmPassword && confirmPassword !== newPassword ? '#E8151B' : confirmPassword && confirmPassword === newPassword ? '#1A7A4A' : '#111' }} />
              <button onClick={() => setShowConfirmPwd((v) => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 0 }}>{showConfirmPwd ? '🙈' : '👁️'}</button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && <div style={{ fontSize: 12, color: '#E8151B', fontWeight: 600, marginTop: 4 }}>✗ Les mots de passe ne correspondent pas</div>}
            {confirmPassword && confirmPassword === newPassword && <div style={{ fontSize: 12, color: '#1A7A4A', fontWeight: 600, marginTop: 4 }}>✓ Les mots de passe correspondent</div>}
          </Field>
          {pwdError && <div style={{ background: '#FEE', border: '2px solid #E8151B', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#E8151B', fontWeight: 600 }}>{pwdError}</div>}
          {pwdSuccess && <div style={{ background: '#EFF9F3', border: '2px solid #1A7A4A', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#1A7A4A', fontWeight: 700 }}>✅ Mot de passe mis à jour avec succès !</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleChangePassword} disabled={pwdSaving || !newPassword || !confirmPassword} style={{ background: '#111', color: '#fff', border: '2px solid #111', borderRadius: 8, padding: '11px 28px', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 14, cursor: pwdSaving || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #555', opacity: !newPassword || !confirmPassword ? 0.5 : 1, transition: 'all 0.15s' }}>
              {pwdSaving ? '⏳ Mise à jour…' : '🔒 Mettre à jour le mot de passe'}
            </button>
          </div>
        </Section>

        {/* Zone danger */}
        <div style={{ marginTop: 48, borderTop: '2px dashed #E8151B', paddingTop: 32 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#E8151B', marginBottom: 8 }}>⚠️ Zone de danger</div>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
            La suppression de votre compte est <strong>irréversible</strong>. Toutes vos données seront effacées définitivement : offres d'emploi, contacts, échanges, documents (CV, lettres de motivation).
          </p>
          <button onClick={() => setShowDeleteModal(true)} style={{ background: '#fff', color: '#E8151B', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 24px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '2px 2px 0 #E8151B' }}>
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Modale suppression */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
          <div style={{ background: '#fff', border: '3px solid #E8151B', borderRadius: 12, boxShadow: '5px 5px 0 #E8151B', maxWidth: 480, width: '100%', padding: 32, fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#E8151B', marginBottom: 12 }}>⚠️ Suppression définitive</div>
            <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, marginBottom: 20 }}>
              Cette action est <strong>irréversible</strong>.<br />
              Toutes vos données seront supprimées : candidatures, contacts, échanges, CV et lettres de motivation.<br /><br />
              Pour confirmer, tapez exactement : <strong style={{ color: '#E8151B' }}>SUPPRIMER</strong>
            </p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" style={{ ...inputStyle, borderColor: '#E8151B', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} style={{ padding: '10px 20px', border: '2px solid #111', borderRadius: 6, background: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'SUPPRIMER' || deleting} style={{ padding: '10px 20px', border: '2px solid #E8151B', borderRadius: 6, background: deleteConfirmText === 'SUPPRIMER' ? '#E8151B' : '#eee', color: deleteConfirmText === 'SUPPRIMER' ? '#fff' : '#aaa', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, cursor: deleteConfirmText === 'SUPPRIMER' ? 'pointer' : 'not-allowed', fontSize: 14 }}>
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', padding: '24px 28px', marginBottom: 24 }}>
      <div style={{ fontWeight: 900, fontSize: 15, color: '#111', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #eee' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
        {hint && <span style={{ fontWeight: 500, color: '#999', marginLeft: 8, fontSize: 11, textTransform: 'none', letterSpacing: 0 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  );
}
