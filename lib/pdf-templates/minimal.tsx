import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVFormData } from '../types';
import { formatSkillsForPdf } from '../cv-config';

interface Props {
  formData: CVFormData;
  accentColor: string;
  fontFamily: string;
  photo?: string;
}

// ✅ Normalisation ATS — nettoie les caractères Unicode (em-dashes, smart quotes, NBSP, zero-width chars)
// qui cassent silencieusement les parsers ATS FR et peuvent pénaliser un CV sans que le candidat le sache.
function cleanText(text: string): string {
  return (text || '')
    // Nettoyage markdown résiduel
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    // Dashes : em-dash (—) et en-dash (–) → tiret ASCII
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    // Smart quotes → guillemets ASCII
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Ellipsis unicode (…) → trois points ASCII
    .replace(/\u2026/g, '...')
    // Zero-width chars (invisibles qui cassent la recherche keywords des ATS)
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '')
    // NBSP (espace insécable) → espace normal
    .replace(/\u00A0/g, ' ')
    .trim();
}

function cleanLines(text: string): string[] {
  return (text || '')
    .split('\n')
    .filter(l => l.trim())
    .map(l => cleanText(l.replace(/^[-•]\s*/, '')));
}

function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export function MinimalPdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    page: { padding: '18 32', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
    topAccent: { height: 3, backgroundColor: accentColor, marginBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
    photoCircle: {
      width: 54, height: 54, borderRadius: 27,
      backgroundColor: accentColor, alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    },
    initials: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#fff' },
    photoImg: { width: 54, height: 54, borderRadius: 27, flexShrink: 0 },
    headerInfo: { flex: 1 },
    name: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },
    titleText: { fontSize: 8.5, color: accentColor, marginBottom: 3 },
    contact: { fontSize: 7, color: '#888' },
    divider: { height: 0.5, backgroundColor: '#ddd', marginVertical: 8 },
    sectionTitle: {
      fontSize: 7.5, fontFamily: 'Helvetica-Bold',
      color: accentColor, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 5, marginTop: 10,
    },
    text: { fontSize: 7.5, lineHeight: 1.6, color: '#333', marginBottom: 3 },
    expBlock: { marginBottom: 6 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#aaa' },
    expCompany: { fontSize: 7.5, color: '#555', marginBottom: 2 },
    bullet: { fontSize: 7.5, marginLeft: 8, marginBottom: 1.5, lineHeight: 1.4, color: '#333' },
    twoCol: { flexDirection: 'row', gap: 20, marginTop: 6 },
    col: { flex: 1 },
    formationBlock: { marginBottom: 5 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111' },
    formationSchool: { fontSize: 7, color: '#555' },
    formationYear: { fontSize: 7, color: accentColor },
    // ⚠️ ATS : compétences en texte réel
    skillsText: { fontSize: 7.5, lineHeight: 1.7, color: '#111' },
  });

  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>

      {/* BARRE ACCENT TOP */}
      <View style={s.topAccent} />

      {/* EN-TÊTE */}
      <View style={s.headerRow}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}>
              <Text style={s.initials}>{initials}</Text>
            </View>
        }
        <View style={s.headerInfo}>
          <Text style={s.name}>
            {cleanText(formData.firstName)} {cleanText(formData.lastName)}
          </Text>
          <Text style={s.titleText}>{cleanText(formData.title)}</Text>
          <Text style={s.contact}>{contact}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* PROFIL */}
      {formData.summary && (
        <Text style={s.text}>{cleanText(formData.summary)}</Text>
      )}

      {/* EXPÉRIENCES */}
      {formData.experiences?.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>— Expériences</Text>
          {formData.experiences.map((exp, i) => (
            <View key={i} style={s.expBlock}>
              <View style={s.expHeader}>
                <Text style={s.expRole}>
                  {cleanText(exp.role)}
                  {exp.company ? `  ·  ${cleanText(exp.company)}` : ''}
                </Text>
                <Text style={s.expDate}>
                  {cleanText(exp.start)}{exp.end ? ` – ${cleanText(exp.end)}` : ''}
                </Text>
              </View>
              {cleanLines(exp.description).map((line, j) => (
                <Text key={j} style={s.bullet}>• {line}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* FORMATION + COMPÉTENCES */}
      <View style={s.twoCol}>

        {formData.education?.length > 0 && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>— Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationBlock}>
                <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
                <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
              </View>
            ))}
          </View>
        )}

        {formData.skills && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>— Compétences</Text>
            {/* ⚠️ ATS : texte réel lisible par les parseurs */}
            <Text style={s.skillsText}>
              {formatSkillsForPdf(formData.skills)}
            </Text>
          </View>
        )}

      </View>

    </Page>
  );
}