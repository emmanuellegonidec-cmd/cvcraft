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

export function ElegantPdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    page: { padding: '22 36', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },

    // En-tête centré
    header: { alignItems: 'center', marginBottom: 14 },
    photoCircle: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: '#f0f0f0', alignItems: 'center',
      justifyContent: 'center', marginBottom: 8,
      borderWidth: 1.5, borderColor: accentColor,
    },
    initials: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: accentColor },
    photoImg: { width: 56, height: 56, borderRadius: 28, marginBottom: 8 },
    name: {
      fontSize: 16, fontFamily: 'Helvetica-Bold',
      color: '#111', textAlign: 'center',
      letterSpacing: 1.5, marginBottom: 4,
    },
    titleText: {
      fontSize: 8.5, color: '#555',
      textAlign: 'center', marginBottom: 6,
      letterSpacing: 0.5,
    },
    headerDivider: {
      height: 0.8, backgroundColor: accentColor,
      width: 80, marginBottom: 6, alignSelf: 'center',
    },
    contact: {
      fontSize: 7, color: '#888',
      textAlign: 'center', letterSpacing: 0.3,
    },

    // Séparateur élégant
    sectionDivider: { height: 0.5, backgroundColor: '#ddd', marginVertical: 10 },

    // Titres de section centrés
    sectionTitle: {
      fontSize: 8, fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase', letterSpacing: 1.5,
      color: accentColor, textAlign: 'center',
      marginBottom: 6, marginTop: 2,
    },

    // Profil
    text: { fontSize: 7.5, lineHeight: 1.7, color: '#444', textAlign: 'center', marginBottom: 4 },

    // Expériences
    expBlock: { marginBottom: 7 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#888', fontStyle: 'italic' },
    expCompany: { fontSize: 7.5, color: accentColor, marginBottom: 2 },
    bullet: { fontSize: 7.5, marginLeft: 8, marginBottom: 1.5, lineHeight: 1.4, color: '#444' },

    // Deux colonnes bas de page
    twoCol: { flexDirection: 'row', gap: 24, marginTop: 4 },
    col: { flex: 1 },

    // Formation
    formationBlock: { marginBottom: 5 },
    formationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111' },
    formationSchool: { fontSize: 7, color: '#666', fontStyle: 'italic' },
    formationYear: { fontSize: 7, color: accentColor },

    // ⚠️ ATS : compétences en texte réel
    skillsText: { fontSize: 7.5, lineHeight: 1.7, color: '#444' },
  });

  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>

      {/* EN-TÊTE CENTRÉ */}
      <View style={s.header}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}>
              <Text style={s.initials}>{initials}</Text>
            </View>
        }
        <Text style={s.name}>
          {cleanText(formData.firstName).toUpperCase()} {cleanText(formData.lastName).toUpperCase()}
        </Text>
        <Text style={s.titleText}>{cleanText(formData.title)}</Text>
        <View style={s.headerDivider} />
        <Text style={s.contact}>{contact}</Text>
      </View>

      <View style={s.sectionDivider} />

      {/* PROFIL */}
      {formData.summary && (
        <View>
          <Text style={s.sectionTitle}>Profil</Text>
          <Text style={s.text}>{cleanText(formData.summary)}</Text>
          <View style={s.sectionDivider} />
        </View>
      )}

      {/* EXPÉRIENCES */}
      {formData.experiences?.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>Expériences professionnelles</Text>
          {formData.experiences.map((exp, i) => (
            <View key={i} style={s.expBlock}>
              <View style={s.expHeader}>
                <Text style={s.expRole}>{cleanText(exp.role)}</Text>
                <Text style={s.expDate}>
                  {cleanText(exp.start)}{exp.end ? ` – ${cleanText(exp.end)}` : ''}
                </Text>
              </View>
              <Text style={s.expCompany}>{cleanText(exp.company)}</Text>
              {cleanLines(exp.description).map((line, j) => (
                <Text key={j} style={s.bullet}>• {line}</Text>
              ))}
            </View>
          ))}
          <View style={s.sectionDivider} />
        </View>
      )}

      {/* FORMATION + COMPÉTENCES */}
      <View style={s.twoCol}>

        {formData.education?.length > 0 && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationBlock}>
                <View style={s.formationRow}>
                  <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                  <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
                </View>
                <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
              </View>
            ))}
          </View>
        )}

        {formData.skills && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>Compétences</Text>
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