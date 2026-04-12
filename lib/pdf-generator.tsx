import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2, color: "#333" },
  contact: { fontSize: 9, color: "#555", marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, borderBottomWidth: 1.5, borderBottomColor: "#111", paddingBottom: 3, marginTop: 14, marginBottom: 6 },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 },
  bullet: { fontSize: 9.5, marginLeft: 10, marginBottom: 2, lineHeight: 1.5 },
  text: { fontSize: 9.5, lineHeight: 1.6, marginBottom: 3 },
  separator: { height: 0 },
});

function parseLine(line: string) {
  // Retire les marqueurs markdown résiduels pour le PDF
  return line
    .replace(/=[^\x00-\x7F]/g, '')   // supprime les artefacts =ç =ñ =Í (icônes LinkedIn)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-•]\s*/, '')
    .trim();
}

export function CVPdf({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('# ')) {
      elements.push(<Text key={i} style={styles.name}>{parseLine(trimmed.replace(/^# /, ''))}</Text>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<Text key={i} style={styles.sectionTitle}>{parseLine(trimmed.replace(/^## /, ''))}</Text>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<Text key={i} style={styles.h3}>{parseLine(trimmed.replace(/^### /, ''))}</Text>);
    } else if (trimmed.startsWith('---')) {
      // séparateur ignoré, déjà géré par sectionTitle
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(<Text key={i} style={styles.bullet}>• {parseLine(trimmed)}</Text>);
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes('|')) {
      // Ligne entièrement en gras = sous-titre
      elements.push(<Text key={i} style={styles.h3}>{parseLine(trimmed)}</Text>);
    } else {
      elements.push(<Text key={i} style={styles.text}>{parseLine(trimmed)}</Text>);
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>{elements}</View>
      </Page>
    </Document>
  );
}