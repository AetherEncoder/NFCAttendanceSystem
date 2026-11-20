import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import NfcManager, { type TagEvent } from 'react-native-nfc-manager';
import { insertStudentSql, normalizeUid, registrationValues, type Student } from '../data/students';
import { useNfc } from '../lib/use-nfc';

type Scan = { uid: string; technologies: string[]; student: Student | null };

export default function ScanScreen() {
  const db = useSQLiteContext();
  const [scan, setScan] = useState<Scan | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(() => db.getFirstSync<{ total: number }>('SELECT count(*) AS total FROM students')?.total ?? 0);
  const locked = useRef(false);
  const lastRead = useRef({ uid: '', time: 0 });
  const scroll = useRef<ScrollView>(null);
  const numberInput = useRef<TextInput>(null);
  const courseInput = useRef<TextInput>(null);
  const registering = scan !== null && scan.student === null;

  const reset = useCallback(() => {
    Keyboard.dismiss();
    locked.current = false;
    setScan(null);
    setSaved(false);
    setError('');
    setName('');
    setNumber('');
    setCourse('');
    lastRead.current = { uid: '', time: 0 };
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!scan) return false;
      if (registering && (name.trim() || number.trim() || course.trim())) {
        Keyboard.dismiss();
        Alert.alert('Discard unsaved details?', 'This card has not been registered yet.', [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: reset },
        ]);
        return true;
      }
      reset();
      return true;
    });
    return () => subscription.remove();
  }, [scan, registering, name, number, course, reset]);

  const onTag = useCallback((tag: TagEvent) => {
    if (locked.current || AppState.currentState !== 'active') return;
    try {
      const uid = normalizeUid(tag.id);
      const now = Date.now();
      if (lastRead.current.uid === uid && now - lastRead.current.time < 1500) return;
      lastRead.current = { uid, time: now };
      const student = db.getFirstSync<Student>('SELECT * FROM students WHERE uid = ?', uid);
      locked.current = !student;
      setScan({ uid, technologies: tag.techTypes ?? [], student });
      setName('');
      setNumber('');
      setCourse('');
      setSaved(false);
      setError('');
      Vibration.vibrate(student ? 70 : [0, 60, 60, 60]);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes('usable NFC ID')
        ? cause.message
        : 'Unable to look up this card. Remove it and try again. If it continues, reopen the app.');
    }
  }, [db]);

  const { status, retry } = useNfc(onTag, registering);

  function saveStudent() {
    if (!scan || scan.student || saving) return;
    setSaving(true);
    setError('');
    try {
      const values = registrationValues(scan.uid, name, number, course, scan.technologies);
      const existing = db.getFirstSync<Student>('SELECT * FROM students WHERE uid = ?', scan.uid);
      if (existing) throw new Error('This card is already registered. Discard this form and scan again.');
      if (values[2] && db.getFirstSync('SELECT id FROM students WHERE student_number = ? COLLATE NOCASE', values[2])) {
        throw new Error('That student number is already linked to another card. Check the number before saving.');
      }
      let student: Student | null = null;
      db.withTransactionSync(() => {
        const result = db.runSync(insertStudentSql, ...values);
        student = db.getFirstSync<Student>('SELECT * FROM students WHERE id = ?', result.lastInsertRowId);
        if (!student) throw new Error('Unable to verify the saved student.');
      });
      setScan({ ...scan, student });
      setCount((value) => value + 1);
      setSaved(true);
      locked.current = false;
      setName('');
      setNumber('');
      setCourse('');
      Keyboard.dismiss();
      Vibration.vibrate(70);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(/^(Enter |Keep |That student |This card )/.test(message)
        ? message
        : 'Could not save on this phone. Your details are still here. Check available storage and try again.');
    } finally {
      setSaving(false);
    }
  }

  const statusText = {
    starting: 'Starting NFC reader…',
    ready: 'NFC ready',
    paused: registering ? 'Scan paused while registering' : 'Scanner paused',
    disabled: 'NFC is turned off',
    unsupported: 'This phone has no NFC reader',
    error: 'Could not start NFC',
  }[status];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.header}>
            <View style={styles.brand}><MaterialIcons name="contactless" size={28} color={colors.primary} /><Text style={styles.appName}>NFC Attendance</Text></View>
            <Text style={styles.prototype}>Local prototype</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLabel}><View style={[styles.dot, { backgroundColor: status === 'ready' ? colors.primary : colors.muted }]} /><Text style={styles.statusText} accessibilityLiveRegion="polite">{statusText}</Text></View>
            <Text style={styles.count}>{count} saved</Text>
          </View>

          {!registering && (status === 'disabled' || status === 'unsupported' || status === 'error') && (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>{status === 'disabled' ? 'Turn on NFC to scan' : status === 'unsupported' ? 'Use an NFC-capable phone' : 'The scanner needs a retry'}</Text>
              <Text style={styles.body}>{status === 'disabled' ? 'Enable NFC in your phone’s settings, then return here.' : status === 'unsupported' ? 'This prototype needs a phone with a built-in NFC reader.' : 'Remove the card from your phone, then try starting the reader again.'}</Text>
              {status === 'disabled' && <Action label="Open NFC settings" secondary onPress={() => { void NfcManager.goToNfcSetting().catch(() => setError('Open your phone’s Settings and turn on NFC, then return here.')); }} />}
              {status !== 'unsupported' && <Action label="Retry scanner" secondary onPress={retry} />}
            </View>
          )}

          {!scan ? (
            <View style={styles.scanArea}>
              <View style={styles.scanSymbol}><MaterialIcons name="contactless" size={76} color={colors.primary} /></View>
              <Text style={styles.headline}>Tap a student ID</Text>
              <Text style={styles.scanHint}>Hold the card against the back of your phone until it’s read.</Text>
              <View style={styles.scanDivider} />
              <Text style={styles.scanFoot}>A new card opens registration.{ '\n' }A saved card shows the student.</Text>
            </View>
          ) : registering ? (
            <View style={styles.content}>
              <View style={styles.sectionTitle}><MaterialIcons name="person-add-alt-1" size={28} color={colors.primary} /><Text style={styles.headline}>New card found</Text></View>
              <Text style={styles.body}>Enter the student’s details to link this card. You can remove the card now.</Text>
              <CardId uid={scan.uid} technologies={scan.technologies} />
              <View style={styles.form}>
                <Field label="Full name" value={name} onChangeText={setName} placeholder="As shown on the student ID" maxLength={120} autoCapitalize="words" autoComplete="name" returnKeyType="next" onSubmitEditing={() => numberInput.current?.focus()} />
                <Field inputRef={numberInput} label="Student number (optional)" value={number} onChangeText={setNumber} placeholder="e.g. 2026-00123" maxLength={50} autoCapitalize="characters" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => courseInput.current?.focus()} />
                <Field inputRef={courseInput} label="Course / section (optional)" value={course} onChangeText={setCourse} placeholder="e.g. BSCS 1-A" maxLength={100} autoCapitalize="words" returnKeyType="done" onSubmitEditing={saveStudent} />
              </View>
            </View>
          ) : (
            <View style={styles.result} accessibilityLiveRegion="polite">
              <View style={styles.resultHeading}><MaterialIcons name="check-circle" size={26} color={colors.primary} /><Text style={styles.resultLabel}>{saved ? 'Saved on this phone' : 'Student found'}</Text></View>
              <Text style={styles.studentName}>{scan.student?.full_name}</Text>
              {scan.student?.student_number ? <Text style={styles.studentNumber}>{scan.student.student_number}</Text> : null}
              {scan.student?.course_section ? <Text style={styles.body}>{scan.student.course_section}</Text> : null}
              <CardId uid={scan.uid} technologies={scan.technologies} />
              <Text style={styles.body}>{saved ? 'Tap this card again any time to look up the student.' : 'This card is linked to a student in your local directory.'}</Text>
            </View>
          )}

          {error ? <View style={styles.error} accessibilityLiveRegion="assertive"><MaterialIcons name="error-outline" color={colors.error} size={22} /><Text style={styles.errorText}>{error}</Text></View> : null}

          {registering ? (
            <View style={styles.actions}>
              <Action label={saving ? 'Saving…' : 'Save student on phone'} onPress={saveStudent} disabled={saving} />
              <Action label={name.trim() || number.trim() || course.trim() ? 'Discard and scan next' : 'Cancel and scan next'} secondary onPress={reset} disabled={saving} />
            </View>
          ) : scan ? (
            <View style={styles.actions}><Action label="Scan next card" onPress={reset} /><Text style={styles.centerNote}>You can also tap the next card right away.</Text></View>
          ) : null}

          <View style={styles.footer}>
            <MaterialIcons name="phone-android" size={19} color={colors.muted} />
            <Text style={styles.footerText}>Stored only on this phone. Works offline.</Text>
          </View>
          <Text style={styles.limitNote}>Prototype: card lookup only. No attendance is recorded.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, (pressed || disabled) && styles.pressed]}><Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text></Pressable>;
}

function Field({ label, inputRef, ...props }: React.ComponentProps<typeof TextInput> & { label: string; inputRef?: React.Ref<TextInput> }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput ref={inputRef} accessibilityLabel={label} style={styles.input} placeholderTextColor={colors.muted} selectionColor={colors.primary} {...props} /></View>;
}

function CardId({ uid, technologies }: { uid: string; technologies: string[] }) {
  return <View style={styles.cardId}><Text style={styles.cardIdLabel}>Card ID</Text><Text selectable style={styles.uid}>{uid.match(/.{2}/g)?.join(' ')}</Text>{technologies.length ? <Text style={styles.technologies}>{technologies.map((value) => value.replace('android.nfc.tech.', '')).join(' · ')}</Text> : null}</View>;
}

const colors = { primary: '#17634A', onPrimary: '#FFFFFF', surface: '#F8FAF7', surfaceVariant: '#EAF1EA', ink: '#182D25', muted: '#52645B', outline: '#8B9D90', error: '#A52A24', errorSurface: '#FFF0ED' };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.surface },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { gap: 5, marginBottom: 28 },
  brand: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  appName: { fontSize: 22, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  prototype: { fontSize: 14, color: colors.muted, marginLeft: 38 },
  statusRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 },
  statusLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  count: { color: colors.muted, fontSize: 14, fontVariant: ['tabular-nums'] },
  scanArea: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceVariant, paddingHorizontal: 24, paddingVertical: 44, borderRadius: 16, minHeight: 375, marginBottom: 24 },
  scanSymbol: { marginBottom: 25 },
  headline: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.5, color: colors.ink, flexShrink: 1 },
  scanHint: { fontSize: 17, lineHeight: 26, color: colors.muted, textAlign: 'center', marginTop: 14, maxWidth: 290 },
  scanDivider: { width: 40, height: 1, backgroundColor: colors.outline, marginVertical: 26 },
  scanFoot: { color: colors.muted, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  content: { gap: 16 },
  sectionTitle: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  cardId: { paddingVertical: 18, gap: 7, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CDD9CD', marginVertical: 6 },
  cardIdLabel: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  uid: { color: colors.ink, fontSize: 17, lineHeight: 25, fontFamily: 'monospace' },
  technologies: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  form: { gap: 20 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: { minHeight: 56, borderRadius: 8, borderWidth: 1, borderColor: colors.outline, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, color: colors.ink, fontSize: 16 },
  result: { gap: 16, paddingVertical: 20, paddingBottom: 28 },
  resultHeading: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  resultLabel: { fontSize: 16, fontWeight: '600', color: colors.primary, flexShrink: 1 },
  studentName: { fontSize: 34, lineHeight: 42, fontWeight: '700', letterSpacing: -0.6, color: colors.ink },
  studentNumber: { fontSize: 20, color: colors.ink, fontWeight: '500' },
  actions: { gap: 12, marginTop: 24 },
  button: { minHeight: 56, borderRadius: 28, backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: colors.surfaceVariant },
  buttonText: { fontSize: 16, lineHeight: 24, color: colors.onPrimary, fontWeight: '700', textAlign: 'center' },
  secondaryButtonText: { color: colors.primary },
  pressed: { opacity: 0.65 },
  centerNote: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
  error: { backgroundColor: colors.errorSurface, padding: 16, borderRadius: 12, gap: 10, flexDirection: 'row', marginTop: 20 },
  errorText: { color: colors.error, fontSize: 15, lineHeight: 23, flex: 1 },
  notice: { gap: 14, marginBottom: 24 },
  noticeTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  footer: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingTop: 32, marginTop: 'auto' },
  footerText: { fontSize: 13, lineHeight: 20, color: colors.muted, flexShrink: 1 },
  limitNote: { fontSize: 12, lineHeight: 19, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
