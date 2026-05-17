# Project 02 — RICE_POT Test Plan Generator

An enterprise-grade test plan generator using the **RICEPOT prompt engineering methodology** to produce a rigorous, PRD-aligned test plan for the **VWO Login Dashboard** (`app.vwo.com`) — with zero hallucinated features.

---

## What This Is

A prompt engineering project that demonstrates how a single, well-structured RICEPOT prompt (`RICE_POT.md`) can instruct an AI to generate a complete enterprise test plan that:
- Maps every test module directly to a named feature in the Product Requirements Document
- Integrates exact KPIs and SLAs from the PRD (99.9% uptime, sub-2-second load, 95%+ login success)
- Covers functional, non-functional, accessibility, and security test dimensions
- Produces a document ready for executive stakeholder review — without generic boilerplate

---

## RICEPOT Methodology

Every section of `RICE_POT.md` controls a specific aspect of the output:

| Section | What it does in this project |
|---------|------------------------------|
| **R**ole | Senior QA SME with 15+ years enterprise experience and native understanding of VWO |
| **I**nstructions | Mandatory/Critical/Do/Don't — locks output to PRD features only; bans generic boilerplate |
| **C**ontext | Points to `Product Requirements Document_ VWO Login Dashboard.md` as the single source of truth |
| **E**xample | References `enterprise_test_plan_template.md` for exact document structure |
| **P**arameters | PRD feature-level precision — named algorithms, protocols, SLAs, module names |
| **O**utput | `test_plan.md` — complete, structured markdown |
| **T**one | Highly Technical, Exceptionally Precise, Enterprise-grade, Authoritative |

---

## Project Structure

```
Project_02_RICE_POT_TestPlanGenerator/
├── RICE_POT.md                                       # Master RICEPOT prompt
├── README.md                                         # This file
├── progress.md                                       # Phase-by-phase development log
│
├── Product Requirements Document_ VWO Login Dashboard.md  # Source PRD (45 features, 8 modules)
├── enterprise_test_plan_template.md                  # Document structure template
└── test_plan.md                                      # Generated output — v1.1, PRD-aligned
```

---

## Target Application — VWO Login Dashboard

VWO (Visual Website Optimizer) is used by 4,000+ brands across 90 countries. The login system is the security gateway for a platform handling A/B testing and conversion data.

The PRD covers **45 features across 8 functional areas**:

| Module | Key Features from PRD |
|--------|-----------------------|
| Authentication | Email/password login, MFA, SSO (SAML/OAuth), session management |
| Input Validation | Real-time blur validation, email format check, password strength indicator |
| Password Management | Forgot password flow, secure token generation, email-based reset |
| UI / UX | Responsive design, auto-focus, clickable labels, loading states, Light/Dark themes |
| Accessibility | WCAG 2.1 AA, screen reader support, high contrast mode, keyboard navigation |
| Security | End-to-end encryption, HTTPS, password hashing, rate limiting, GDPR compliance |
| Performance | Sub-2-second load, CDN integration, 99.9% uptime, concurrent users |
| Integrations | VWO Core redirect, Google/Microsoft OAuth, analytics tracking |

---

## Output — `test_plan.md`

**Version 1.1** — PRD-aligned enterprise test plan covering:

### 8 Test Modules (with PRD-derived weightage)

| Module | Priority | Weightage |
|--------|----------|-----------|
| 1. Primary Authentication & Identity | Critical | 25% |
| 2. Input Validation & Error Handling | High | 15% |
| 3. Password Management Flows | Critical | 15% |
| 4. Security, Compliance & Data Protection | Critical | 15% |
| 5. Performance & Scalability | High | 10% |
| 6. UI & Branding | Medium | 10% |
| 7. Accessibility (WCAG 2.1 AA) | High | 5% |
| 8. User Journeys & Integrations | Medium | 5% |

### KPIs & SLAs (from PRD — not invented)
- 99.9% uptime
- Sub-2-second page load time
- Zero successful brute-force attacks
- 95%+ login success rate
- 90%+ user satisfaction score

### Testing Dimensions
- **Functional:** Login flows, input validation, password reset, SSO, MFA
- **Non-Functional:** JMeter load testing, OWASP ZAP security scans, Axe accessibility audits
- **Tools named:** Playwright (UI), JMeter (load), ZAP (security), Axe (a11y)

---

## How It Was Built

### Phase 1 — Initial Generation
- Fed `RICE_POT.md` prompt to Claude with the PRD as context
- Generated `test_plan.md` v1.0
- Structure was correct but test modules were too generic — not tightly mapped to PRD features

### Phase 2 — PRD-Driven Alignment
- Re-evaluated the PRD section by section
- Rewrote `test_plan.md` to explicitly map each test item to a PRD feature by name (SAML/OAuth, Light/Dark modes, clickable labels, password hashing)
- Adopted exact PRD metrics: `"99.9% uptime"`, `"sub-2-second page load"`, `"95%+ authentication success rate"`
- Applied weightage distribution aligned with business risk
- **Output:** `test_plan.md` v1.1 — approved as enterprise-ready

### Phase 3 — Prompt Optimisation
- Rewrote `RICE_POT.md` to prevent generic outputs in future runs
- Enhanced `[Instructions]` and `[Parameters]` blocks to mandate:
  - Named PRD features (not category descriptions)
  - Exact KPI values
  - Specific tool callouts per test dimension
- Result: future runs with the same prompt produce equivalent quality without iteration

---

## Anti-Hallucination Rules Applied

1. **[Mandatory]** Every test module maps to an explicit PRD feature — no generic "login testing" sections
2. **[Critical]** All KPIs and SLAs are quoted from the PRD — not estimated
3. **[Don't]** No fictional VWO features, endpoints, or flows not present in the PRD text
4. **[Parameters]** Named algorithms, protocols, and thresholds (SAML, OAuth, WCAG 2.1 AA, sub-2s, 99.9%) must appear verbatim from the PRD
5. Document structure is constrained by `enterprise_test_plan_template.md` — prevents structural hallucination

---

## How to Use the Prompt

1. Open `RICE_POT.md`
2. Ensure the PRD file and template file are in the same directory
3. Paste the prompt (with the PRD content) into Claude or any capable LLM
4. The AI generates `test_plan.md` directly — no post-editing needed

To adapt for a different application:
- Replace the PRD reference in **Context** with your application's PRD
- Keep `enterprise_test_plan_template.md` as the structural guardrail (or swap with your own)
- Update **Parameters** to reference your application's specific features, protocols, and SLAs

---

## Relationship to Other Projects

| Project | What it does |
|---------|-------------|
| `Project_02_RICE_POT_TestCaseGenerator` | Generates API test cases (Excel) for Restful Booker using the same RICEPOT methodology |
| `Project_02_Playwright_MCP_Project` | Extends this approach into a full-stack app — AI generates test plans AND test cases from live DOM, then Playwright executes them |

The RICEPOT prompt pattern used here (`RICE_POT.md`) is the same methodology that powers the prompt files in `Project_02_Playwright_MCP_Project/prompts/` — just applied to live browser data instead of a static PRD.

---

## Key Insight

Anchoring the prompt to an external PRD document (rather than asking the AI to "write a test plan for a login page") transforms the output from generic QA boilerplate into a precise, auditable document where every test item can be traced back to a named feature in the PRD. The `[Mandatory]`, `[Critical]`, and `[Don't]` instruction tiers enforce this traceability without relying on the AI's judgment.
