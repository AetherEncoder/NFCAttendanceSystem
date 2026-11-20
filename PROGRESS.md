# Progress

## 2026-11-20: Local NFC registration prototype built and installed over USB

- Owner authorized building and installing a prototype over USB: scan an NFC identifier, enter student details, save locally, and recognize the student on later scans. Google Sheets and attendance capture remain later phases.
- Connected authorized phone reports model 24129PN74G, Android 16, and enabled NFC. Actual student-card compatibility and UID stability still require physical card taps.
- Added Expo 57.0.33 / React Native 0.86.3 / TypeScript / Expo Router app with react-native-nfc-manager 4.3.0 and expo-sqlite. Pinned compatible React DOM, Reanimated, and Worklets peers after npm initially selected incompatible latest versions.
- Implemented continuous foreground Android reader mode across NFC technologies, UID validation/normalization, local student lookup, unknown-card registration, duplicate card/number checks, optional student number and course/section, and durable transactional SQLite saves. Scanning pauses during registration and restarts after save/cancel or background/resume. Local storage errors retain form input.
- Added a standalone ARM64 APK build script with memory limits and disposable generated Android sources. No Google Sheets service, credentials, Git operations, live council records, or migrations changed.
- Completed verification: TypeScript, Expo lint, three isolated UID/SQLite tests (including reopen persistence), Expo Doctor (21/21, including final configuration), root Markdown links, and shell syntax. Android release build and its native lint-vital checks passed; the successful build took 5m 8s after bounding native compiler concurrency.
- TypeScript, Expo lint, all three isolated tests, Expo Doctor (21/21), and root Markdown links now pass. The NFC native Java module and release JS bundle compiled successfully in the first native build. Native C++ compilation launched 36 jobs despite Gradle's worker limit and hit memory throttling; stopped that build, added standard CMake compile/link job pools and in-process Kotlin compilation to the build script, and restarted with cached dependencies.
- npm audit reports six transitive/inherited advisory findings (three moderate, three high) on the selected SDK 57 dependency tree, including URI-decoding and build-tool glob matching. npm's suggested resolution changes Expo/Router major versions; no forced incompatible upgrade was applied during the compatibility prototype.
- Produced artifacts/nfc-attendance-prototype.apk (about 41 MB), targeting ARM64 Android 7+ / SDK 36, version 0.1.0, package com.nfccouncil.attendance. Verified bundled JavaScript and native app library, non-debuggable installed application, and disabled Android backup. This prototype uses the generated template's debug signing key, not production signing.
- Installed successfully on the authorized connected phone with adb install -r and approved its NFC Attendance USB install prompt. The first prompt timed out; the retry succeeded. Opened the standalone app without Metro and verified its NFC ready screen and Android's enabled reader state.
- Device checks passed: reader disabled after Home/background, enabled after returning, and NFC ready after force-stop/relaunch. Captured and inspected normal and 1.3 text-scale screens under the phone's existing dark system theme; the app uses its explicit light theme and scrolls for larger text. Restored original font scale 1.0 and left NFC on and the app open.
- Android blocked programmatic NFC disabling from adb, so disabled-NFC recovery was not verified on hardware. No actual student card was available to the agent: card reads, repeated UID stability, registration/rescan on a real card, and unsupported-hardware behavior still require physical testing. The database remains empty; no test students were inserted on the phone.
- Updated README.md, CONTEXT.md, FEATURES.md, IMPLEMENTATION_PLAN.md, and AGENTS.md for the implemented prototype, commands, boundaries, and build conventions; added product/interface notes. No Google Sheets writes, live council data, database migrations, or Git operations were performed.
- Remaining: owner taps real student IDs to verify compatibility, register a student, rescan after app restart, and compare multiple cards. Event attendance, Google Sheets synchronization, editing/deletion, and card replacement remain later work.

## 2026-11-20: Google Sheets selected with local capture and manual batch sync

- Owner selected Google Sheets as the council's shared store and specified local-first registration, manual conflict-checked registration upload, fresh directory download before attendance, local attendance capture, and manual conflict-checked post-session upload. These supersede earlier Supabase/online-first proposals; offline persistence is core scope.
- Reworked IMPLEMENTATION_PLAN.md and updated README.md, CONTEXT.md, FEATURES.md, and SUGGESTIONS.md to reflect the selected direction. Proposed SQLite on Android and one authenticated Apps Script service for batch reconciliation.
- Added authoritative locked read/compare/write to cover simultaneous phone uploads, stable operation IDs for lost-response retries, canonical shared IDs, per-record acknowledgements/conflicts, and preservation of pending data. Offline cross-phone duplicate detection remains eventual; local counts are provisional.
- Separated shared events from local phone sessions and distinguished finishing a session from closing upload intake. Documented stale-card identity conflicts, optional fresh-download exceptions, and synchronized registrations as the proposed simplest initial session input.
- Verified primary Google documentation for script locks, atomic batch requests, batching best practices, and Sheets/Apps Script limits. Checked local Markdown links, whitespace, and removal of superseded storage/online-first assumptions from current documentation. No app scaffold exists for lint/build/tests.
- No app, spreadsheet, service deployment, credentials, live data, device changes, migrations, or Git operations were performed.
- Remaining: test actual phone/cards; confirm council authentication/workbook ownership and editing rules, required registration fields, and pending-upload/event-finalization policy; then implement the documented prototype and local persistence/sync phases.

## 2026-11-20: Individual registration and shared storage options

- Owner ruled out official student-list importing and required individual student registration. Recorded the exclusion in SUGGESTIONS.md and removed import/mapping prerequisites from the current plan, context, README, and feature scope. Earlier import proposals below are superseded.
- Documented entering/verifying each student's number/name, scanning the card, and saving a reusable card assignment with duplicate checks. Student identity stays separate from replaceable cards and per-event attendance.
- Evaluated private Google Sheets for UID lookup using Google's primary documentation. Added a possible authenticated service/Sheets design and its concurrency, credential, text-formatting, and quota requirements. Supabase remains the recommendation; the owner has not selected a store, and no spreadsheet or backend was created.
- Verification: local Markdown targets, trailing whitespace, and current import-exclusion consistency checked. Documentation only; no application scaffold exists for lint/build/tests. No Git operations, live data, migrations, or device changes.
- Remaining: choose shared storage and required registration fields, test actual phone/card compatibility, and confirm council permissions and event attendance rules.

## 2026-11-20: Council event scope and identifier-only cards

- Owner approved the initial plan and clarified that college student council members will operate the app for event attendance, not teachers/classes. Recorded that exclusion in SUGGESTIONS.md.
- Updated README.md, CONTEXT.md, FEATURES.md, and IMPLEMENTATION_PLAN.md around events, council permissions, multiple scanning phones, and one attendance record per student/event. The earlier classroom assumptions below are superseded.
- Expanded the registration solution for identifier-only IDs: import an authorized existing mapping if available, or import/create student records and verify/tap-link cards once for reuse across events. Keep unknown-card registration separate from the normal check-in queue; do not write personal data to cards.
- Moved student-list import into initial registration when a list is available. Awaiting the owner's answer on official student-list access; manual registration remains the documented alternative.
- Made expected-attendee lists optional; absence counts require an explicit list. Multiple windows, check-out, late rules, and offline capture remain undecided proposals.
- Verification: checked local Markdown links, whitespace, and current scope consistency. Rechecked Android's identifier documentation; the real cards' content, readability, and UID stability remain unverified. No app scaffold exists, so app lint/build/tests are unavailable. No Git operations, live data changes, or device changes.
- Remaining: resolve student-list availability, identify phone/card hardware, prototype NFC reads, and confirm council registration permissions and event attendance rules before implementation.

## 2026-11-20: NFC Android concept and implementation plan

- Recorded the owner's confirmed idea: Android attendance through tapping student IDs on a phone, replacing the described QR-scanning workflow.
- Reviewed Wallet and MedibridgeMobileApplication read-only: actual package versions, Expo Router layout, Supabase setup, Android development/build configuration, and Wallet's cache/outbox pattern. Both use npm and Expo development builds.
- Added CONTEXT.md, FEATURES.md, and IMPLEMENTATION_PLAN.md; expanded README.md with project purpose, current status, and documentation links.
- Proposed a physical NFC compatibility prototype, staff/card enrollment, online attendance with server-enforced uniqueness, then optional offline capture and reporting. Explicitly separated owner requirements from assumptions and proposed features.
- Checked primary Android, Expo, NFC library, and Supabase documentation. The NFC library's published validation includes SDK 57; SDK 58 compatibility and the owner's real cards/phone remain unverified. Expo Go cannot load the proposed NFC native module.
- Verification: reviewed documentation consistency and checked local Markdown targets. No app lint/build/tests are available because there is no app scaffold. No dependencies, devices, backend data, migrations, or Git operations changed.
- Remaining: identify the intended phone and real student ID technology; run the compatibility prototype; confirm operator/class workflow and attendance rules before the corresponding implementation phases.

## 2026-11-20

- Added general project guidance in AGENTS.md, adapted from the Wallet project's workflow without its app-specific tooling or implementation details.
- Added CLAUDE.md referencing the shared guidance.
- Explicitly prohibited adding comments in code in both instruction files.
- Verification: reviewed the documentation for consistency; no application code changed.
- Remaining: document the technology stack and development commands once they are established.
