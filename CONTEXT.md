# Context

## Confirmed by the owner

- This project is an NFC attendance system for Android.
- A college student council will operate it for event attendance, with faster check-in as the main goal. Teachers and classroom attendance are outside the intended use.
- Students should tap their student IDs on a phone to record attendance, replacing the QR-scanning workflow described by the owner.
- Review the owner's other projects to follow their Android development practices.
- The current request is to record the idea and prepare an implementation plan.
- The owner approved the initial plan, then clarified the event/council scope and the need to identify students from card identifiers alone.
- The owner believes the student IDs contain only an identifier, without student details. Treat that as a design assumption to verify on actual cards, not a hardware finding.
- Importing an official student list is a no-go. Register students individually and link their cards during registration.
- The owner asked whether Google Sheets could store student details for UID lookup. This is an option under discussion, not an instruction to create a spreadsheet or a finalized storage decision.

## Current state

- Planning only; no app scaffold, installed dependencies, database schema, or connected backend exists in this repository.
- The plan is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). [FEATURES.md](FEATURES.md) distinguishes requested functionality from proposals.
- Wallet and MedibridgeMobileApplication were inspected read-only on 2026-11-20. Both use Expo, React Native, TypeScript, Expo Router, npm, and Supabase. Wallet uses USB development builds and local persistence; MediBridge also defines cloud development/preview builds.

## Proposed defaults, awaiting product confirmation

- Authorized council members use scanning phones assigned to events; students do not need their own phones or app accounts.
- Start with one attendance check-in per student per event. Multiple attendance windows or check-out are undecided.
- Council members link a card's readable identifier (usually called a UID) to a student record once. That mapping is reused across events; reading an ID does not automatically provide its printed student number or the school's student database.
- Council members enter and verify each student's printed number and name, tap the ID, and save the student/card assignment together. Register before an event where possible and use a separate registration desk for unknown cards to keep the main queue fast.
- Keep student records, card assignments, and attendance separate so replacing a card does not replace the student's identity or history. Program/year are optional fields only if needed for event operations or reporting.
- Supabase remains the recommended shared store. A private Google Sheet can support a prototype through authenticated access with serialized duplicate checks; a Sheets choice requires adapting the currently proposed PostgreSQL permissions and write guarantees.
- An event may optionally have an expected-attendee list. Without one, report attendance totals rather than inventing absence counts.
- Deliver online attendance first; add durable offline capture after the basic flow works if required.
- Follow the existing Expo development-build approach. Validate NFC dependencies and the real IDs before fixing framework versions.

## Constraints and open decisions

- Actual student card technology, identifier stability, and intended Android phone compatibility are unknown. These must be tested before promising support.
- UID matching identifies a registered card; it does not prove who is holding it or provide cryptographic authentication.
- Confirm shared storage (Supabase versus private Sheets), required registration fields, who may register/replace cards, event operator permissions, attendance windows, connectivity requirements, and supported phone/Android versions before the corresponding implementation phase.
- Owner-excluded scope is recorded in [SUGGESTIONS.md](SUGGESTIONS.md). QR scanning is outside the proposed initial scope; do not treat that planning choice as a permanent owner rejection.
- Never reuse another project's backend, credentials, real student data, or device-access permissions. Prepare migrations locally; applying them to a live database requires the owner's explicit instruction.
