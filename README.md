# NFC Attendance System

An Android attendance app where students tap a compatible student ID on an NFC-capable phone to record attendance. NFC tapping is the core attendance method, replacing the QR-scanning workflow in the owner's idea.

The proposed first version runs on a teacher or staff member's phone: open an attendance session, scan student IDs, and review the attendance list. This operator workflow is an assumption pending confirmation.

The repository currently contains planning and project guidance only. No Android application or backend has been implemented.

- [Context and confirmed requirements](CONTEXT.md)
- [Implementation plan and research](IMPLEMENTATION_PLAN.md)
- [Feature scope and implementation status](FEATURES.md)
- [Progress](PROGRESS.md)
- [Project guidance](AGENTS.md)

The recommended approach follows the neighboring Wallet and MediBridge Android projects: Expo, React Native, TypeScript, Expo Router, and a separate Supabase backend. The first implementation step is a physical phone/card compatibility prototype.
