# Context

## Confirmed by the owner

- This project is an NFC attendance system for Android.
- A college student council will operate it for event attendance, with faster check-in as the main goal. Teachers and classroom attendance are outside the intended use.
- Students should tap their student IDs on a phone to record attendance, replacing the QR-scanning workflow described by the owner.
- Review the owner's other projects to follow their Android development practices.
- The current request is to record the idea and prepare an implementation plan.
- The owner approved the initial plan, then clarified the event/council scope and the need to identify students from card identifiers alone.
- The owner believes the student IDs contain only an identifier, without student details. Treat that as a design assumption to verify on actual cards, not a hardware finding.

## Current state

- Planning only; no app scaffold, installed dependencies, database schema, or connected backend exists in this repository.
- The plan is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). [FEATURES.md](FEATURES.md) distinguishes requested functionality from proposals.
- Wallet and MedibridgeMobileApplication were inspected read-only on 2026-11-20. Both use Expo, React Native, TypeScript, Expo Router, npm, and Supabase. Wallet uses USB development builds and local persistence; MediBridge also defines cloud development/preview builds.

## Proposed defaults, awaiting product confirmation

- Authorized council members use scanning phones assigned to events; students do not need their own phones or app accounts.
- Start with one attendance check-in per student per event. Multiple attendance windows or check-out are undecided.
- Council members link a card's readable identifier (usually called a UID) to a student record once. That mapping is reused across events; reading an ID does not automatically provide its printed student number or the school's student database.
- Prefer an official student-list import, followed by verified card linking before an event. If the school supplies an authorized existing card-to-student mapping, validate and import it. Otherwise provide manual student registration and a separate registration desk for unknown cards so the main check-in queue stays fast.
- Student-list availability is awaiting the owner's answer. CSV import belongs in initial registration if a roster is available; it is not assumed to be available.
- An event may optionally have an expected-attendee list. Without one, report attendance totals rather than inventing absence counts.
- Deliver online attendance first; add durable offline capture after the basic flow works if required.
- Follow the existing Expo development-build approach. Validate NFC dependencies and the real IDs before fixing framework versions.

## Constraints and open decisions

- Actual student card technology, identifier stability, and intended Android phone compatibility are unknown. These must be tested before promising support.
- UID matching identifies a registered card; it does not prove who is holding it or provide cryptographic authentication.
- Confirm student-list source, who may register/replace cards, event operator permissions, attendance windows, connectivity requirements, and supported phone/Android versions before the corresponding implementation phase.
- Owner-excluded scope is recorded in [SUGGESTIONS.md](SUGGESTIONS.md). QR scanning is outside the proposed initial scope; do not treat that planning choice as a permanent owner rejection.
- Never reuse another project's backend, credentials, real student data, or device-access permissions. Prepare migrations locally; applying them to a live database requires the owner's explicit instruction.
