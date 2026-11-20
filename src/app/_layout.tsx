import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { studentSchema } from '../data/students';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Unable to open local storage</Text>
      <Text style={styles.body}>Free some space on your phone, then reopen the app. Existing registrations have not been cleared.</Text>
      <Text accessibilityRole="button" onPress={retry} style={styles.retry}>Try again</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" color="#17634A" /><Text style={styles.body}>Opening your local directory…</Text></View>}>
      <SQLiteProvider databaseName="nfc-prototype.db" onInit={async (db) => { await db.execAsync(studentSchema); }} useSuspense>
        <Stack screenOptions={{ headerShown: false }} />
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 32, gap: 20, justifyContent: 'center', backgroundColor: '#F8FAF7' },
  title: { fontSize: 24, fontWeight: '700', color: '#182D25' },
  body: { fontSize: 16, lineHeight: 24, color: '#52645B' },
  retry: { color: '#17634A', fontSize: 16, minHeight: 48, paddingVertical: 14, fontWeight: '700' },
});
