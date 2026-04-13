import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVFormData } from '../types';
import { formatSkillsForPdf } from '../cv-config';

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

export function ExecutivePdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    // Template le plus ATS-friendly : texte pur linéaire, aucune colonne,
    // aucun élément graphique complexe — meilleur score ATS possible
    page: { padding: '22 36', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },

    // Filets haut et bas de page
    topLine: { height: 2, backgroundColor: '#111', marginBottom: 14 },
    bottomLine: { height: 2, backgroundColor: '#111', marginTop: 'auto' },

    // En-tête sobre et centré
    header: { alignItems: 'center', marginBottom: 10 },
    photoCircle: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: '#f5f5f5', alignItems: 'center',
      justifyContent: 'center', marginBottom: 8,
      borderWidth: 1, borderColor: '#ccc',
    },
    initials: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111' },
    photoImg: { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
    name: {
      fontSize: 14, fontFamily: 'Helvetica-Bold',
      color: '#111', textAlign: 'center',
      letterSpacing: 2, textTransform: 'uppercase',
      marginBottom: 3,
    },
    titleText: {
      fontSize: 8, color: '#555',
      textAlign: 'center', letterSpacing: 0.8,
      marginBottom: 5,
    },
    headerDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
    headerLine: { flex: 1, height: 0.5, backgroundColor: '#ccc' },
    headerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: accentColor },
    contact: {
      fontSize: 7, color: '#888',
      textAlign: 'center', letterSpacing: 0.3,
    },

    // Séparateur section
    sectionDivider: { height: 0.5, backgroundColor: '#ddd', marginVertical: 8 },

    // Titres de section — sobre, uppercase, filet bas
    sectionTitle: {
      fontSize: 7.5, fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase', letterSpacing: 1.5,
      color: '#111', borderBottomWidth: 0.8,
      borderBottomColor: accentColor,
      paddingBottom: 2, marginTop: 10, marginBottom: 6,
    },

    // Profil
    text: { fontSize: 7.5, lineHeight: 1.7, color: '#333', marginBottom: 4 },

    // Expériences — layout sobre avec date alignée à droite
    expBlock: { marginBottom: 7 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#888', fontStyle: 'italic' },
    expCompanyRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
    expCompany: { fontSize: 7.5, color: accentColor },
    bullet: { fontSize: 7.5, marginLeft: 10, marginBottom: 1.5, lineHeight: 1.5, color: '#333' },

    // Formation — affichage compact en ligne
    formationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    formationLeft: { flex: 1 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111' },
    formationSchool: { fontSize: 7, color: '#666', fontStyle: 'italic' },
    formationYear: { fontSize: 7, color: accentColor, textAlign: 'right' },

    // ⚠️ ATS : compétences en texte pur — meilleur format possible
    // Une ligne de texte simple, pas de tableau, pas de badge
    skillsText: { fontSize: 7.5, lineHeight: 1.8, color: '#333' },
  });

  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>

      {/* FILET HAUT */}
      <View style={s.topLine} />

      {/* EN-TÊTE CENTRÉ */}
      <View style={s.header}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}>
              <Text style={s.initials}>{initials}</Text>
            </View>
        }
        <Text style={s.name}>
          {cleanText(formData.firstName)} {cleanText(formData.lastName)}
        </Text>
        <Text style={s.titleText}>{cleanText(formData.title)}</Text>
        <View style={s.headerDividerRow}>
          <View style={s.headerLine} />
          <View style={s.headerDot} />
          <View style={s.headerLine} />
        </View>
        <Text style={s.contact}>{contact}</Text>
      </View>

      <View style={s.sectionDivider} />

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
              <View style={s.expCompanyRow}>
                <Text style={s.expCompany}>{cleanText(exp.company)}</Text>
              </View>
              {cleanLines(exp.description).map((line, j) => (
                <Text key={j} style={s.bullet}>– {line}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* FORMATION */}
      {formData.education?.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>Formation</Text>
          {formData.education.map((edu, i) => (
            <View key={i} style={s.formationRow}>
              <View style={s.formationLeft}>
                <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
              </View>
              <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* COMPÉTENCES */}
      {formData.skills && (
        <View>
          <Text style={s.sectionTitle}>Compétences</Text>
          {/* ⚠️ ATS : texte pur — meilleur format pour les parseurs */}
          <Text style={s.skillsText}>
            {formatSkillsForPdf(formData.skills)}
          </Text>
        </View>
      )}

      {/* FILET BAS */}
      <View style={s.bottomLine} />

    </Page>
  );
}