# Project 05 — TestGen Orchestrator

> Give it a JIRA story ID. Walk away. Come back to a test plan, test cases, execution results, and filed bugs.

An AI-powered, end-to-end QA pipeline driven entirely by prompts. The orchestrator reads a JIRA story, generates a test plan and test cases, executes them via Playwright AI Agent, and files JIRA bugs — all from a single story ID with zero manual test writing.

---

## The Pipeline

```
📥 Stage 1 — Extract JIRA Story          → specs/jira-story-extractor.md
📋 Stage 2 — Generate Test Plan          → specs/test-plan-generator.md
🧪 Stage 3 — Generate Test Cases         → specs/test-case-generator.md
🤖 Stage 4 — Execute via Playwright Agent → specs/test-case-executor.md
📊 Stage 5 — Dashboard & History         → auto-generated from execution data
🐛 Stage 6 — Raise JIRA Bugs             → specs/jira-bug-creator.md
```

Each stage is a self-contained RICEPOT prompt file. The orchestrator loads each stage in sequence and coordinates their outputs.

---

## How It Works

```
User provides: JIRA Story ID + Base URL + environment
                    │
                    ▼
Stage 1: mcp-atlassian fetches full story + linked Confluence PRD
                    │
                    ▼
Stage 2: Test plan generated from story content, saved to output/test-plan/
                    │
                    ▼
Stage 3: Test cases generated from test plan, saved to output/test-cases/
                    │
                    ▼
Stage 4: Playwright AI Agent executes each test case in live browser
         Screenshots captured for every failure
                    │
                    ▼
Stage 5: Dashboard and execution history auto-updated
                    │
                    ▼
Stage 6: One-click JIRA bug creation per failed test case
```

---

## Difference From Earlier Projects

| | Project_02 (Playwright MCP) | Project_04 (QA Agent) | Project_05 (Orchestrator) |
|-|-----------------------------|----------------------|--------------------------|
| **Input** | User writes test cases | Feature spec + URL | JIRA story ID only |
| **Test design** | Human-driven | Agent autonomous | Orchestrated pipeline |
| **Traceability** | None | None | Full (JIRA → plan → TC → result → bug) |
| **Bug filing** | Manual | Manual | Automatic via mcp-atlassian |
| **Scale** | Single feature | Single spec | Full story backlog |

---

## Architecture

```
Project_05_Test_Orchestrator/
├── README.md                          # This file
├── specs/
│   ├── README.md                      # Master orchestrator prompt (load this in Claude)
│   ├── jira-story-extractor.md        # Stage 1 prompt — JIRA extraction
│   ├── test-plan-generator.md         # Stage 2 prompt — test plan generation
│   ├── test-case-generator.md         # Stage 3 prompt — test case generation
│   ├── test-case-executor.md          # Stage 4 prompt — Playwright execution
│   └── jira-bug-creator.md            # Stage 6 prompt — JIRA bug creation
├── resources/
│   ├── enterprise_test_plan_template.md   # Template enforced in Stage 2
│   └── enterprise_test_case_template.md   # Template enforced in Stage 3
├── output/
│   ├── jira-stories/                  # Stage 1 output
│   │   └── {PROJECT-KEY}-{timestamp}/
│   │       ├── index.md
│   │       └── {JIRA-ID}-{title}.md
│   ├── test-plan/                     # Stage 2 output
│   │   └── {JIRA-ID}-{title}-{timestamp}.md
│   ├── test-cases/                    # Stage 3 output
│   │   └── {JIRA-ID}-{title}-test-cases-{timestamp}.md
│   ├── test-case-executor/            # Stage 4 output
│   │   └── {JIRA-ID}/{timestamp}/
│   │       ├── execution-report.md
│   │       └── artifacts/{TC-ID}-FAILED-{time}.png
│   └── reports/                       # Stage 6 output
│       └── {JIRA-ID}-bug-report-{timestamp}.md
├── package.json
└── seed.spec.ts
```

---

## RICEPOT Prompt Design

Every stage spec is a RICEPOT-structured prompt loaded and executed by an AI agent:

| Stage | File | RICEPOT Role |
|-------|------|-------------|
| 1 | `jira-story-extractor.md` | JIRA extraction specialist — fetches via mcp-atlassian |
| 2 | `test-plan-generator.md` | QA architect — builds plan from story content only |
| 3 | `test-case-generator.md` | QA engineer — writes atomic, traceable test cases |
| 4 | `test-case-executor.md` | Playwright agent — executes in live browser |
| 5 | *(auto)* | Dashboard engine — aggregates execution history |
| 6 | `jira-bug-creator.md` | Bug reporter — creates structured JIRA tickets |

**Anti-hallucination rules enforced at every stage:**
- Stage 2: every test module must map to a JIRA acceptance criterion
- Stage 3: every test case ID traces to a plan section (`TC-{JIRA-ID}-{MODULE}-{seq}`)
- Stage 6: every bug references the exact TC-ID and screenshot path

---

## Traceability Format

Test Case IDs link every test case back to the story and module:

```
TC-{JIRA-ID}-{MODULE-CODE}-{3-digit-sequence}

Example: TC-PROJ-1234-AUTH-001
         TC-PROJ-1234-AUTH-002
         TC-PROJ-1234-SSO-001
         TC-PROJ-1234-PERF-001
```

---

## Running the Orchestrator

### Prerequisites
- Claude Code (or any Claude-powered agent) with file system access
- `mcp-atlassian` configured for Stages 1 and 6 (JIRA integration)
- Playwright installed for Stage 4: `npm install && npx playwright install chromium`

### Inputs Collected at Start

| Input | Description | Example |
|-------|-------------|---------|
| JIRA Domain | Atlassian instance URL | `https://company.atlassian.net` |
| Access Token | Personal Access Token | `ATATT3x...` |
| Email | Atlassian account email | `user@company.com` |
| Project Key | JIRA project identifier | `PROJ` |
| Base URL | App URL for test execution | `https://staging.app.com` |
| Environment | Target env | `staging` / `production` |
| Author Name | For document headers | `Jane Smith` |

> **Security:** Credentials are passed only to `mcp-atlassian`. They are never logged, stored, or written to any output file.

### Start the Orchestrator

Open `specs/README.md` as a system prompt in your AI agent (Claude Code, Copilot agent, etc.). The orchestrator will guide you stage by stage.

For Stages 2 and 3 only (no JIRA required), provide:
- A pre-written story file (place it at `output/jira-stories/{key}/`)
- Run the agent with `specs/test-plan-generator.md` then `specs/test-case-generator.md`

---

## Output Files

| Stage | Output location | Contents |
|-------|----------------|---------|
| 1 | `output/jira-stories/{key}-{ts}/` | One `.md` per story + `index.md` |
| 2 | `output/test-plan/` | Full test plan per story |
| 3 | `output/test-cases/` | All test cases with traceability table |
| 4 | `output/test-case-executor/{id}/{ts}/` | Execution report + failure screenshots |
| 6 | `output/reports/` | Bug creation summary |

---

## Live Dashboard (Stage 5)

After each execution, the orchestrator displays an in-context dashboard:

```
┌─────────────────────────────────────────────────────────┐
│ TestGen Orchestrator — QA Dashboard                     │
│ Story: PROJ-1234 | Last Run: 2026-05-17 12:00           │
├───────────┬──────────┬──────────┬──────────┬────────────┤
│ Total TCs │ Passed   │ Failed   │ Skipped  │ Pass Rate  │
│    24     │   20     │    3     │    1     │   83.3%    │
├───────────┴──────────┴──────────┴──────────┴────────────┤
│ Top Failing Modules: Authentication (2), SSO Flow (1)   │
└─────────────────────────────────────────────────────────┘
```

---

## Relationship to Other Projects

| Project | Role in Blueprint |
|---------|------------------|
| Project_02 | Playwright MCP test generator — human drives steps |
| Project_04 | Autonomous agent — spec to verdict in one run |
| **Project_05** | **Full enterprise pipeline — JIRA to bug in one pipeline** |
| Project_06 | RAG — knowledge-augmented QA |
| Project_07 | QA Copilot — inline assistance |
