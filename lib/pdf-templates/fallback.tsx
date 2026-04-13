import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function FallbackPdf({ content }: { content: string }) {
  const s = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
    line: { marginBottom: 2, lineHeight: 1.5 },
  });

  const lines = (content || '')
    .split('\n')
    .map(l => l.replace(/[#*]/g, '').trim())
    .filter(Boolean);

  return (
    <Page size="A4" style={s.page}>
      <View>
        {lines.map((line, i) => (
          <Text key={i} style={s.line}>{line}</Text>
        ))}
      </View>
    </Page>
  );
}