# PROMPT.md — Master Prompt Index

**Project:** QA Platform — AI-Driven Test Generation & Execution
**Methodology:** RICEPOT (Role · Instructions · Context · Example · Parameters · Output · Tone)
**Version:** 2.0

---

## Overview

This platform uses five sequential, RICEPOT-structured prompts to take a URL from raw page capture through to automated test execution. Each prompt lives in its own markdown file under `prompts/` and is loaded dynamically by the backend at runtime — no hardcoded prompt strings in application code.

```
User enters URL
      │
      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Prompt 01 — DOM Extraction          prompts/01_dom_extraction.md    │
│  Tool: Playwright (not LLM)                                          │
│  Output: domText (structured page snapshot)                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ domText
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Prompt 02 — Test Plan Generation    prompts/02_test_plan_generation.md│
│  Tool: LLM (any provider)                                            │
│  Input: domText + optional PRD/context                               │
│  Output: deliverables/test_plan.md                                   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ testPlan
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Prompt 03 — Test Cases Generation   prompts/03_test_cases_generation.md│
│  Tool: LLM (any provider)                                            │
│  Input: domText + testPlan                                           │
│  Output: deliverables/test_cases.md (TC-001 … TC-N)                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ individual test case (steps + preconditions)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Prompt 04 — Action Interpretation   prompts/04_action_interpretation.md│
│  Tool: LLM (any provider)                                            │
│  Input: steps + preconditions + domText                              │
│  Output: JSON array of Playwright actions                            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Playwright executes → captures live page text
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Prompt 05 — Result Verification     prompts/05_result_verification.md│
│  Tool: LLM (any provider)                                            │
│  Input: live page text + expected result from test case              │
│  Output: { "pass": true/false, "observedMessage": "..." }           │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ PASS / FAIL verdict
                               ▼
                    Results displayed in UI
```

---

## Prompt Files

| # | File | Stage | Tool | Placeholders |
|---|------|-------|------|-------------|
| 01 | [prompts/01_dom_extraction.md](prompts/01_dom_extraction.md) | Page Capture | Playwright | — |
| 02 | [prompts/02_test_plan_generation.md](prompts/02_test_plan_generation.md) | Test Plan | LLM | `{{URL}}`, `{{DOM_TEXT}}`, `{{ADDITIONAL_CONTEXT}}` |
| 03 | [prompts/03_test_cases_generation.md](prompts/03_test_cases_generation.md) | Test Cases | LLM | `{{URL}}`, `{{DOM_TEXT}}`, `{{TEST_PLAN}}` |
| 04 | [prompts/04_action_interpretation.md](prompts/04_action_interpretation.md) | Playwright Actions | LLM | `{{URL}}`, `{{PRECONDITIONS}}`, `{{STEPS}}`, `{{DOM_TEXT}}` |
| 05 | [prompts/05_result_verification.md](prompts/05_result_verification.md) | Pass/Fail Verdict | LLM | `{{EXPECTED_RESULT}}`, `{{PAGE_TEXT}}` |

---

## RICEPOT Structure

Every LLM prompt (02–05) follows the RICEPOT methodology adopted from `Project_02_RICE_POT_TestCaseGenerator` and `Project_02_RICE_POT_TestPlanGenerator`:

| Section | Purpose |
|---------|---------|
| **R**ole | Establishes the AI's expert persona and domain expertise |
| **I**nstructions | Mandatory · Critical · Must · Do · Don't — ranked constraints |
| **C**ontext | Dynamic `{{PLACEHOLDERS}}` injected at runtime |
| **E**xample | Concrete input/output pair for pattern-matching |
| **P**arameters | Technical constraints: formats, token limits, allowed values |
| **O**utput | Exact deliverable spec: format, destination, consumer |
| **T**one | Style calibration — verbosity and precision level |

---

## Anti-Hallucination Rules

Enforced across all prompts:

1. **DOM is the source of truth** — no prompt may reference UI elements absent from `domText`
2. **No invention** — field names, error messages, redirect URLs, selectors must all appear in the DOM or be explicitly provided in the test step
3. **PRD cross-reference** — only features present in BOTH the PRD and the DOM are in-scope
4. **Output purity for JSON prompts** — Prompts 04 and 05 must return ONLY machine-parseable JSON; any extra text breaks the pipeline
5. **Prompt 03 purity** — test case output must begin directly with `### TC-001`; no preamble permitted
6. **Selector fidelity** — Playwright selectors in Prompt 04 must be derived from DOM attributes visible in the extraction

---

## Template References

| Template | Used by | Purpose |
|----------|---------|---------|
| [resources/test_plan_template.md](resources/test_plan_template.md) | Prompt 02 | 11-section structure with `{{PLACEHOLDER}}` format |
| [resources/test_case_template.md](resources/test_case_template.md) | Prompt 03 | Per-test-case field format (TC ID, Title, Steps, etc.) |

---

## Backend Wiring

The function `loadPrompt(filename, replacements)` in `app/backend/src/services/llm.ts`:
1. Reads the prompt `.md` file from `prompts/`
2. Replaces `{{PLACEHOLDER}}` tokens with runtime values (domText, testPlan, steps, etc.)
3. Sends the complete RICEPOT document as the LLM prompt

**Changing a prompt requires editing only its `.md` file — no code changes needed.**

---

## Supported LLM Providers

All LLM prompts (02–05) are provider-agnostic via the unified `callLLM()` function:

| Provider | API Style | Default Model |
|----------|-----------|--------------|
| Anthropic Claude | Native SDK | `claude-sonnet-4-6` |
| OpenAI | OpenAI SDK | `gpt-4o` |
| Google Gemini | OpenAI-compatible | `gemini-1.5-flash` |
| Groq | OpenAI-compatible | `llama-3.3-70b-versatile` |
| Ollama (local) | OpenAI-compatible | `gemma3:1b` |
| LM Studio (local) | OpenAI-compatible | `local-model` |

---

## Deliverables

| File | Generated by | Content |
|------|-------------|---------|
| `deliverables/test_plan.md` | Prompt 02 | Full test plan document |
| `deliverables/test_cases.md` | Prompt 03 | All test cases (TC-001 … TC-N) |
| `reports/report.html` | Step 4 UI | Execution results (PASS/FAIL per TC) |
