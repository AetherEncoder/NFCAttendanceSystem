# Android NFC attendance implementation plan

Prepared 2026-11-20. Planning only; no application or database changes have been made.

## Intended experience

Council member signs in → selects an event → opens check-in → students tap their IDs → the app confirms each saved attendance → council closes check-in and reviews the event.

The owner confirmed college student council operation for events. Start with one check-in per student per event; online-first delivery and the exact council permissions remain proposed defaults. Students use physical IDs and do not need their own app accounts.

## Identifying students from a card identifier

Student information does not need to be stored on the NFC tag. Keep the student record and a separate card assignment in the app's database: card UID → student record → attendance at the selected event. The tag identifier is usually called a UID; it is distinct from an internal database UUID and from the printed student number. Android exposes the discovered identifier, but it does not establish that our school's cards contain only that identifier. [Android Tag.getId](https://developer.android.com/reference/android/nfc/Tag#getId())

Choose the registration path based on what the council can obtain:

1. If an authorized school export already maps card identifiers to students, validate the identifier format against real scans and import the mapping. A plain list of names/student numbers cannot supply the missing card mapping.
2. Otherwise, import an official student list if available. At a registration desk, search the printed student number, verify the physical ID matches the selected student, tap the card, and save the assignment. Provide manual student creation when no list is available.
3. Register each card once and reuse its assignment at future events. Prefer registration before the event. During an event, send unknown cards to a separate registration workflow or desk, then explicitly check the student in after registration; linking alone must not record attendance.

Prevent linking a card that already belongs to another student. Reassignments and replacements require an authorized action and revoke the old assignment without altering historical attendance. Do not write student details to the card or assume access to the school's NFC application or database. Roster availability and permission to obtain an existing mapping are unresolved.

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
- A dedicated Supabase project for council member authentication and PostgreSQL persistence, with row-level security. Keep privileged keys off the phone. Database checks must enforce permissions and attendance integrity. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
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
- Implement council sign-in, event access, student registration, and card enrollment using the registration paths above. Separate permission to register or replace cards from ordinary event scanning. Import an official CSV student list in this phase if available; validate columns and duplicate student numbers. Normalize card identifiers as fixed byte-order hexadecimal strings with leading zeroes preserved; never convert them to numeric student numbers or assume a UUID format.
- Enforce unique active card assignments. Card replacement revokes the previous assignment and retains its history; unknown cards require deliberate enrollment, rather than automatic attendance or automatic student creation.

Exit condition: an authorized council member can register a test student and link a test card once, with other operators denied actions outside their assigned permissions. The mapping is reusable at two different test events.

## Phase 3: complete online attendance

- Implement event list/setup, student/card registration, scanning, attendance list, and history screens, sharing forms where practical. Council members can operate multiple scanning phones at the same event.
- For open college events, accept registered active students. If an event has an explicit expected-attendee or eligibility list, snapshot it when opening check-in and validate against that snapshot. Do not infer that every student in the college is expected at every event.
- On tap, resolve the active card assignment and validate council access, event state, student status, and any configured eligibility on the server. Insert attendance atomically and return the existing result if already recorded. Enforce unique (event_id, student_id) in PostgreSQL; a UI cooldown alone cannot prevent duplicates across phones.
- Show the student's name and saved attendance time, with optional vibration. Give separate feedback for already recorded, unknown/revoked card, ineligible student, read error, and save failure. Serialize callbacks and briefly suppress repeats from a held card while remaining ready for the next student. Keep student search and registration outside the normal scan path.
- For the online first version, display success only after server confirmation. On timeout, offer a retry that safely returns any existing attendance. Stop scanning when the screen loses focus, the app backgrounds, or the event closes.
- Store server receipt time and operator, plus observation time as separate metadata. Display dates in the college's configured timezone. Begin with attended status; add attendance windows, check-out, or late rules only after the owner defines a need and the time policy.
- Closing an event prevents new ordinary taps. Show attendance totals and records; derive absences only against an explicit expected-attendee snapshot after closure. Allow authorized council corrections with a reason and an audit entry preserving the original result.

Exit condition: a complete event works end to end; repeated taps, retries, simultaneous device submissions, and a close-versus-tap race cannot create duplicate or invalid attendance. The same student can attend a second event independently.

## Minimal data model

| Entity | Purpose |
| --- | --- |
| Council profiles | Reference authenticated council members and their permitted registration, event-management, scanning, and reporting actions |
| Students | Internal ID, printed student number, display name, active state |
| Card assignments | Student, normalized card identifier, assigned/revoked timestamps |
| Events and event operators | Event details, scheduled/open/closed times, and council members authorized to operate each event |
| Event expected attendees | Optional snapshot for explicit eligibility or absence reporting; omitted for unrestricted events |
| Attendance | Event, student, card assignment if tapped, method, operator, observed time, server receipt time; unique student/event |
| Attendance audit | Corrections with actor, reason, time, and previous/new values |

Use database constraints and a small transactional database function for recording attendance; do not rely on client checks or an unrestricted upsert. Restrict enrollment, revocation, recording, correction, and reporting through server permissions. UID matching is a card lookup, not proof of the holder's identity; it cannot prevent a student lending an ID. A requirement for cryptographic card authentication needs a separate design and supported school credentials.

## Phase 4: offline support, if required

Reuse Wallet's durable outbox idea with a small attendance-specific implementation, rather than its finance synchronization engine.

- Cache only authorized student/card/event data and any relevant eligibility snapshot. Persist each scan and its unique operation ID in SQLite before showing “Saved on this phone — pending sync.” Keep pending, synced, and rejected states distinct.
- Retain pending records through app termination and network errors. Revalidate council access, student status, card assignment, event eligibility, and event state on reconnect; enforce the same server uniqueness constraint. Two offline phones may temporarily show the same student as pending; reconciliation must yield one attendance record.
- Keep device observation time and server receipt time separate. Decide explicitly how closed events, revoked cards, clock changes, and stale cached data affect offline records; surface conflicts for council review rather than silently dropping or trusting them.
- Partition cached data by council account and preserve unsynced work across expired authentication. Require an explicit resolution before sign-out clears pending records. Keep new card enrollment online in the first offline implementation to avoid conflicting assignments.

Exit condition: airplane-mode taps survive force-stop/relaunch and synchronize once, with visible handling of rejected records.

## Phase 5: reporting and pilot

- Add attendance export if needed after the basic workflow is usable; student-list import belongs in Phase 2 when available. Restrict exports to authorized council members.
- Run a mock council event with isolated test data first, then an owner-authorized real deployment. Check actual tap pace, multiple scanning phones, the separate registration queue, name readability, counts, corrections, and day/time boundaries.
- Produce a preview APK that launches without Metro. Choose signed APK distribution or Play Store delivery with the owner; keep signing material outside source control.

## Verification and remaining decisions

For implementation, run Expo lint, TypeScript checking, Expo Doctor, an Android native build, focused attendance/authorization tests, and physical-device NFC checks. Use isolated data; remove temporary test artifacts. Verify registration/import validation, conflicting card assignments, replacement/revocation, mapping reuse across events, online retry idempotency, concurrent taps, eligibility, event closure, correction audits, NFC disabled/unsupported states, screen lifecycle, and authentication failures. Add persistence/reconnect checks with offline work.

Before Phase 1, identify the real phone and student ID technology. Before registration/schema work, confirm access to an official student list or an existing card mapping, who may enroll/replace cards, and how council members receive event permissions. Before extending attendance rules or offline work, confirm expected-attendee requirements, multiple attendance windows/check-out, timezone, event connectivity, and whether pending scans may be accepted after closure. Council-operated events are confirmed; teacher/classroom workflows are excluded in [SUGGESTIONS.md](SUGGESTIONS.md). The open decisions do not prevent the compatibility prototype.

The current repository has no runnable app checks. Documentation accuracy, local references, and planning status are the only checks applicable to this planning change.
