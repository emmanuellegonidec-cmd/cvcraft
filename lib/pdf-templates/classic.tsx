import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVFormData } from '../types';
import { formatSkillsForPdf, splitSkills } from '../cv-config';

interface Props {
  formData: CVFormData;
  accentColor: string;
  fontFamily: string;
  photo?: string;
}

function cleanText(text: string): string {
  return (text || '')
    .replace(/=[^\x00-\x7F]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
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

export function ClassicPdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    page: { padding: '18 28', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
    header: { backgroundColor: '#111', padding: '14 18', marginBottom: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    photoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#fff' },
    photoImg: { width: 52, height: 52, borderRadius: 26 },
    headerInfo: { flex: 1 },
    name: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 2 },
    headerTitle: { fontSize: 8.5, color: '#ccc', marginBottom: 5 },
    accentLine: { height: 1.5, backgroundColor: accentColor, marginBottom: 4, width: 60 },
    headerContact: { fontSize: 7, color: '#aaa' },
    sectionTitle: {
      fontSize: 7.5, fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase', letterSpacing: 1,
      borderBottomWidth: 1.2, borderBottomColor: accentColor,
      paddingBottom: 2, marginTop: 10, marginBottom: 5, color: '#111',
    },
    expBlock: { marginBottom: 6 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#666' },
    expCompany: { fontSize: 7.5, color: accentColor, marginBottom: 2 },
    bullet: { fontSize: 7.5, marginLeft: 8, marginBottom: 1.5, lineHeight: 1.4, color: '#333' },
    text: { fontSize: 7.5, lineHeight: 1.5, color: '#333', marginBottom: 3 },
    twoCol: { flexDirection: 'row', gap: 20, marginTop: 4 },
    col: { flex: 1 },
    // ⚠️ RÈGLE ATS : compétences en texte réel, pas en image
    // Les skills sont affichés en texte continu séparé par " · "
    // Un fond coloré peut entourer le texte mais le <Text> doit rester lisible
    skillsText: { fontSize: 7.5, lineHeight: 1.6, color: '#111' },
    skillBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    skillBadge: {
      backgroundColor: '#111', borderRadius: 8,
      paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6,
    },
    skillBadgeText: { fontSize: 6.5, color: '#fff' },
    formationBlock: { marginBottom: 4 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111' },
    formationSchool: { fontSize: 7, color: '#555' },
    formationYear: { fontSize: 7, color: accentColor },
  });

  const contact = [
    formData.email,
    formData.phone,
    formData.city,
    formData.linkedin,
  ].filter(Boolean).map(cleanText).join('  ·  ');

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>

      {/* EN-TÊTE */}
      <View style={s.header}>
        <View style={s.headerRow}>
          {photo
            ? <Image src={photo} style={s.photoImg} />
            : <View style={s.photoCircle}>
                <Text style={s.initials}>{initials}</Text>
              </View>
          }
          <View style={s.headerInfo}>
            <Text style={s.name}>{cleanText(formData.firstName)} {cleanText(formData.lastName)}</Text>
            <Text style={s.headerTitle}>{cleanText(formData.title)}</Text>
            <View style={s.accentLine} />
            <Text style={s.headerContact}>{contact}</Text>
          </View>
        </View>
      </View>

      {/* PROFIL */}
      {formData.summary && (
        <View>
          <Text style={s.sectionTitle}>Profil professionnel</Text>
          <Text style={s.text}>{cleanText(formData.summary)}</Text>
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
        </View>
      )}

      {/* FORMATION + COMPÉTENCES côte à côte */}
      <View style={s.twoCol}>

        {formData.education?.length > 0 && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>Formation</Text>
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
            <Text style={s.sectionTitle}>Compétences</Text>
            {/* ⚠️ ATS : texte réel lisible par les parseurs */}
            <Text style={s.skillsText}>
              {formatSkillsForPdf(formData.skills)}
            </Text>
            {/* Rendu visuel badges (texte réel dans chaque badge) */}
            <View style={s.skillBadgeRow}>
              {splitSkills(formData.skills).map((sk, i) => (
                <View key={i} style={s.skillBadge}>
                  <Text style={s.skillBadgeText}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </View>

    </Page>
  );
}