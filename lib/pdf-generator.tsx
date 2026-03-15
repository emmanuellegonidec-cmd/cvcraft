import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica"
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold"
  },
  section: {
    marginBottom: 10
  }
});

export function CVPdf({ content }: { content: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>CV</Text>
          <Text>{content}</Text>
        </View>
      </Page>
    </Document>
  );
}