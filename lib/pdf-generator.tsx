import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { CVFormData } from "./types";

type CVPdfProps = {
  content: string;
  template?: string;
  photo?: string;
  formData?: CVFormData;
}

function getInitials(firstName?: string, lastName?: string) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

function cleanText(text: string): string {
  return (text || '')
    .replace(/=[^\x00-\x7F]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

function cleanLines(text: string): string[] {
  return (text || '').split('\n').filter(l => l.trim()).map(l =>
    cleanText(l.replace(/^[-•]\s*/, ''))
  );
}

// ─── TEMPLATE CLASSIQUE ───────────────────────────────────────────────

function ClassicPdf({ formData, photo }: { formData: CVFormData; photo?: string }) {
  const s = StyleSheet.create({
    page: { padding: '18 28', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
    header: { backgroundColor: '#111', padding: '14 18', marginBottom: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    photoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8151B', alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#fff' },
    photoImg: { width: 52, height: 52, borderRadius: 26 },
    name: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 2 },
    headerTitle: { fontSize: 8.5, color: '#aaa', marginBottom: 5 },
    accent: { height: 1.5, backgroundColor: '#F5C400', marginBottom: 4, width: 60 },
    headerContact: { fontSize: 7, color: '#ccc' },
    sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1.2, borderBottomColor: '#111', paddingBottom: 2, marginTop: 9, marginBottom: 4 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
    expDate: { fontSize: 7, color: '#666' },
    expCompany: { fontSize: 7.5, color: '#444', marginBottom: 1.5 },
    bullet: { fontSize: 7.5, marginLeft: 8, marginBottom: 1.5, lineHeight: 1.4 },
    text: { fontSize: 7.5, lineHeight: 1.5, marginBottom: 3 },
    skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    skillBadge: { backgroundColor: '#111', color: '#fff', fontSize: 6.5, padding: '2 6', borderRadius: 8 },
    formationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
    formationSchool: { fontSize: 7, color: '#555' },
    formationYear: { fontSize: 7, color: '#888' },
    expBlock: { marginBottom: 5 },
    twoCol: { flexDirection: 'row', gap: 20 },
    col: { flex: 1 },
  });

  const initials = getInitials(formData.firstName, formData.lastName);
  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View style={s.headerRow}>
          {photo
            ? <Image src={photo} style={s.photoImg} />
            : <View style={s.photoCircle}><Text style={s.initials}>{initials}</Text></View>
          }
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{cleanText(formData.firstName)} {cleanText(formData.lastName)}</Text>
            <Text style={s.headerTitle}>{cleanText(formData.title)}</Text>
            <View style={s.accent} />
            <Text style={s.headerContact}>{contact}</Text>
          </View>
        </View>
      </View>

      {formData.summary && (
        <>
          <Text style={s.sectionTitle}>Profil professionnel</Text>
          <Text style={s.text}>{cleanText(formData.summary)}</Text>
        </>
      )}

      {formData.experiences?.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Expériences professionnelles</Text>
          {formData.experiences.map((exp, i) => (
            <View key={i} style={s.expBlock}>
              <View style={s.expHeader}>
                <Text style={s.expTitle}>{cleanText(exp.role)}</Text>
                <Text style={s.expDate}>{cleanText(exp.start)}{exp.end ? ` – ${cleanText(exp.end)}` : ''}</Text>
              </View>
              <Text style={s.expCompany}>{cleanText(exp.company)}</Text>
              {cleanLines(exp.description).map((line, j) => (
                <Text key={j} style={s.bullet}>• {line}</Text>
              ))}
            </View>
          ))}
        </>
      )}

      <View style={s.twoCol}>
        {formData.education?.length > 0 && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationRow}>
                <View>
                  <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                  <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
                </View>
                <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
              </View>
            ))}
          </View>
        )}
        {formData.skills && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>Compétences</Text>
            <View style={s.skillRow}>
              {formData.skills.split(',').map((sk, i) => (
                <Text key={i} style={s.skillBadge}>{cleanText(sk)}</Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </Page>
  );
}

// ─── TEMPLATE MODERNE ─────────────────────────────────────────────────

function ModernPdf({ formData, photo }: { formData: CVFormData; photo?: string }) {
  const s = StyleSheet.create({
    page: { flexDirection: 'row', fontSize: 9, fontFamily: 'Helvetica' },
    left: { width: 155, backgroundColor: '#1B4F72', padding: '18 12', color: '#fff' },
    right: { flex: 1, padding: '18 16' },
    photoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2980B9', alignItems: 'center', justifyContent: 'center', marginBottom: 8, alignSelf: 'center' },
    initials: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#fff' },
    photoImg: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, alignSelf: 'center' },
    name: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center', marginBottom: 2 },
    leftTitle: { fontSize: 7, color: '#9bc', textAlign: 'center', marginBottom: 7 },
    leftAccent: { height: 1.5, backgroundColor: '#F5C400', marginBottom: 8 },
    leftSectionTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#F5C400', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginTop: 9 },
    leftText: { fontSize: 7, color: '#ccc', marginBottom: 2.5, lineHeight: 1.4 },
    skillBadge: { backgroundColor: '#2980B9', color: '#fff', fontSize: 6.5, padding: '2 5', borderRadius: 3, marginBottom: 2.5 },
    rightSectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#1B4F72', borderBottomWidth: 1.2, borderBottomColor: '#1B4F72', paddingBottom: 2, marginTop: 9, marginBottom: 4 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
    expDate: { fontSize: 7, color: '#888' },
    expCompany: { fontSize: 7.5, color: '#1B4F72', marginBottom: 1.5 },
    bullet: { fontSize: 7.5, marginLeft: 6, marginBottom: 1.5, lineHeight: 1.4, color: '#333' },
    text: { fontSize: 7.5, lineHeight: 1.5, marginBottom: 3, color: '#333' },
    accentBar: { width: 3, backgroundColor: '#F5C400', marginRight: 8, borderRadius: 1.5 },
    expRow: { flexDirection: 'row', marginBottom: 5 },
    formationBlock: { marginBottom: 4 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff' },
    formationSchool: { fontSize: 7, color: '#9bc' },
    formationYear: { fontSize: 6.5, color: '#F5C400' },
  });

  const initials = getInitials(formData.firstName, formData.lastName);

  return (
    <Page size="A4" style={s.page}>
      <View style={s.left}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}><Text style={s.initials}>{initials}</Text></View>
        }
        <Text style={s.name}>{cleanText(formData.firstName)} {cleanText(formData.lastName)}</Text>
        <Text style={s.leftTitle}>{cleanText(formData.title)}</Text>
        <View style={s.leftAccent} />

        <Text style={s.leftSectionTitle}>Contact</Text>
        {formData.email && <Text style={s.leftText}>{cleanText(formData.email)}</Text>}
        {formData.phone && <Text style={s.leftText}>{cleanText(formData.phone)}</Text>}
        {formData.city && <Text style={s.leftText}>{cleanText(formData.city)}</Text>}
        {formData.linkedin && <Text style={s.leftText}>{cleanText(formData.linkedin)}</Text>}

        {formData.skills && (
          <>
            <Text style={s.leftSectionTitle}>Compétences</Text>
            {formData.skills.split(',').map((sk, i) => (
              <Text key={i} style={s.skillBadge}>{cleanText(sk)}</Text>
            ))}
          </>
        )}

        {formData.education?.length > 0 && (
          <>
            <Text style={s.leftSectionTitle}>Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationBlock}>
                <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
                <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={s.right}>
        {formData.summary && (
          <>
            <Text style={{ ...s.rightSectionTitle, marginTop: 0 }}>Profil professionnel</Text>
            <Text style={s.text}>{cleanText(formData.summary)}</Text>
          </>
        )}

        {formData.experiences?.length > 0 && (
          <>
            <Text style={s.rightSectionTitle}>Expériences professionnelles</Text>
            {formData.experiences.map((exp, i) => (
              <View key={i} style={s.expRow}>
                <View style={s.accentBar} />
                <View style={{ flex: 1 }}>
                  <View style={s.expHeader}>
                    <Text style={s.expTitle}>{cleanText(exp.role)}</Text>
                    <Text style={s.expDate}>{cleanText(exp.start)}{exp.end ? ` – ${cleanText(exp.end)}` : ''}</Text>
                  </View>
                  <Text style={s.expCompany}>{cleanText(exp.company)}</Text>
                  {cleanLines(exp.description).map((line, j) => (
                    <Text key={j} style={s.bullet}>• {line}</Text>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </Page>
  );
}

// ─── TEMPLATE MINIMALISTE ─────────────────────────────────────────────

function MinimalistPdf({ formData, photo }: { formData: CVFormData; photo?: string }) {
  const s = StyleSheet.create({
    page: { padding: '18 32', fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
    topAccent: { height: 3, backgroundColor: '#E8151B', marginBottom: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
    photoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8151B', alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#fff' },
    photoImg: { width: 56, height: 56, borderRadius: 28 },
    name: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 2 },
    titleText: { fontSize: 8.5, color: '#E8151B', marginBottom: 3 },
    contact: { fontSize: 7, color: '#888' },
    divider: { height: 0.5, backgroundColor: '#ddd', marginVertical: 7 },
    sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#E8151B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 9 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    expTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
    expDate: { fontSize: 7, color: '#aaa' },
    expCompany: { fontSize: 7.5, color: '#555', marginBottom: 1.5 },
    bullet: { fontSize: 7.5, marginLeft: 8, marginBottom: 1.5, lineHeight: 1.4 },
    text: { fontSize: 7.5, lineHeight: 1.5, color: '#333', marginBottom: 2 },
    twoCol: { flexDirection: 'row', gap: 20 },
    col: { flex: 1 },
    skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
    skillBadge: { backgroundColor: '#111', color: '#fff', fontSize: 6.5, padding: '2 6', borderRadius: 8 },
    formationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2.5 },
    formationDegree: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
    formationSchool: { fontSize: 7, color: '#555' },
    formationYear: { fontSize: 7, color: '#E8151B' },
    expBlock: { marginBottom: 5 },
  });

  const initials = getInitials(formData.firstName, formData.lastName);
  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).map(cleanText).join('  ·  ');

  return (
    <Page size="A4" style={s.page}>
      <View style={s.topAccent} />

      <View style={s.headerRow}>
        {photo
          ? <Image src={photo} style={s.photoImg} />
          : <View style={s.photoCircle}><Text style={s.initials}>{initials}</Text></View>
        }
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{cleanText(formData.firstName)} {cleanText(formData.lastName)}</Text>
          <Text style={s.titleText}>{cleanText(formData.title)}</Text>
          <Text style={s.contact}>{contact}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {formData.summary && (
        <>
          <Text style={s.text}>{cleanText(formData.summary)}</Text>
          <View style={s.divider} />
        </>
      )}

      {formData.experiences?.length > 0 && (
        <>
          <Text style={s.sectionTitle}>— Expériences</Text>
          {formData.experiences.map((exp, i) => (
            <View key={i} style={s.expBlock}>
              <View style={s.expHeader}>
                <Text style={s.expTitle}>{cleanText(exp.role)} · {cleanText(exp.company)}</Text>
                <Text style={s.expDate}>{cleanText(exp.start)}{exp.end ? ` – ${cleanText(exp.end)}` : ''}</Text>
              </View>
              {cleanLines(exp.description).map((line, j) => (
                <Text key={j} style={s.bullet}>• {line}</Text>
              ))}
            </View>
          ))}
        </>
      )}

      <View style={s.twoCol}>
        {formData.education?.length > 0 && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>— Formation</Text>
            {formData.education.map((edu, i) => (
              <View key={i} style={s.formationRow}>
                <View>
                  <Text style={s.formationDegree}>{cleanText(edu.degree)}</Text>
                  <Text style={s.formationSchool}>{cleanText(edu.school)}</Text>
                </View>
                <Text style={s.formationYear}>{cleanText(edu.year)}</Text>
              </View>
            ))}
          </View>
        )}
        {formData.skills && (
          <View style={s.col}>
            <Text style={s.sectionTitle}>— Compétences</Text>
            <View style={s.skillRow}>
              {formData.skills.split(',').map((sk, i) => (
                <Text key={i} style={s.skillBadge}>{cleanText(sk)}</Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </Page>
  );
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────

export function CVPdf({ content, template = 'classic', photo, formData }: CVPdfProps) {
  if (formData) {
    if (template === 'modern') return <Document><ModernPdf formData={formData} photo={photo} /></Document>;
    if (template === 'minimal') return <Document><MinimalistPdf formData={formData} photo={photo} /></Document>;
    return <Document><ClassicPdf formData={formData} photo={photo} /></Document>;
  }
  return (
    <Document>
      <Page size="A4" style={{ padding: 40, fontSize: 10, fontFamily: 'Helvetica' }}>
        <View>
          {content.split('\n').map((line, i) => (
            <Text key={i} style={{ marginBottom: 2 }}>{cleanText(line)}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}