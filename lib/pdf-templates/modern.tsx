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

export function ModernPdf({ formData, accentColor, fontFamily, photo }: Props) {
  const s = StyleSheet.create({
    // ⚠️ ATS : template 2 colonnes — la colonne DROITE (contenu principal)
    // est rendue EN PREMIER dans le flux PDF pour que les ATS lisent
    // les expériences avant les compétences. La mise en page visuelle
    // est gérée par flexDirection:'row' mais l'ordre du code = ordre de lecture ATS.
    page: { flexDirection: 'row', fontSize: 9, fontFamily: 'Helvetica' },

    // Colonne droite — contenu principal (rendue en premier dans le code)
    right: { flex: 1, padding: '18 16', color: '#111' },
    rightName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },
    rightTitle: { fontSize: 8.5, color: accentColor, marginBottom: 10 },
    sectionTitle: {
      fontSize: 7.5, fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase', letterSpacing: 0.8,
      color: accentColor, borderBottomWidth: 1.2,
      borderBottomColor: accentColor, paddingBottom: 2,
      marginTop: 10, marginBottom: 5,
    },
    expBlock: { marginBottom: 6 },
    expRow: { flexDirection: 'row', marginBottom: 1 },
    accentBar: { width: 3, backgroundColor: accentColor, marginRight: 8, borderRadius: 1.5 },
    expRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#888' },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expCompany: { fontSize: 7.5, color: '#555', marginBottom: 2 },
    bullet: { fontSize: 7.5, marginLeft: 6, marginBottom: 1.5, lineHeight: 1.4, color: '#333' },
    text: { fontSize: 7.5, lineHeight: 1.5, color: '#333', marginBottom: 3 },

    // Colonne gauche — sidebar (rendue après dans le code = après dans l'ATS)
    left: { width: 150, backgroundColor: accentColor, padding: '18 12', color: '#fff' },
    photoCircle: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: '#fff', alignItems: 'center',
      justifyContent: 'center', marginBottom: 10, alignSelf: 'center',
    },
    initials: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: accentColor },
    photoImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 10, alignSelf: 'center' },
    leftName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center', marginBottom: 3 },
    leftTitle: { fontSize: 7, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 8 },
    leftAccent: { height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 10 },
    leftSectionTitle: {
      fontSize: 6.5, fontFamily: 'Helvetica-Bold',
      color: '#fff', textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: 4, marginTop: 10,
    },
    leftText: { fontSize: 7, color: 'rgba(255,255,255,0.85)', marginBottom: 2.5, lineHeight: 1.4 },
    // ⚠️ ATS : compétences sidebar en texte réel lisible
    skillsText: { fontSize: 7, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 },
    formationBlock: { marginBottom: 5 },
    formationDegree: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#fff' },
    formationSchool: { fontSize: 6.5, color: 'rgba(255,255,255,0.7)' },
    formationYear: { fontSize: 6.5, color: 'rgba(255,255,255,0.9)' },
  });

  const initials = getInitials(formData.firstName, formData.lastName);
  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText);

  return (
    <Page size="A4" style={s.page}>

      {/* ── COLONNE DROITE EN PREMIER (ordre ATS) ── */}
      <View style={s.right}>
        <Text style={s.rightName}>
          {cleanText(formData.firstName)} {cleanText(formData.lastName)}
        </Text>
        <Text style={s.rightTitle}>{cleanText(formData.title)}</Text>

        {formData.summary && (
          <View>
            <Text style={s.sectionTitle}>Profil professionnel</Text>
            <Text style={s.text}>{cleanText(formData.summary)}</Text>
          </View>
        )}

        {formData.experiences?.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Expériences professionnelles</Text>
            {formData.experiences.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.expRow}>
                  <View style={s.accentBar} />
                  <View style={{ flex: 1 }}>
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
      </View>

      {/* ── COLONNE GAUCHE EN SECOND (sidebar, après dans l'ATS) ── */}
      <View style={s.left}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}>
              <Text style={s.initials}>{initials}</Text>
            </View>
        }

        <Text style={s.leftName}>
          {cleanText(formData.firstName)} {cleanText(formData.lastName)}
        </Text>
        <Text style={s.leftTitle}>{cleanText(formData.title)}</Text>
        <View style={s.leftAccent} />

        <Text style={s.leftSectionTitle}>Contact</Text>
        {contact.map((v, i) => (
          <Text key={i} style={s.leftText}>{v}</Text>
        ))}

        {formData.skills && (
          <View>
            <Text style={s.leftSectionTitle}>Compétences</Text>
            {/* ⚠️ ATS : texte réel, pas une image */}
            <Text style={s.skillsText}>
              {formatSkillsForPdf(formData.skills)}
            </Text>
          </View>
        )}

        {formData.education?.length > 0 && (
          <View>
            <Text style={s.leftSectionTitle}>Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationBlock}>
                <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
                <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

    </Page>
  );
}