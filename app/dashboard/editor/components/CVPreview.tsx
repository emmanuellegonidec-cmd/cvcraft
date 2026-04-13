'use client';

import { CVFormData } from '@/lib/types';
import { TemplateId, splitSkills } from '@/lib/cv-config';

const FONT = 'Montserrat, sans-serif';

interface Props {
  form: CVFormData;
  photo: string;
  template: TemplateId;
  accentColor: string;
  fontFamily: string;
}

function Initials({ firstName, lastName, bg, size = 48 }: { firstName: string; lastName: string; bg: string; size?: number }) {
  const txt = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.33, color: '#fff', flexShrink: 0, fontFamily: 'inherit' }}>
      {txt || '?'}
    </div>
  );
}

function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1.5px solid ${color}`, paddingBottom: 3, marginBottom: 7, marginTop: 12, fontFamily: 'inherit', color: '#111' }}>
      {children}
    </div>
  );
}

function ExpBlock({ exp, accentColor, showBar = false }: { exp: any; accentColor: string; showBar?: boolean }) {
  const lines = (exp.description || '').split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-•]\s*/, '').replace(/\*\*/g, ''));
  return (
    <div style={{ display: 'flex', gap: showBar ? 8 : 0, marginBottom: 9 }}>
      {showBar && <div style={{ width: 3, background: accentColor, borderRadius: 2, flexShrink: 0, minHeight: 20 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 11, fontFamily: 'inherit' }}>{exp.role}</div>
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'inherit' }}>{exp.start}{exp.end ? ` – ${exp.end}` : ''}</div>
        </div>
        <div style={{ fontSize: 10, color: accentColor, marginBottom: 3, fontFamily: 'inherit' }}>{exp.company}</div>
        {lines.map((line: string, j: number) => (
          <div key={j} style={{ fontSize: 10, marginLeft: 8, marginBottom: 2, lineHeight: 1.5, color: '#333', fontFamily: 'inherit' }}>• {line}</div>
        ))}
      </div>
    </div>
  );
}

function Skills({ skills, accentColor }: { skills: string; accentColor: string }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.8, color: '#333', fontFamily: 'inherit', marginTop: 4 }}>
      {splitSkills(skills).join('  ·  ')}
    </div>
  );
}

function ClassicPreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily, fontSize: 13 }}>
      <div style={{ background: '#111', padding: '16px 20px', marginBottom: 14, borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {photo ? <img src={photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg={accentColor} size={56} />}
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{form.title}</div>
            <div style={{ height: 2, width: 50, background: accentColor, marginBottom: 5 }} />
            <div style={{ fontSize: 10, color: '#ccc' }}>{contact}</div>
          </div>
        </div>
      </div>
      {form.summary && <><SectionTitle color={accentColor}>Profil professionnel</SectionTitle><p style={{ fontSize: 11, lineHeight: 1.7, margin: '0 0 8px', color: '#333' }}>{form.summary}</p></>}
      {form.experiences?.length > 0 && <><SectionTitle color={accentColor}>Expériences</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && (
          <div>
            <SectionTitle color={accentColor}>Formation</SectionTitle>
            {form.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</div>
                <div style={{ fontSize: 10, color: '#555' }}>{edu.school}</div>
                <div style={{ fontSize: 10, color: accentColor }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
        {form.skills && <div><SectionTitle color={accentColor}>Compétences</SectionTitle><Skills skills={form.skills} accentColor={accentColor} /></div>}
      </div>
    </div>
  );
}

function ModernPreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', fontFamily, fontSize: 13, minHeight: 500 }}>
      <div style={{ background: accentColor, padding: '20px 14px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          {photo ? <img src={photo} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg="rgba(255,255,255,0.25)" size={60} />}
        </div>
        <div style={{ fontWeight: 900, fontSize: 12, textAlign: 'center', marginBottom: 3 }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 8 }}>{form.title}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 10 }} />
        <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Contact</div>
        {[form.email, form.phone, form.city, form.linkedin].filter(Boolean).map((v, i) => (
          <div key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', marginBottom: 3, wordBreak: 'break-all' }}>{v}</div>
        ))}
        {form.skills && (
          <>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 5 }}>Compétences</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>{splitSkills(form.skills).join('  ·  ')}</div>
          </>
        )}
        {form.education?.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 5 }}>Formation</div>
            {form.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700 }}>{edu.degree}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{edu.school}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.9)' }}>{edu.year}</div>
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ padding: '20px 18px' }}>
        {form.summary && <><SectionTitle color={accentColor}>Profil professionnel</SectionTitle><p style={{ fontSize: 11, lineHeight: 1.7, margin: '0 0 8px', color: '#333' }}>{form.summary}</p></>}
        {form.experiences?.length > 0 && <><SectionTitle color={accentColor}>Expériences</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} showBar />)}</>}
      </div>
    </div>
  );
}

function MinimalPreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily, fontSize: 13 }}>
      <div style={{ height: 3, background: accentColor, marginBottom: 16, borderRadius: 2 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
        {photo ? <img src={photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg={accentColor} size={56} />}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 2 }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: 11, color: accentColor, marginBottom: 3 }}>{form.title}</div>
          <div style={{ fontSize: 10, color: '#888' }}>{contact}</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: '#ddd', margin: '10px 0' }} />
      {form.summary && <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', margin: '0 0 8px' }}>{form.summary}</p>}
      {form.experiences?.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, marginTop: 12 }}>— Expériences</div>
          {form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} />)}
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, marginTop: 12 }}>— Formation</div>
            {form.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</div>
                <div style={{ fontSize: 10, color: '#555' }}>{edu.school}</div>
                <div style={{ fontSize: 10, color: accentColor }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
        {form.skills && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, marginTop: 12 }}>— Compétences</div>
            <Skills skills={form.skills} accentColor={accentColor} />
          </div>
        )}
      </div>
    </div>
  );
}

function ElegantPreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily, fontSize: 13 }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        {photo
          ? <img src={photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}`, marginBottom: 8 }} />
          : <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Initials firstName={form.firstName} lastName={form.lastName} bg="#f0f0f0" size={56} /></div>
        }
        <div style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6, letterSpacing: 0.5 }}>{form.title}</div>
        <div style={{ height: 1, width: 80, background: accentColor, margin: '0 auto 6px' }} />
        <div style={{ fontSize: 10, color: '#888' }}>{contact}</div>
      </div>
      <div style={{ height: 0.5, background: '#ddd', margin: '10px 0' }} />
      {form.summary && <><SectionTitle color={accentColor}>Profil</SectionTitle><p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', textAlign: 'center', margin: '0 0 8px' }}>{form.summary}</p></>}
      {form.experiences?.length > 0 && <><SectionTitle color={accentColor}>Expériences professionnelles</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && (
          <div>
            <SectionTitle color={accentColor}>Formation</SectionTitle>
            {form.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</div>
                  <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>{edu.school}</div>
                </div>
                <div style={{ fontSize: 10, color: accentColor }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
        {form.skills && (
          <div>
            <SectionTitle color={accentColor}>Compétences</SectionTitle>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>{splitSkills(form.skills).join('  ·  ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreativePreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily, fontSize: 13, display: 'flex' }}>
      <div style={{ width: 8, background: accentColor, flexShrink: 0, borderRadius: '4px 0 0 4px' }} />
      <div style={{ flex: 1, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {photo ? <img src={photo} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg="#f5f5f5" size={54} />}
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 2 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 11, color: accentColor, marginBottom: 3 }}>{form.title}</div>
            <div style={{ fontSize: 10, color: '#888' }}>{contact}</div>
          </div>
        </div>
        {form.summary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 10 }}>
              <div style={{ width: 5, height: 5, background: accentColor, borderRadius: 1 }} />
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profil professionnel</div>
              <div style={{ flex: 1, height: 0.5, background: '#eee' }} />
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', margin: '0 0 8px' }}>{form.summary}</p>
          </>
        )}
        {form.experiences?.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 12 }}>
              <div style={{ width: 5, height: 5, background: accentColor, borderRadius: 1 }} />
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expériences</div>
              <div style={{ flex: 1, height: 0.5, background: '#eee' }} />
            </div>
            {form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} showBar />)}
          </>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
          {form.education?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 12 }}>
                <div style={{ width: 5, height: 5, background: accentColor, borderRadius: 1 }} />
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formation</div>
                <div style={{ flex: 1, height: 0.5, background: '#eee' }} />
              </div>
              {form.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{edu.school}</div>
                  <div style={{ fontSize: 10, color: accentColor }}>{edu.year}</div>
                </div>
              ))}
            </div>
          )}
          {form.skills && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 12 }}>
                <div style={{ width: 5, height: 5, background: accentColor, borderRadius: 1 }} />
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compétences</div>
                <div style={{ flex: 1, height: 0.5, background: '#eee' }} />
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.8, color: '#333' }}>{splitSkills(form.skills).join('  ·  ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutivePreview({ form, photo, accentColor, fontFamily }: { form: CVFormData; photo: string; accentColor: string; fontFamily: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily, fontSize: 13 }}>
      <div style={{ height: 2, background: '#111', marginBottom: 14 }} />
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        {photo
          ? <img src={photo} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc', marginBottom: 8 }} />
          : <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Initials firstName={form.firstName} lastName={form.lastName} bg="#f5f5f5" size={48} /></div>
        }
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#111', marginBottom: 3 }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 0.8, marginBottom: 5 }}>{form.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ flex: 1, height: 0.5, background: '#ccc', maxWidth: 80 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: accentColor }} />
          <div style={{ flex: 1, height: 0.5, background: '#ccc', maxWidth: 80 }} />
        </div>
        <div style={{ fontSize: 10, color: '#888' }}>{contact}</div>
      </div>
      <div style={{ height: 0.5, background: '#ddd', margin: '8px 0' }} />
      {form.summary && <><SectionTitle color={accentColor}>Profil professionnel</SectionTitle><p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', margin: '0 0 8px' }}>{form.summary}</p></>}
      {form.experiences?.length > 0 && <><SectionTitle color={accentColor}>Expériences professionnelles</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor={accentColor} />)}</>}
      {form.education?.length > 0 && (
        <>
          <SectionTitle color={accentColor}>Formation</SectionTitle>
          {form.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree}</div>
                <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>{edu.school}</div>
              </div>
              <div style={{ fontSize: 10, color: accentColor }}>{edu.year}</div>
            </div>
          ))}
        </>
      )}
      {form.skills && (
        <>
          <SectionTitle color={accentColor}>Compétences</SectionTitle>
          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.8 }}>{splitSkills(form.skills).join('  ·  ')}</div>
        </>
      )}
      <div style={{ height: 2, background: '#111', marginTop: 16 }} />
    </div>
  );
}

export function CVPreview({ form, photo, template, accentColor, fontFamily }: Props) {
  const props = { form, photo, accentColor, fontFamily };
  return (
    <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1.5rem', boxShadow: '4px 4px 0 #111', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', fontFamily }}>
      {template === 'modern'    && <ModernPreview    {...props} />}
      {template === 'minimal'   && <MinimalPreview   {...props} />}
      {template === 'elegant'   && <ElegantPreview   {...props} />}
      {template === 'creative'  && <CreativePreview  {...props} />}
      {template === 'executive' && <ExecutivePreview {...props} />}
      {(template === 'classic' || !template) && <ClassicPreview {...props} />}
    </div>
  );
}