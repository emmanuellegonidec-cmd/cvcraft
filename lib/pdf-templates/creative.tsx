import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVFormData } from '../types';
import { formatSkillsForPdf, splitSkills } from '../cv-config';

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

export function CreativePdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    page: { padding: '0', fontSize: 9, fontFamily: 'Helvetica', color: '#111', flexDirection: 'row' },

    // Barre verticale accent gauche
    accentBar: { width: 8, backgroundColor: accentColor },

    // Contenu principal
    main: { flex: 1, padding: '20 24 20 20' },

    // En-tête
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    photoCircle: {
      width: 54, height: 54, borderRadius: 27,
      backgroundColor: '#f5f5f5', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
      borderWidth: 2, borderColor: accentColor,
    },
    initials: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: accentColor },
    photoImg: { width: 54, height: 54, borderRadius: 27, flexShrink: 0 },
    headerInfo: { flex: 1 },
    name: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },
    titleText: { fontSize: 8.5, color: accentColor, marginBottom: 4 },
    contact: { fontSize: 7, color: '#888' },

    // Titres de section avec puce carrée accent
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 5 },
    sectionDot: { width: 5, height: 5, backgroundColor: accentColor, borderRadius: 1 },
    sectionTitle: {
      fontSize: 7.5, fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase', letterSpacing: 0.8, color: '#111',
    },
    sectionLine: { flex: 1, height: 0.5, backgroundColor: '#eee' },

    // Profil
    text: { fontSize: 7.5, lineHeight: 1.6, color: '#333', marginBottom: 3 },

    // Expériences avec barre accent jaune
    expBlock: { marginBottom: 6 },
    expRow: { flexDirection: 'row', gap: 8 },
    expAccentBar: { width: 2.5, backgroundColor: accentColor, borderRadius: 1.5, marginTop: 2 },
    expContent: { flex: 1 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#aaa' },
    expCompany: { fontSize: 7.5, color: accentColor, marginBottom: 2 },
    bullet: { fontSize: 7.5, marginLeft: 6, marginBottom: 1.5, lineHeight: 1.4, color: '#333' },

    // Deux colonnes bas de page
    twoCol: { flexDirection: 'row', gap: 20, marginTop: 4 },
    col: { flex: 1 },

    // Formation
    formationBlock: { marginBottom: 5 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111' },
    formationSchool: { fontSize: 7, color: '#666' },
    formationYear: { fontSize: 7, color: accentColor, marginTop: 1 },

    // ⚠️ ATS : compétences en texte réel
    // Visuellement des badges bicolores mais chaque badge contient un <Text> réel
    skillsText: { fontSize: 7.5, lineHeight: 1.7, color: '#111' },
    skillBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
    skillBadge: {
      borderRadius: 3, paddingTop: 2, paddingBottom: 2,
      paddingLeft: 6, paddingRight: 6,
      borderWidth: 1, borderColor: accentColor,
    },
    skillBadgeText: { fontSize: 6.5, color: accentColor },
  });

  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>

      {/* BARRE VERTICALE ACCENT */}
      <View style={s.accentBar} />

      {/* CONTENU PRINCIPAL */}
      <View style={s.main}>

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

        {/* PROFIL */}
        {formData.summary && (
          <View>
            <View style={s.sectionRow}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Profil professionnel</Text>
              <View style={s.sectionLine} />
            </View>
            <Text style={s.text}>{cleanText(formData.summary)}</Text>
          </View>
        )}

        {/* EXPÉRIENCES */}
        {formData.experiences?.length > 0 && (
          <View>
            <View style={s.sectionRow}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Expériences professionnelles</Text>
              <View style={s.sectionLine} />
            </View>
            {formData.experiences.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.expRow}>
                  <View style={s.expAccentBar} />
                  <View style={s.expContent}>
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
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FORMATION + COMPÉTENCES */}
        <View style={s.twoCol}>

          {formData.education?.length > 0 && (
            <View style={s.col}>
              <View style={s.sectionRow}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitle}>Formation</Text>
                <View style={s.sectionLine} />
              </View>
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
              <View style={s.sectionRow}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitle}>Compétences</Text>
                <View style={s.sectionLine} />
              </View>
              {/* ⚠️ ATS : texte réel lisible par les parseurs */}
              <Text style={s.skillsText}>
                {formatSkillsForPdf(formData.skills)}
              </Text>
              
            </View>
          )}

        </View>

      </View>

    </Page>
  );
}