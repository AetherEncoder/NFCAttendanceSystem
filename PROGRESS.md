# Progress

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
