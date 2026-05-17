# Project 02 — RICE_POT Test Case Generator

An enterprise-grade API test case generator using the **RICEPOT prompt engineering methodology** to produce exhaustive, zero-hallucination test cases for the [Restful Booker API](https://restful-booker.herokuapp.com/apidoc/index.html) — delivered as a formatted Excel workbook.

---

## What This Is

A prompt engineering project that demonstrates how a single, well-structured RICEPOT prompt (`RICE_POT.md`) can instruct an AI to generate a complete, enterprise-quality API test case document — covering all endpoints, positive and negative scenarios, exact request/response payloads, and SLA assertions — with zero invented content.

The AI reads the live API documentation, maps every endpoint and example, and produces test cases that can be handed directly to a QA engineer or automation engineer without further editing.

---

## RICEPOT Methodology

Every section of `RICE_POT.md` plays a specific role in producing reliable output:

| Section | What it does in this project |
|---------|------------------------------|
| **R**ole | Establishes a QA Subject Matter Expert with 15+ years API testing experience |
| **I**nstructions | Mandatory/Critical/Must/Do/Don't constraints — enforces full API coverage, blocks hallucination |
| **C**ontext | Points to `restful-booker.herokuapp.com/apidoc/index.html` as the only valid data source |
| **E**xample | References `Test cases - Ultimate _ TheTestingAcademy.xlsx` for exact column structure |
| **P**arameters | Enterprise precision — all examples, all endpoints, both positive and negative scenarios |
| **O**utput | Excel file matching the template columns exactly |
| **T**one | Technical, Precise, Enterprise-grade, Detailed |

---

## Project Structure

```
Project_02_RICE_POT_TestCaseGenerator/
├── RICE_POT.md                              # Master RICEPOT prompt
├── README.md                                # This file
├── progress.md                              # Phase-by-phase development log
│
├── Test cases - Ultimate _ TheTestingAcademy.xlsx   # Reference template (column structure)
├── Restful_Booker_TestCases.xlsx            # Generated output — 22 test cases
│
├── read_cols.py                             # Utility: inspect template column names
├── generate_excel.py                        # Phase 1: initial generator
├── generate_excel_advanced.py               # Phase 2: enterprise-quality generator
└── generate_excel_exact.py                  # Phase 3: column-exact final version
```

---

## Target API — Restful Booker

The Restful Booker is a publicly available REST API designed for training and testing. It exposes three service groups:

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /auth` — create token |
| **Booking** | `GET /booking` — list IDs · `GET /booking/{id}` — get booking · `POST /booking` — create · `PUT /booking/{id}` — full update · `PATCH /booking/{id}` — partial update · `DELETE /booking/{id}` — delete |
| **Ping** | `GET /ping` — health check |

---

## Output — `Restful_Booker_TestCases.xlsx`

**22 test cases** across all API groups, covering:

### Auth (POST /auth)
- Valid credentials → 200 + token returned
- Invalid password → 200 + `"Bad credentials"` body
- Missing username field → error response
- Missing password field → error response
- Empty payload → error response

### Booking (GET /booking)
- Get all booking IDs → 200 + JSON array
- Filter by `firstname` query param
- Filter by `lastname` query param
- Filter by `checkin` / `checkout` date range
- Get booking by valid ID → 200 + full booking object
- Get booking by non-existent ID → 404

### Booking (POST /booking)
- Create with full valid payload → 201 + bookingid returned
- Create with missing mandatory field (`firstname`) → error
- Create with invalid date format → error
- Create with invalid `totalprice` type → error

### Booking (PUT / PATCH)
- Full update with valid token → 200 + updated object
- Full update without Auth → 403
- Partial update (`PATCH`) with valid token → 200
- Partial update without Auth cookie → 403
- Partial update with invalid token → 403

### Booking (DELETE)
- Delete with valid token → 201
- Delete without Auth → 403
- Delete already-deleted booking → 404 / 405

### Ping
- Health check → 201 Created

---

## Excel Column Structure

Matches `Test cases - Ultimate _ TheTestingAcademy.xlsx` exactly:

| Column | Content |
|--------|---------|
| TC ID | Unique identifier (TC-001 …) |
| Title | What the test verifies |
| Pre-requisites | What must exist before execution |
| Test Data | Input values used |
| Test Steps | Step-by-step with full JSON request body injected |
| Request Headers | `Content-Type`, `Accept`, `Cookie`, `Authorization` |
| Expected Response Body | Full JSON response with all fields |
| Expected Status Code | 200 / 201 / 403 / 404 / 500 |
| Expected Response Headers | `Content-Type: application/json` etc. |

---

## How It Was Built

### Phase 1 — Template Inspection & Initial Generator
- Used `read_cols.py` to extract the exact column names from the reference template
- Built `generate_excel.py` with basic test case data
- Output matched structure but lacked depth in payloads and assertions

### Phase 2 — Quality Overhaul
- Rewrote as `generate_excel_advanced.py`
- Injected full JSON request body examples directly from the API documentation into the Test Steps column
- Added exact header combinations (`Accept`, `Content-Type`, `Cookie`, `Authorization`)
- Added SLA assertion: `Response time < 2s`
- Applied enterprise Excel formatting: dark header row, white bold font, `wrap_text=True`, frozen panes, column width 65 for long-text columns
- **Output:** `Restful_Booker_TestCases.xlsx` — 9 initial test cases

### Phase 4 — Test Suite Expansion
- Added 13 additional test cases covering:
  - Auth edge cases (empty vs invalid payloads)
  - Booking GET with all filter combinations
  - CREATE with incorrect field types / missing mandatory fields
  - PATCH and DELETE with missing/invalid auth
- **Output:** `Restful_Booker_TestCases.xlsx` — expanded to **22 test cases**

---

## Anti-Hallucination Rules Applied

1. **[Critical]** All test cases reference only endpoints and examples from `restful-booker.herokuapp.com/apidoc/index.html`
2. **[Don't]** No invented endpoints, status codes, or response fields
3. **[Mandatory]** Every API listed in the documentation is covered
4. **[MUST]** Every example value from the documentation is used in at least one test case
5. Request bodies are copied verbatim from API documentation — not paraphrased

---

## How to Use the Prompt

1. Open `RICE_POT.md`
2. Paste the full content into Claude (or any capable LLM)
3. The AI will access the Restful Booker API documentation and generate the test cases
4. Output will be an Excel file matching the template column structure

To adapt for a different API:
- Replace the URL in **Context** with your API documentation URL
- Replace the **Example** reference with your own template file
- Update **Parameters** with your project-specific naming conventions

---

## Key Insight

The RICEPOT structure eliminates the need for prompt iteration. Because the instructions are explicit, ranked (`[Mandatory]` → `[Critical]` → `[MUST]` → `[Do]` → `[Don't]`), and grounded in a real external document (the API docs) and a real template (the Excel file), the AI produces enterprise-ready output on the first attempt — with no invented content.
