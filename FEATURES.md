# Features

Status: local Android registration/lookup prototype implemented. Event attendance and shared storage remain planned.

## Implemented prototype

- Scan compatible NFC cards in the foreground using Android reader mode, including cards without NDEF data; display normalized UID and detected technologies without writing to the card.
- Unknown cards open individual registration: required full name, optional student number and course/section. Pause scans during entry and preserve the form across background/resume.
- Save student/card details transactionally in app-private SQLite; registrations persist across app restarts. Android backup is disabled.
- Scan known cards to display the saved student name and details. Continue looking up subsequent cards locally with no network request.
- Reject duplicate card IDs and duplicate nonempty student numbers on the same phone. Preserve leading zeroes and UID byte order.
- Handle disabled/unsupported NFC, unusable identifiers, scanner startup errors, and local save errors; provide NFC settings/retry actions and retain failed form entries.
- Standalone ARM64 Android APK, built locally and installed over USB on the owner's Android 16 phone. No Metro connection is required. Foreground reader startup, background/resume, force-stop/relaunch, and larger-text layout checked on that phone.
- Isolated runnable tests for identifier handling, validation, SQLite constraints/lookup, and persistence across database reopen.

Physical card compatibility and UID stability still require real student-card taps. The prototype does not record attendance, synchronize, edit/delete registrations, or replace cards.

## Owner-requested behavior

- Android application for attendance.
- College student council operation for events, prioritizing fast attendee check-in.
- Tap a compatible student ID on the phone using NFC to record attendance.
- Register students individually; do not import an official student list.
- Use Google Sheets as the shared student/card/event attendance store.
- Save registrations locally first, then manually retrieve/check/upload pending registrations in batches.
- Download the latest registered-student/card list before starting an attendance session; perform lookups and attendance saves locally with no per-tap network request.
- Upload attendance after the local session, reconciling with the latest shared attendance before writing.

## Proposed first version

- Council member sign-in and access limited to assigned events and permitted registration/reporting actions.
- Student records and one-time linking of a compatible card identifier to a student, reused across events without writing student data to the card.
- Individual registration in the app: enter student number/name, verify the physical ID, tap the card, and save a durable local student/card assignment. Check duplicates locally and reconcile shared student numbers/active UIDs at upload.
- Registration verifies the selected student against the physical ID before linking; an unknown card is routed to a registration workflow separate from the fast scanning queue.
- Card replacement/revocation with no change to past attendance.
- Shared events with local phone sessions; finish a phone session independently of event finalization.
- Continuous scanning while the attendance screen is active, with clear saved-on-phone, duplicate, unknown-card, and failure feedback. Persist before confirming a local save.
- One canonical shared attendance record per student/event after upload reconciliation, including retries and multiple phones. Offline phones may each temporarily hold a pending observation of the same student.
- Event attendance lists, totals, and history, distinguishing local pending counts from shared results. Absence counts apply only when an explicit expected-attendee list is configured and finalized.
- Council corrections with an audit record and reason for students who cannot tap a usable card.
- Durable pending queues survive app termination, upload failures, and expired sign-in. Mark only acknowledged operations synced; retain conflicts for council review.
- Manual sync results distinguish uploaded, already recorded, and conflicting records. Retry safely after an upload succeeds but its response is lost.
- Clear handling of disabled/unsupported NFC, cards outside an event's configured eligibility list, expired sign-in, network/storage failures, and event-state conflicts.

## Selected storage and proposed implementation

- SQLite holds local registration drafts, downloaded snapshots, sessions, attendance, and pending sync operations. Google Sheets holds shared synchronized records.
- A proposed authenticated Apps Script service locks the latest read/compare/write sequence, validates incoming batches and permissions, writes missing records in batches, and returns per-record outcomes.
- Keep stable student IDs separate from replaceable card assignments and event attendance. See reconciliation and workbook design in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Later candidates

- Attendance export.
- Multiple attendance windows, check-out, or late classification if the owner needs them and defines the rules.
- Optional new-session preparation from stale cached data, or attendance for registrations that have not yet synchronized, if required.

The owner-requested direction is confirmed; everything beyond the implemented prototype above remains planned or proposed. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for delivery order and acceptance checks.
