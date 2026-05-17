# Project 02 — QA Platform: AI-Driven Test Generation & Execution

A full-stack QA automation platform combining **Playwright DOM extraction**, **multi-provider LLM support**, and **RICEPOT-structured prompts** to generate test plans, test cases, and execute them live — all from a browser UI.

This project merges two methodologies:
- **Playwright MCP Project** — live browser automation for DOM capture and test execution
- **RICE_POT Prompt Engineering** — structured, anti-hallucination prompt design per action

---

## Architecture

```
Browser UI (React + Vite)
        │
        │  HTTP / SSE
        ▼
Express Backend (Node.js + TypeScript)
        │
        ├── Playwright ──────► real browser (DOM extraction + test execution)
        └── LLM Service ─────► any AI provider (Anthropic / OpenAI / Gemini / Groq / Ollama / LM Studio)
                │
                └── reads RICEPOT prompts from prompts/*.md at runtime
```

### Four-Step Workflow

```
Step 1: Enter URL + LLM config
  └─► Playwright opens URL, extracts DOM text (no screenshot sent to LLM)

Step 2: AI generates Test Plan
  └─► RICEPOT Prompt 02 → test_plan.md

Step 3: AI generates Test Cases
  └─► RICEPOT Prompt 03 → test_cases.md (TC-001 … TC-N)

Step 4: Execute & Verify
  └─► RICEPOT Prompt 04 converts steps to Playwright actions
  └─► Playwright runs actions live
  └─► RICEPOT Prompt 05 verifies pass/fail against expected result
  └─► Results streamed live to UI via SSE
```

---

## Project Structure

```
Project_02_Playwright_MCP_Project/
├── PROMPT.md                          # Master prompt index (this file's companion)
├── README.md                          # This file
│
├── prompts/                           # RICEPOT prompt files — loaded by backend at runtime
│   ├── 01_dom_extraction.md           # Playwright DOM capture spec (not an LLM prompt)
│   ├── 02_test_plan_generation.md     # RICEPOT: Test plan generation
│   ├── 03_test_cases_generation.md    # RICEPOT: Test case generation
│   ├── 04_action_interpretation.md    # RICEPOT: Steps → Playwright JSON actions
│   └── 05_result_verification.md      # RICEPOT: Pass/Fail verdict
│
├── resources/                         # Reusable document templates
│   ├── test_plan_template.md          # 11-section test plan ({{PLACEHOLDER}} format)
│   └── test_case_template.md          # Per-test-case format ({{PLACEHOLDER}} format)
│
├── app/
│   ├── backend/                       # Express + TypeScript
│   │   └── src/
│   │       ├── server.ts
│   │       ├── routes/
│   │       │   ├── analyse.ts         # POST /api/analyse — Playwright DOM extraction
│   │       │   ├── generate.ts        # POST /api/generate/test-plan & /test-cases
│   │       │   └── execute.ts         # POST /api/execute — live test execution + SSE
│   │       └── services/
│   │           ├── browser.ts         # Playwright browser instance management
│   │           └── llm.ts             # loadPrompt() + callLLM() + all 4 LLM functions
│   │
│   └── frontend/                      # React 18 + Vite + TypeScript
│       └── src/
│           ├── App.tsx
│           └── components/
│               ├── Step1Setup.tsx     # URL input + LLM provider config
│               ├── Step2TestPlan.tsx  # Test plan display + edit
│               ├── Step3TestCases.tsx # Test cases table + markdown view
│               └── Step4Results.tsx  # Live execution results via SSE
│
├── deliverables/                      # AI-generated outputs (saved via API)
│   ├── test_plan.md
│   └── test_cases.md
│
└── reports/
    └── report.html                    # Test execution HTML report
```

---

## RICEPOT Prompt Design

Every LLM call uses a separate markdown file in `prompts/` following the RICEPOT methodology:

| Section | Purpose |
|---------|---------|
| **R**ole | Expert persona with domain depth |
| **I**nstructions | Ranked constraints: Mandatory → Critical → Must → Do → Don't |
| **C**ontext | Runtime `{{PLACEHOLDERS}}` — domText, testPlan, steps, etc. |
| **E**xample | Concrete input/output pair for LLM pattern-matching |
| **P**arameters | Token limits, format rules, allowed values |
| **O**utput | Exact deliverable format, destination, next consumer |
| **T**one | Precision calibration |

The backend function `loadPrompt(filename, replacements)` reads the file, replaces all `{{KEY}}` tokens with runtime values, and sends the full RICEPOT document as the LLM prompt. **Changing a prompt requires only editing its `.md` file — no code changes.**

### Prompt chain:

| Prompt | File | Placeholders injected |
|--------|------|-----------------------|
| 01 DOM Extraction | `prompts/01_dom_extraction.md` | — (Playwright only) |
| 02 Test Plan | `prompts/02_test_plan_generation.md` | `URL`, `DOM_TEXT`, `ADDITIONAL_CONTEXT` |
| 03 Test Cases | `prompts/03_test_cases_generation.md` | `URL`, `DOM_TEXT`, `TEST_PLAN` |
| 04 Actions | `prompts/04_action_interpretation.md` | `URL`, `PRECONDITIONS`, `STEPS`, `DOM_TEXT` |
| 05 Verification | `prompts/05_result_verification.md` | `EXPECTED_RESULT`, `PAGE_TEXT` |

---

## Anti-Hallucination Rules

1. **DOM is the only source of truth** — every field name, button label, and selector must trace back to `domText`
2. **No invented features** — if it's not in the DOM, it's not in scope
3. **PRD cross-reference** — features in PRD but absent from DOM are excluded
4. **JSON output purity** — Prompts 04 and 05 return only machine-parseable JSON
5. **No preamble in Prompt 03** — output starts directly with `### TC-001`

---

## Supported LLM Providers

| Provider | Config | Default Model |
|----------|--------|--------------|
| Anthropic Claude | API key | `claude-sonnet-4-6` |
| OpenAI | API key | `gpt-4o` |
| Google Gemini | API key + base URL | `gemini-1.5-flash` |
| Groq | API key + base URL | `llama-3.3-70b-versatile` |
| Ollama (local) | base URL only | `gemma3:1b` |
| LM Studio (local) | base URL only | `local-model` |

---

## Running the App

### Prerequisites
- Node.js 18+
- Playwright browsers: `cd app/backend && npx playwright install`

### Backend
```bash
cd app/backend
npm install
npm start          # ts-node src/server.ts on port 3001
# or
npm run dev        # nodemon watch mode
```

### Frontend
```bash
cd app/frontend
npm install
npm run dev        # Vite dev server on port 5173 (or next available)
```

Open `http://localhost:5173` (or whichever port Vite reports).

---

## How It Works End-to-End

1. **Enter URL** — paste any website URL (e.g., `amazon.in`) and choose your LLM provider
2. **Analyse Page** — Playwright opens the URL in a headless browser, extracts the full DOM as structured text (no vision required), takes a screenshot for preview only
3. **Generate Test Plan** — the DOM text is sent through RICEPOT Prompt 02 to produce a structured test plan; you can edit it before proceeding
4. **Generate Test Cases** — RICEPOT Prompt 03 uses the DOM + test plan to produce `### TC-001 … TC-N` in the exact template format
5. **Execute Tests** — for each test case, RICEPOT Prompt 04 converts the steps to Playwright actions, the browser executes them live, and RICEPOT Prompt 05 gives a PASS/FAIL verdict — streamed to the UI in real time
6. **Save Deliverables** — click Save to write `deliverables/test_plan.md` and `deliverables/test_cases.md`

---

## Deliverables (example — VWO login page)

| File | Content |
|------|---------|
| `deliverables/test_plan.md` | Full test plan — scope, strategy, risk, schedule |
| `deliverables/test_cases.md` | 5 negative test cases (TC-LOGIN-NEG-01 … 05) |
| `reports/report.html` | Execution report — 5/5 PASSED |

---

## Template Reuse

To generate QA docs for any new application without running the full UI:
1. Copy `resources/test_plan_template.md` → fill `{{PLACEHOLDER}}` values
2. Copy `resources/test_case_template.md` → fill in test cases using the per-TC format
3. Or run the full platform — it does this automatically

---

## Key Decisions

| Decision | Reason |
|----------|--------|
| DOM text instead of screenshots | Works with all LLM providers — no vision model required |
| Separate RICEPOT `.md` per action | Prompts are versioned, readable, and changeable without touching code |
| SSE for test execution | Streams live results as each step runs — no polling |
| Inline fallback prompts in code | If a prompt file is missing the app still works |
| `{{PLACEHOLDER}}` in templates | Same pattern as RICE_POT generator projects — consistent across the blueprint |
