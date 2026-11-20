# Features

Status: planning only. None of the features below is implemented.

## Owner-requested behavior

- Android application for attendance.
- College student council operation for events, prioritizing fast attendee check-in.
- Tap a compatible student ID on the phone using NFC to record attendance.

## Proposed first version

- Council member sign-in and access limited to assigned events and permitted registration/reporting actions.
- Student records and one-time linking of a compatible card identifier to a student, reused across events without writing student data to the card.
- Student-list import when an official roster is available, with manual registration otherwise. Authorized existing card mappings may be imported if supplied and validated.
- Registration verifies the selected student against the physical ID before linking; an unknown card is routed to a registration workflow separate from the fast scanning queue.
- Card replacement/revocation with no change to past attendance.
- Create, open, and close events.
- Continuous scanning while the attendance screen is active, with clear saved, duplicate, unknown-card, and failure feedback.
- At most one attendance record per student per event, including retries and multiple scanning phones.
- Event attendance lists, totals, and history. Absence counts apply only when an explicit expected-attendee list is configured and finalized.
- Council corrections with an audit record and reason for students who cannot tap a usable card.
- Clear handling of disabled/unsupported NFC, cards outside an event's configured eligibility list, expired sign-in, network failures, and closed events.

## Later candidates

- Durable offline attendance queue and reconciliation.
- Attendance export.
- Multiple attendance windows, check-out, or late classification if the owner needs them and defines the rules.

These are proposals, not confirmed requirements or owner exclusions. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for delivery order and acceptance checks.
