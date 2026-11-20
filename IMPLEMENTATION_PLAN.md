# Android NFC attendance implementation plan

Prepared 2026-11-20. Planning only; no application or database changes have been made.

## Intended experience

Teacher signs in → selects a class → opens a session → students tap their IDs → the app confirms each saved attendance → teacher closes and reviews the session.

The proposed operator is a teacher or staff member, with students using physical IDs. Class attendance, operator ownership, and online-first delivery are assumptions to confirm before implementing the corresponding features.

## What the other projects establish

| Project | Inspected implementation | Practice to reuse |
| --- | --- | --- |
| Wallet | package.json declares Expo ~58.0.14, React Native 0.88.0, React 19.3.0, TypeScript ~6.0.3; src/app, src/data, src/components, src/theme; Supabase; expo-sqlite-backed cache/outbox | Expo Router, small shared UI, durable writes if offline is needed, USB development builds, memory-limited native builds |
| MedibridgeMobileApplication | package.json declares Expo ~57.0.19, React Native 0.86.3, React 19.2.3, TypeScript ~6.0.3; src/app and src/lib; Supabase auth; eas.json | Authentication/provider structure, native config through Expo plugins, development and preview APK profiles |

Both have package-lock.json and npm workflows. Wallet's native Android directory is generated; authored native changes live in plugins or local modules. Follow that convention here. Reuse patterns, without copying product-specific stores, credentials, account IDs, or signing setup.

Sources inspected locally: ../Wallet/{package.json,app.json,AGENTS.md,CONTEXT.md,PROGRESS.md}, ../Wallet/src/{data/sync.ts,data/store.tsx,lib/supabase.ts}, ../Wallet/scripts/android-build.sh, ../MedibridgeMobileApplication/{README.md,package.json,app.json,eas.json}, and its src/lib/supabase.ts and src/app/_layout.tsx.

## Recommended stack

- React Native with Expo, TypeScript, Expo Router, and npm, matching the owner's mobile projects.
- react-native-nfc-manager v4 as the candidate NFC bridge. Use its Expo config plugin and an Android development build. The package cannot run inside Expo Go. [Library setup](https://github.com/revtel/react-native-nfc-manager/blob/main/docs/guide/expo.md)
- Start the compatibility prototype with an up-to-date Expo SDK 57 patch and SDK-compatible React Native dependencies. The library records SDK 57 / RN 0.86.3 compiler validation; Wallet's SDK 58 / RN 0.88 combination is not listed in that matrix. This is a conservative prototype choice, not a final version lock or proof that our cards work. Pin the actual resolved versions after verification. [Support policy](https://github.com/revtel/react-native-nfc-manager/blob/main/docs/SUPPORT_POLICY.md)
- A dedicated Supabase project for staff authentication and PostgreSQL persistence, with row-level security. Keep privileged keys off the phone. Database checks must enforce permissions and attendance integrity. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Add expo-sqlite only when implementing offline capture. Use React state/context for the initial UI; no additional state framework or custom API server is needed initially.

## Phase 1: prove the phone can read the real IDs

Build a small Android development app with an NFC status/read screen before building the full product.

1. Use the intended NFC-capable phone and several representative student IDs, including different issuance batches if available. Record the model, Android version, card technology, and dependency versions; keep raw identifiers out of committed logs.
2. Check hardware availability and whether NFC is enabled. Read available tag technologies and identifier without writing to the card. A generic NDEF-only demo is insufficient if the school's IDs are not NDEF tags.
3. Remove and re-tap each card repeatedly, restart the app, and verify that its identifier remains stable and that tested cards have distinct identifiers. Some tags expose random or empty identifiers, so UID enrollment is conditional. [Android Tag.getId](https://developer.android.com/reference/android/nfc/Tag#getId())
4. Test successive students, holding a card in place, failed reads, navigation away, and background/resume. Confirm listener cleanup and recovery. NFC hardware support depends on the phone and tag technology. [Android setup](https://github.com/revtel/react-native-nfc-manager/blob/main/docs/guide/android.md)

Exit condition: the actual phone/cards reliably produce an identifier suitable for enrollment. If they do not, document the exact incompatibility and evaluate a supported school-provided credential interface or compatible NFC card/tag before proceeding. A framework change alone cannot fix incompatible radio hardware.

## Phase 2: app foundation and card enrollment

- Scaffold the Android app and establish lint, TypeScript, build, and USB-development commands. Verify the chosen SDK's documentation and native toolchain; run one native build at a time using the memory-limited approach established in Wallet.
- Keep routes in src/app, UI in src/components, attendance/data functions in src/data, integrations in src/lib, and styling in src/theme. Add files only as needed.
- Configure NFC through app configuration/plugins; inspect the generated manifest. Keep generated android files disposable. Test with a physical device; emulator screens and mock scans cannot validate NFC.
- Prepare local schema migrations and an isolated development database. Do not apply migrations to a live project without explicit instruction.
- Implement staff sign-in, class/roster access, student registration, and card enrollment. Normalize identifiers as fixed byte-order hexadecimal strings with leading zeroes preserved; never convert them to numeric student numbers.
- Enforce unique active card assignments. Card replacement revokes the previous assignment and retains its history; unknown cards require deliberate enrollment, rather than automatic attendance or automatic student creation.

Exit condition: an authorized operator can create a test class/roster and link a test card to the correct student, with another operator denied access to unassigned data.

## Phase 3: complete online attendance

- Implement class list, roster/card enrollment, session setup, scanning, attendance list, and history screens, sharing forms where practical.
- Opening a session snapshots the eligible roster. Use that snapshot for enrollment validation and counts so later roster changes do not rewrite historical attendance.
- On tap, resolve the active card assignment and validate operator access, session state, and roster membership on the server. Insert attendance atomically and return the existing result if already recorded. Enforce unique (session_id, student_id) in PostgreSQL; a UI cooldown alone cannot prevent duplicates across devices.
- Show the student's name and saved attendance time, with optional vibration. Give separate feedback for already recorded, unknown/revoked card, wrong roster, read error, and save failure. Serialize callbacks and briefly suppress repeats from a held card while remaining ready for the next student.
- For the online first version, display success only after server confirmation. On timeout, offer a retry that safely returns any existing attendance. Stop scanning when the screen loses focus, the app backgrounds, or the session closes.
- Store server receipt time and operator, plus the observation time as separate metadata. Display dates in the school's configured timezone. Initially use present/absent; add late rules only after the cutoff and trusted-time policy are defined.
- Closing a session prevents new ordinary taps. Derive absences from its roster minus recorded attendance. Allow authorized manual corrections with a reason and an audit entry preserving the original result.

Exit condition: a complete session works end to end; repeated taps, retries, simultaneous device submissions, and a close-versus-tap race cannot create duplicate or invalid attendance.

## Minimal data model

| Entity | Purpose |
| --- | --- |
| Staff profiles | Reference authenticated users and their permitted actions |
| Students | Internal ID, printed student number, display name, active state |
| Card assignments | Student, normalized card identifier, assigned/revoked timestamps |
| Classes and class staff | Class details and authorized operators |
| Class enrollments | Students eligible for future class sessions |
| Sessions and session roster | Class, scheduled/open/closed times, operator, roster snapshot |
| Attendance | Session, student, card assignment if tapped, method, operator, observed time, server receipt time; unique student/session |
| Attendance audit | Corrections with actor, reason, time, and previous/new values |

Use database constraints and a small transactional database function for recording attendance; do not rely on client checks or an unrestricted upsert. Restrict enrollment, revocation, recording, correction, and reporting through server permissions. UID matching is a card lookup, not proof of the holder's identity; it cannot prevent a student lending an ID. A requirement for cryptographic card authentication needs a separate design and supported school credentials.

## Phase 4: offline support, if required

Reuse Wallet's durable outbox idea with a small attendance-specific implementation, rather than its finance synchronization engine.

- Cache only authorized roster/card/session data. Persist each scan and its unique operation ID in SQLite before showing “Saved on this phone — pending sync.” Keep pending, synced, and rejected states distinct.
- Retain pending records through app termination and network errors. Revalidate operator access, card assignment, roster, and session state on reconnect; enforce the same server uniqueness constraint.
- Keep device observation time and server receipt time separate. Decide explicitly how closed sessions, revoked cards, clock changes, and stale rosters affect offline records; surface conflicts for staff review rather than silently dropping or trusting them.
- Partition cached data by staff account and preserve unsynced work across expired authentication. Require an explicit resolution before sign-out clears pending records.

Exit condition: airplane-mode taps survive force-stop/relaunch and synchronize once, with visible handling of rejected records.

## Phase 5: reporting and pilot

- Add CSV roster import or attendance export if needed after the basic workflow is usable. Validate imports, duplicate student numbers, and export permissions.
- Run one pilot class with isolated test data first, then an owner-authorized real deployment. Check actual tap pace, name readability, counts, corrections, and day/time boundaries.
- Produce a preview APK that launches without Metro. Choose signed APK distribution or Play Store delivery with the owner; keep signing material outside source control.

## Verification and remaining decisions

For implementation, run Expo lint, TypeScript checking, Expo Doctor, an Android native build, focused attendance/authorization tests, and physical-device NFC checks. Use isolated data; remove temporary test artifacts. Verify online retry idempotency, concurrent taps, revoked/unknown cards, wrong rosters, session closure, correction audits, NFC disabled/unsupported states, screen lifecycle, and authentication failures. Add persistence/reconnect checks with offline work.

Before Phase 1, identify the real phone and student ID technology. Before schema work, confirm class versus event attendance, who operates phones and enrolls cards, roster source, and whether multiple teachers share classes. Before time classification or offline work, confirm late/absence rules, timezone, connectivity needs, and whether pending scans may be accepted after closure. These decisions do not prevent the compatibility prototype.

The current repository has no runnable app checks. Documentation accuracy, local references, and planning status are the only checks applicable to this planning change.
