# Context

## Confirmed by the owner

- This project is an NFC attendance system for Android.
- Students should tap their student IDs on a phone to record attendance, replacing the QR-scanning workflow described by the owner.
- Review the owner's other projects to follow their Android development practices.
- The current request is to record the idea and prepare an implementation plan.

## Current state

- Planning only; no app scaffold, installed dependencies, database schema, or connected backend exists in this repository.
- The plan is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). [FEATURES.md](FEATURES.md) distinguishes requested functionality from proposals.
- Wallet and MedibridgeMobileApplication were inspected read-only on 2026-11-20. Both use Expo, React Native, TypeScript, Expo Router, npm, and Supabase. Wallet uses USB development builds and local persistence; MediBridge also defines cloud development/preview builds.

## Proposed defaults, awaiting product confirmation

- A teacher or staff member owns the scanning phone; students do not need their own phones or app accounts.
- Start with class attendance: a class has a roster and dated sessions. Event or campus-entry attendance would change these entities and rules.
- Staff enroll an existing compatible card by linking its readable identifier to a student record. Reading an ID does not automatically provide its printed student number or the school's student database.
- Deliver online attendance first; add durable offline capture after the basic flow works if required.
- Follow the existing Expo development-build approach. Validate NFC dependencies and the real IDs before fixing framework versions.

## Constraints and open decisions

- Actual student card technology, identifier stability, and intended Android phone compatibility are unknown. These must be tested before promising support.
- UID matching identifies a registered card; it does not prove who is holding it or provide cryptographic authentication.
- Confirm class versus event use, roster source, operator permissions, attendance/late rules, connectivity requirements, and supported phone/Android versions before the corresponding implementation phase.
- No owner exclusions have been explicitly recorded. QR scanning is outside the proposed initial scope; do not treat that planning choice as a permanent owner rejection. Create SUGGESTIONS.md when an explicit exclusion is made.
- Never reuse another project's backend, credentials, real student data, or device-access permissions. Prepare migrations locally; applying them to a live database requires the owner's explicit instruction.
