# LifeLine — System Architecture & State Machine Blueprint

## 1. Modular Monolith Architecture

LifeLine is architected as a modular monolith in TypeScript. All domain modules maintain clean encapsulation, allowing any module to be extracted into an independent microservice in the future if required.

```
server/
├── prisma/
│   ├── schema.prisma            # Normalized database schema
│   ├── migrations/              # Database migration history
│   └── seed.ts                  # Seed script (BD divisions, districts, upazilas)
├── src/
│   ├── common/                  # Cross-cutting interfaces, base errors, constants
│   ├── config/                  # Environment variable schema & config loader
│   ├── middleware/              # Auth, role-guard, rate-limit, error-handler
│   ├── modules/
│   │   ├── auth/                # Registration, login, JWT, refresh rotation, password reset
│   │   ├── users/               # User account management & settings
│   │   ├── donors/              # Donor profiles, eligibility, availability, privacy
│   │   ├── blood-requests/      # Blood request CRUD, lifecycle state machine
│   │   ├── matching/            # Proximity & compatibility matching engine
│   │   ├── notifications/       # Socket.IO, BullMQ, Resend email, FCM push
│   │   ├── organizations/       # Hospitals and blood banks management
│   │   ├── volunteers/          # Volunteer verification and dispatch
│   │   └── admin/               # Moderation queue, audit logs, fraud reports
│   ├── services/                # Infrastructure clients (Prisma, Redis, Mailer)
│   ├── app.ts                   # Express application setup
│   └── server.ts                # HTTP + Socket.IO server entry point
```

### Module Layering Rules
1. **Controller Layer**: Handles HTTP requests/responses, status codes, and input parsing.
2. **Validation Layer**: Zod schemas validate `body`, `query`, and `params` before reaching service logic.
3. **Service Layer**: Pure business logic, transaction boundaries, and state transitions. No direct `req` or `res` objects.
4. **Data Layer**: Prisma client queries with strict type-safety and explicit column selections to avoid accidental exposure of sensitive fields.

---

## 2. Emergency Blood Request Finite State Machine (FSM)

The lifecycle of an emergency blood request is strictly deterministic. Direct jumps across unauthorized states are prohibited.

```
                      ┌───────────────┐
                      │    PENDING    │
                      └───────┬───────┘
                              │ Volunteer / Hospital reviews
                              ▼
                      ┌───────────────┐        Rejected / Fake
                      │ UNDER_REVIEW  │──────────────────────────▶ [ REJECTED ]
                      └───────┬───────┘
                              │ Verification confirmed
                              ▼
                      ┌───────────────┐
                      │   VERIFIED    │
                      └───────┬───────┘
                              │ System / Staff initiates broadcast
                              ▼
                      ┌───────────────┐        Target date passes
                      │ BROADCASTING  │──────────────────────────▶ [ EXPIRED ]
                      └───────┬───────┘
                              │ Donor accepts request
                              ▼
                      ┌──────────────────┐
                      │ DONOR_RESPONDED  │
                      └───────┬──────────┘
                              │ Donation completed at hospital
                              ▼
                      ┌───────────────┐
                      │   FULFILLED   │ (Terminal State)
                      └───────────────┘

* Note: Requester can transition from any non-terminal state to [ CANCELLED ].
```

### State Definitions & Permissions:
- `PENDING`: Initial state upon creation by a patient or family member.
- `UNDER_REVIEW`: Locked for verification by a registered Volunteer, Hospital Staff, or Admin.
- `VERIFIED`: Validated with medical documents or hospital admission proof.
- `BROADCASTING`: Active notification fan-out to matching donors in geographic range.
- `DONOR_RESPONDED`: One or more eligible donors have committed to donate.
- `FULFILLED`: Hospital or volunteer confirmed successful blood donation.
- `REJECTED`: Found to be invalid, duplicate, or fraudulent.
- `CANCELLED`: Requester found blood independently or patient condition resolved.
- `EXPIRED`: Required date/time elapsed without sufficient donors.

---

## 3. Privacy & Data Masking Contracts

Personal health and contact information requires strict zero-trust boundaries:

1. **Public Donor Search**:
   - Returns: First name initial, Blood Group, District/Upazila, Availability Status, Approximate Distance.
   - **Never Returns**: Phone Number, Exact House Address, Email, National ID (NID).
2. **Phone Number Reveal Protocol**:
   - A donor's contact number is **only revealed** to a verified requester if:
     a) The blood request is in `VERIFIED` or `BROADCASTING` status.
     b) The donor explicitly clicks "Accept to Donate" or has configured "Auto-share with verified emergencies".
   - Every contact access is logged in `AuditLog` with timestamp, viewer ID, and IP address.

---

## 4. Authentication & Token Architecture

- **Access Token**: Short-lived (15 minutes), signed RS256 or HS256 JWT containing `userId`, `roles`, and `permissions`. Transmitted via `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived (7 days), cryptographically secure random token stored as a SHA-256 hash in the database.
- **Single-Use Rotation**: When a refresh token is used to issue a new access token, the old refresh token is immediately invalidated and replaced with a new one.
- **Reuse Detection**: If an already-invalidated refresh token is presented, the entire family of tokens for that user session is immediately revoked (defends against token theft).
- **Transport**: Stored in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
