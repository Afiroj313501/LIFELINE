# LifeLine — Domain Specifications

## 1. Bangladesh Administrative & Localization Specifications

### 1.1 Administrative Hierarchy
Bangladesh is structured into three primary administrative tiers:
1. **Division (বিভাগ)** — 8 Divisions:
   - Barishal (বরিশাল)
   - Chattogram (চট্টগ্রাম)
   - Dhaka (ঢাকা)
   - Khulna (খুলনা)
   - Mymensingh (ময়মনসিংহ)
   - Rajshahi (রাজশাহী)
   - Rangpur (রংপুর)
   - Sylhet (সিলেট)
2. **District (জেলা)** — 64 Districts (e.g., Dhaka, Chattogram, Sylhet, Bogura, Cox's Bazar).
3. **Upazila / Thana (উপজেলা / থানা)** — 495+ Upazilas.

### 1.2 Dual-Mode Addressing Architecture
To ensure high reliability even with poor GPS reception or rural areas:
- **Primary (Structured)**: Mandatory selection of `Division` -> `District` -> `Upazila` + Freeform Street/Hospital Address.
- **Secondary (Spatial)**: Optional `Latitude` and `Longitude` (WGS 84 coordinate system) for proximity calculation in urban centers.

### 1.3 Phone Number Specification
All phone numbers must belong to authorized Bangladesh mobile network operators:

| Operator | Dialing Codes / Prefixes |
| :--- | :--- |
| Grameenphone / Skitto | `017`, `013` |
| Banglalink | `019`, `014` |
| Robi / Airtel | `018`, `016` |
| Teletalk | `015` |

#### Validation Regex:
```regex
^(?:\+8801|01)[3-9]\d{8}$
```
- **Input acceptance**: Accepts both `017XXXXXXXX` (local) and `+88017XXXXXXXX` (international).
- **Storage normalization**: Always stored in standard E.164 format: `+8801XXXXXXXXX` (14 characters).

### 1.4 Localization Defaults
- **Timezone**: `Asia/Dhaka` (UTC+06:00).
- **Date Format**: `DD/MM/YYYY` (display), ISO-8601 UTC (storage).
- **Languages**: English (`en`) and Bengali (`bn`).

---

## 2. Medical Blood Compatibility & Donor Eligibility

### 2.1 Red Blood Cell (RBC) Compatibility Matrix

The matching engine uses the following clinically recognized whole blood / RBC compatibility standards:

| Recipient Blood Group | Compatible Donor Blood Groups | Universal Status |
| :--- | :--- | :--- |
| **O-** | O- | Universal Donor to all groups |
| **O+** | O+, O- | — |
| **A-** | A-, O- | — |
| **A+** | A+, A-, O+, O- | — |
| **B-** | B-, O- | — |
| **B+** | B+, B-, O+, O- | — |
| **AB-** | AB-, A-, B-, O- | — |
| **AB+** | Any (AB+, AB-, A+, A-, B+, B-, O+, O-) | Universal Recipient |

> [!IMPORTANT]
> **Clinical Disclaimer**: The matching engine provides emergency search and volunteer coordination *only*. It is **never** a substitute for laboratory cross-matching and Rh factor validation conducted by qualified hospital pathologists prior to transfusion.

### 2.2 Donor Eligibility Standards (Bangladesh Directorate General of Health Services / WHO Guidelines)

1. **Donation Frequency / Deferral Interval**:
   - **Minimum Interval**: 90 days (12 weeks / ~3 months) between whole blood donations.
   - Donors with a `lastDonationDate` less than 90 days from the current date are automatically marked **Temporarily Ineligible** for matching broadcasts.
2. **Age Thresholds**:
   - Minimum: 18 years.
   - Maximum: 60 years (first-time) or 65 years (regular donors with medical clearance).
3. **Weight Thresholds**:
   - Minimum: 45 kg (females), 50 kg (males).
4. **Temporary Health Deferrals**:
   - Recent major surgery: 6–12 months deferral.
   - Tattoo or body piercing: 6 months deferral.
   - Recent antibiotics/infection: Minimum 14 days post-recovery.
   - Pregnancy / Lactation: Minimum 6 months post-delivery or lactation period.
