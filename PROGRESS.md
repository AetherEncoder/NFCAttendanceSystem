# Progress

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
