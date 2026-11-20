# NFC Attendance System

An Android attendance app for a college student council. Students tap a compatible student ID on an NFC-capable phone to record attendance at council events. NFC tapping is the core attendance method, replacing the QR-scanning workflow in the owner's idea.

Council members register students individually, link their card identifiers, then scan IDs at events and review attendance. Official student-list importing is excluded. Student details live in the app's shared data store and do not need to be written to the card. The actual cards' readability and identifier stability still need verification.

The repository currently contains planning and project guidance only. No Android application or backend has been implemented.

- [Context and confirmed requirements](CONTEXT.md)
- [Implementation plan and research](IMPLEMENTATION_PLAN.md)
- [Feature scope and implementation status](FEATURES.md)
- [Excluded scope and future suggestions](SUGGESTIONS.md)
- [Progress](PROGRESS.md)
- [Project guidance](AGENTS.md)

The recommended approach follows the neighboring Wallet and MediBridge Android projects: Expo, React Native, TypeScript, Expo Router, and a separate Supabase backend. A private Google Sheet is being evaluated as a storage alternative; no backend choice has been finalized. The first implementation step is a physical phone/card compatibility prototype.
