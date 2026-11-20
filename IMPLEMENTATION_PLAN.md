# Android NFC attendance implementation plan

Updated 2026-11-20. The local registration/lookup prototype is implemented; Android build/device verification is tracked in [PROGRESS.md](PROGRESS.md). No spreadsheet, service, event attendance, or sync is implemented. The architecture below describes later delivery phases unless included in [FEATURES.md](FEATURES.md)'s implemented prototype.

## Confirmed direction

- A college student council operates Android phones to check attendance at events.
- Register students individually and link their NFC card identifiers; official student-list importing and teacher/classroom workflows are excluded.
- Google Sheets is the shared store because the council already uses it. The prior Supabase recommendation is superseded.
- Registration is saved locally first. A council member explicitly uploads pending registrations after checking against the latest shared records.
- Before starting attendance, download the latest registered-student/card list and event data. During scanning, lookups and attendance saves are local.
- After the local session ends, a council member explicitly uploads its attendance after checking the latest shared attendance for duplicates and conflicts.
- Start with one attendance per student per event. Multiple attendance windows, check-out, and late rules remain undecided.

## Architecture

Android app with SQLite ↔ authenticated batch sync service ↔ private Google Sheets workbook.

- Follow the other mobile projects with React Native, Expo, TypeScript, Expo Router, and npm. Wallet declares Expo ~58.0.14 / RN 0.88.0; MediBridge declares Expo ~57.0.19 / RN 0.86.3. Their packages, routing, build configuration, and Wallet's durable outbox were inspected read-only on 2026-11-20.
- Candidate NFC bridge: react-native-nfc-manager v4 with its Expo config plugin and an Android development build. Expo Go cannot load it. Use an up-to-date SDK 57 patch for the initial compatibility prototype because that SDK/RN combination has recorded library validation; select and pin actual dependency versions after checking current compatibility. [Library setup](https://github.com/revtel/react-native-nfc-manager/blob/main/docs/guide/expo.md), [support policy](https://github.com/revtel/react-native-nfc-manager/blob/main/docs/SUPPORT_POLICY.md)
- Use expo-sqlite from the first implementation for registered-student snapshots, registration drafts, local sessions, attendance, and pending sync operations. Persist related changes in one local transaction before confirming a save. React state is a UI view of durable data, not the only copy.
- Use one Apps Script project as the candidate sync service. Verify council identity and permissions before downloads or writes; test the Android authentication/deployment path early. Keep the workbook private and privileged credentials out of the APK. The endpoint URL is not authentication. [Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- All managed writes use this service. No Supabase database or per-tap network request is needed for this plan.

## Phase 1: prove NFC compatibility

Build a small development app and test the intended physical phone with several actual student IDs. Record device/Android/card technology and dependency versions without committing raw identifiers.

Check hardware support, NFC enabled state, repeated removal/re-taps, distinct identifiers across tested cards, app restart, successive students, and background/resume cleanup. Read technology/UID without writing to the card; a NDEF-only sample is insufficient for non-NDEF IDs. Android notes that some cards return random or empty identifiers, so stable UID matching must be verified. [Android Tag.getId](https://developer.android.com/reference/android/nfc/Tag#getId())

Exit condition: the real cards/phone reliably expose a usable stable identifier. If not, investigate the specific incompatibility before building the rest of the product.

## Phase 2: local registration and registration upload

1. A council member enters the printed student number and full name, verifies the physical ID, and taps it. Program/year are optional if needed.
2. Normalize the UID to consistent hexadecimal text, preserving byte order and leading zeroes. Keep it separate from the student's stable internal ID and printed number.
3. Check both pending local records and the last downloaded directory for duplicate numbers/UIDs. Save the student, card assignment, and pending operation in SQLite together. Label it Saved on phone / Pending upload. Local checks cannot guarantee uniqueness against other phones' unsynced work.
4. On Upload registrations, send pending records as a batch. The service reads the latest Students/Cards rows, checks the entire incoming batch and shared data, and writes valid new records under the shared lock described below.
5. Return per-record results: uploaded, already present, or conflict. Matching existing records return canonical shared IDs; the app applies any ID remapping to its related local records in a transaction. Conflicting identity/card details require council review and must not silently overwrite shared records.
6. Keep failed/conflicting records locally. Mark records synced only after an acknowledgement or a retry response proves that the same operation already succeeded. Show the result counts and refresh the local directory after reconciliation.

New student numbers and active UIDs must be unique. An existing student number with a different card is an explicit replacement workflow, not an automatic merge. Preserve assignment history and past attendance when revoking/replacing a card. Offline replacements can be drafted, but become authoritative only after a successful conflict-checked upload.

For the simplest initial release, session preparation uses synchronized student IDs. Upload new registrations before including those students in a session; if registration fails or conflicts, retain the draft for resolution. Unknown cards go to a separate registration workflow so they do not block the scanning queue. Supporting attendance against unresolved local registrations can be added if the owner needs it.

Exit condition: two phones can upload registrations, reconcile equivalent records, and visibly retain conflicting assignments without loss or duplicates.

## Phase 3: prepare and scan an event locally

1. Create/select a shared event with one stable event_id used by every scanning phone. A local scanning session gets its own session_id; it is not a separate event.
2. Prepare session downloads a coherent latest authorized student/card snapshot, event state, any configured eligibility, and attendance already uploaded for this event. Record its download time and replace the previous snapshot only after the complete download is valid. Do not overwrite pending registrations or attendance.
3. A fresh successful preparation is the default requirement for a new session. If the network is unavailable, keep existing data and offer retry; starting a new session with stale cached data requires an explicit future policy. A prepared active session continues without connectivity.
4. Each tap uses the downloaded UID lookup and local indexes only. Check known shared attendance plus attendance already recorded on this phone, student eligibility, and the session's local state. Save the observation and pending operation to SQLite before showing Saved on phone with the student's name and optional vibration. No network calls occur per tap.
5. Serialize scan callbacks, suppress repeats from a held card, and handle unknown/revoked cards, ineligible students, failed reads, and storage failures clearly. Stop listeners when the screen loses focus or the app backgrounds; resume safely without losing the local session.
6. Finish session stops local scanning and shows attendance totals plus a pending-upload count. It does not silently close the shared event for other phones or discard local records. Attendance upload is a separate explicit action.

Without live communication, two phones can both record the same student after their initial downloads. The app must describe counts as local/pending until sync; cross-phone duplicates are resolved during upload. A card revoked or reassigned after the snapshot may also be flagged at upload. Store the original student ID, card assignment, and snapshot reference with each observation; never reinterpret a past scan using a newly reassigned UID.

Exit condition: scanning works without connectivity and local sessions/records survive force-stop and relaunch, with no per-tap Sheets requests.

## Phase 4: safe attendance batch upload

The owner's retrieve → compare → upload step belongs inside one coordinated server operation. A client-only check is insufficient: two phones could both read no attendance and then both append.

1. Authenticate the council member and verify event permissions. Acquire a shared script lock before the authoritative read/check/write section. Read current event state, relevant registration/card validity, existing attendance for this event, and operation IDs. Apps Script provides getScriptLock with tryLock/waitLock; actually acquire the lock before reading. [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
2. Validate each observation's original identity, event, and payload. Reconcile by operation_id for retries and by (event_id, student_id) for duplicate attendance. Same operation ID with a changed payload is a conflict, not a new write. Existing attendance returns Already recorded with its canonical record; it does not overwrite that row's time/operator.
3. Deduplicate inside the incoming batch as well as against the sheet. Append only valid missing attendance and return per-record results. Keep unresolved identity, eligibility, or event-state conflicts for review. Preserve the local observation for an already-recorded result, linked to the canonical shared attendance.
4. Use a single Sheets batch update for related rows within the workbook where practical, including operation acknowledgements. Google documents atomic updates within a batch request; separate reads and writes are not automatically one transaction. The shared lock protects participating service writers across that interval. If a batch is too large, use bounded chunks with stable per-record IDs and reconcile each chunk safely. [Batch updates](https://developers.google.com/workspace/sheets/api/guides/batchupdate)
5. Release the lock only after the writes complete. A lost response must be recoverable: the same operation IDs are persisted alongside their effects, so retry reads can prove success without appending again. Mark only acknowledged records synced locally; pending/conflicting rows survive timeout, network failure, or app termination.

An optional phone-side preflight can display conflicts, but the service must still reread/recheck under the lock when committing. The upload button can normally send one batch request whose handler retrieves, compares, writes, and returns results, reducing phone round trips. Fetch only relevant event attendance rather than all historical events. Batch spreadsheet reads/writes rather than issuing one per student; Google recommends this pattern. [Apps Script best practices](https://developers.google.com/apps-script/guides/support/best-practices)

Do not upload a complete old workbook copy over the current sheet. Append/reconcile specific records so another phone's newly uploaded data survives. Script locks do not block manual edits or another script project. For duplicate guarantees, protect managed IDs/attendance ranges and route their mutations through the same service; council members can still view, filter, and use reporting tabs. Decide how council corrections are applied before permitting direct edits that bypass validation.

Exit condition: simultaneous uploads, repeated uploads, and a lost response after a successful write produce one canonical attendance per student/event while retaining local observations and conflicts.

## Workbook and local records

| Record | Main fields |
| --- | --- |
| Students | student_id, unique printed student_number, full_name, active state, optional program/year, registering operator/time |
| Cards | card_assignment_id, normalized UID, student_id, assigned/revoked times |
| Events and operators | event_id, name/schedule/state, authorized council members |
| Expected attendees | Optional explicit eligibility/absence snapshot; do not assume every college student must attend every event |
| Attendance | attendance_id, operation_id, event_id, student_id, original card assignment, observed_at, received_at, operator, local session_id |
| Sync acknowledgements/audit | Registration operations, reconciliations, and authorized corrections; written with related changes so retries can recover |

Use stable IDs rather than row numbers. Store UID and student number as text; RAW API input avoids automatic numeric/date parsing. [Google value input options](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption)

The phone additionally keeps immutable session snapshots, draft registration IDs, observation/operation IDs, sync outcomes, and pending queues. Separate observation time from server upload time; display the college's configured timezone. Do not use an untrusted phone clock alone to classify late attendance or accept scans after a cutoff. Until rules are defined, the first accepted shared attendance remains canonical; additional offline observations are preserved locally as already recorded rather than silently overwriting it.

Keep pending work across expired sign-in. Require explicit resolution before sign-out or account switching can remove unsynced data, and never upload one operator's records under another account without an authorized reconciliation flow.

## Phase 5: pilot and delivery

- Scaffold only what each phase needs: routes in src/app, shared UI in src/components, local domain/sync code in src/data, integrations in src/lib, and styling in src/theme. Authored native changes use configuration/plugins or local modules; generated android files stay disposable.
- Establish Expo lint, TypeScript, Expo Doctor, and Android build commands. Follow Wallet's memory-limited native-build approach and run one heavy build at a time. Keep signing material outside the repository.
- Test with isolated student/card/event records and a separate test workbook. Do not create/change live council data or deploy services without the owner's instruction.
- Run a mock event with multiple phones, then an owner-authorized pilot. Measure directory-download time, local tap speed, upload time, and recovery at the expected event size before choosing batch limits.
- A preview APK must launch without Metro. Spreadsheet reports and optional attendance export can follow the core flow.

## Verification and decisions still needed

Implementation checks must cover local registration/attendance persistence, storage failures, local duplicates, download failure without cache loss, new-registration conflicts, canonical ID remapping, UID formatting, identity replacement between download/upload, concurrent registration/attendance uploads, duplicate payloads within one batch, lost-response retries, partial/chunked upload recovery, permissions, expired sign-in, and account switching with pending work. Check NFC disabled/unsupported states and lifecycle recovery on real hardware; emulators cannot verify NFC.

Sheets API limits and Apps Script runtime/service quotas still apply even with batch uploads. Handle throttling, lock timeouts, and bounded retries while leaving records pending; distinguish phone-to-service requests from the service's Google API calls. No fixed requests-per-event or throughput promise is made. [Sheets API limits](https://developers.google.com/workspace/sheets/api/limits), [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)

Before implementation, confirm the real phone/cards, registration fields, council authentication/account ownership, workbook ownership/editing rules, and who may resolve conflicts. Define event finalization separately from finishing a phone session: closing upload intake must not silently reject or erase legitimate pending sessions. Expected-attendee lists, late/check-out rules, retention after sync, and any exception to fresh-download preparation remain product decisions. Source-of-truth and local-first/manual-sync direction are confirmed.

For the current prototype, run TypeScript, Expo lint, isolated Node/SQLite tests, Expo Doctor, a native APK build, and physical phone checks. Real card taps remain necessary to validate NFC compatibility. See [FEATURES.md](FEATURES.md), [CONTEXT.md](CONTEXT.md), and [PROGRESS.md](PROGRESS.md) for implemented scope and verification results; [SUGGESTIONS.md](SUGGESTIONS.md) records excluded scope.
