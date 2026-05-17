# PROMPT.md — QA Agent Master Index

**Project:** Autonomous QA Agent — "Give it a spec. Go make coffee. Come back to results."
**Methodology:** RICEPOT (Role · Instructions · Context · Example · Parameters · Output · Tone)
**Version:** 1.0

---

## The Core Idea

An agent isn't just a chatbot. It's a system that:
1. **Receives a goal** — not a task, a goal
2. **Plans autonomously** — decides which scenarios to test and how
3. **Executes with tools** — navigates, clicks, fills, asserts
4. **Observes results** — reads what actually happened
5. **Adapts its plan** — when something fails, tries a different approach
6. **Repeats until done** — calls `complete` only when all scenarios are covered

For QA: the goal is "verify that this feature works correctly." The agent reads the spec, plans the test approach, chooses tools, executes, and reports. No human writes a single test step.

---

## Single Prompt Architecture

Unlike Project_02 (5 separate prompts, one per action), this agent uses **one persistent system prompt** for the entire run. The prompt defines the agent's persona, constraints, tool use pattern, and output format — and stays active across all tool call iterations.

```
prompts/agent_system.md
  │
  └── Loaded at run start → stays as system prompt for every LLM turn
```

The prompt has two runtime placeholders:
- `{{SPEC}}` — the feature specification from the user
- `{{URL}}` — the target URL

---

## Prompt File

| File | Purpose |
|------|---------|
| [`prompts/agent_system.md`](prompts/agent_system.md) | RICEPOT system prompt — defines the full agent behaviour |

---

## RICEPOT Breakdown

| Section | What it controls |
|---------|-----------------|
| **R**ole | Autonomous QA engineer, 15+ years experience, fully independent |
| **I**nstructions | Mandatory/Critical/Must/Do/Don't — enforces Think→Act→Observe→Reflect cycle; blocks asking for human input; mandates adaptation on failure |
| **C**ontext | `{{SPEC}}` and `{{URL}}` injected at runtime |
| **E**xample | Complete annotated agent run trace (navigate → get_dom → click → assert → finding) |
| **P**arameters | Max 30 iterations, 1 retry per failure, selector-from-DOM rule |
| **O**utput | `complete` tool call schema — verdict, summary, per-scenario findings |
| **T**one | Methodical, autonomous, precise — never asks for help |

---

## Agent Tool Set

| Tool | What the agent uses it for |
|------|---------------------------|
| `navigate(url)` | Open the target URL in the browser |
| `get_dom()` | Extract page structure — the source of all selectors |
| `click(selector, description)` | Click buttons, links, form elements |
| `fill(selector, value, description)` | Enter text into inputs |
| `wait_for(selector, timeout)` | Wait for dynamic content |
| `get_text(selector?)` | Read text from page or element |
| `assert_text_present(text, description)` | Verify text is on the page |
| `assert_element_exists(selector, description)` | Verify an element is present |
| `assert_url_contains(pattern, description)` | Verify navigation succeeded |
| `complete(verdict, summary, findings)` | End the run and return results |

---

## Agent Loop

```
User submits spec + URL
         │
         ▼
POST /api/run → returns runId immediately
         │
         ▼                         ┌──────────────────────────┐
GET /api/run/:id/stream (SSE) ◄────┤   LLM turn N             │
         │                         │   • Text blocks → thought │
         │                         │   • tool_use blocks → act │
         │                         └──────────────┬───────────┘
         │                                        │
         ▼                                        ▼
  UI shows live feed              Playwright executes tool
  (thought / action /             Result returned to LLM
   observation / adapt)           as tool_result
         │                                        │
         │                         ┌──────────────┘
         │                         │
         └─────────────────────────┘
                    loop until complete() called
                         │
                         ▼
                  Verdict card shown
                  Report saved to reports/
```

---

## Difference From Project_02

| | Project_02 (Playwright MCP Platform) | Project_04 (QA Agent) |
|-|--------------------------------------|------------------------|
| **Who decides what to test** | User writes test cases step by step | Agent reads spec and decides autonomously |
| **Prompt structure** | 5 separate files, one per action | 1 persistent system prompt |
| **Adaptation** | None — fixed steps | Yes — retries, tries alternatives |
| **Human involvement** | High (user reviews test plan, test cases) | Zero after submitting spec |
| **Output** | Structured test plan + test cases + results | Direct verdict + findings |
| **Best for** | Detailed documentation + repeatable execution | Exploratory verification, "does this work?" |

---

## Anti-Hallucination Rules

1. **Selectors from DOM only** — agent calls `get_dom` first, then derives every selector from its output
2. **Spec bounds** — agent only tests scenarios in or directly implied by the spec
3. **Observation-based findings** — every finding must reference something actually seen on the page
4. **No invention** — agent cannot assert a result it didn't observe

---

## Supported Providers

| Provider | Notes |
|----------|-------|
| **Anthropic Claude** (recommended) | Native tool use — best for autonomous agents; `claude-sonnet-4-6` |
| OpenAI | Function calling via OpenAI SDK; `gpt-4o` |
| Google Gemini | OpenAI-compatible endpoint |
| Groq | OpenAI-compatible; fast inference |
