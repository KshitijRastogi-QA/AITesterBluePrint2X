# Project 04 — Autonomous QA Agent

> Give it a spec. Go make coffee. Come back to results.

An autonomous QA agent that receives a feature specification and a URL, then independently plans, executes, observes, adapts, and reports — without a human writing a single test step.

---

## The Shift in Thinking

| Before | After |
|--------|-------|
| You write test cases | Agent reads the spec and decides what to test |
| You run the tests | Agent runs them in a live browser |
| You check the results | Agent reports pass/fail with observations |
| AI as autocomplete | AI as a junior QA engineer that never sleeps |

The agent isn't told "click this button, then assert that text." It's told "verify that the login page works" — and it figures out the rest.

---

## How It Works

```
You submit: spec (markdown) + URL + LLM API key
                │
                ▼
Agent plans:  reads spec → identifies scenarios to test
                │
                ▼
Agent acts:   navigate → get_dom → click → fill → assert → adapt
                │
                ▼
Agent reports: PASS / FAIL / PARTIAL + per-scenario findings
```

The agent runs in a continuous loop — each LLM turn produces thoughts and tool calls, which get executed by Playwright, and the results feed back into the next turn. The loop ends when the agent calls `complete` or hits 30 iterations.

### Think → Act → Observe → Adapt cycle

Every turn the agent:
1. **Thinks** — explains what it's going to do and why (streamed to UI as a thought)
2. **Acts** — calls a browser tool (navigate, click, fill, assert)
3. **Observes** — reads the result (streamed to UI as an observation)
4. **Adapts** — if something fails, tries a different approach before marking it blocked

---

## Architecture

```
Project_04_AI_Agent/
├── PROMPT.md                    # Master prompt index
├── README.md                    # This file
├── prompts/
│   └── agent_system.md          # RICEPOT system prompt (loaded at runtime)
├── specs/
│   ├── README.md
│   └── vwo-login-test-plan.md   # Example spec (detailed VWO login scenarios)
├── reports/                     # Auto-saved JSON run reports
├── .github/agents/              # GitHub Copilot agent files (separate workflow)
└── app/
    ├── backend/                 # Express + TypeScript
    │   └── src/
    │       ├── server.ts        # Port 3002
    │       ├── agent/
    │       │   ├── loop.ts      # Anthropic + OpenAI agent loops
    │       │   ├── tools.ts     # Tool definitions + Playwright executors
    │       │   └── prompt.ts   # Loads agent_system.md, injects {{SPEC}} + {{URL}}
    │       └── routes/
    │           └── run.ts      # POST /api/run + GET /api/run/:id/stream (SSE)
    └── frontend/               # React 18 + Vite
        └── src/
            ├── App.tsx
            └── components/
                ├── GoalPanel.tsx   # Spec input + URL + provider config
                └── AgentFeed.tsx  # Live event feed + verdict card
```

---

## Agent Tools

The agent autonomously decides which tools to call and in what order:

| Tool | Description |
|------|-------------|
| `navigate(url)` | Open URL in browser |
| `get_dom()` | Extract page structure — all selectors come from here |
| `click(selector, description)` | Click a button or link |
| `fill(selector, value, description)` | Enter text in an input |
| `wait_for(selector, timeout)` | Wait for an element to appear |
| `get_text(selector?)` | Read page or element text |
| `assert_text_present(text, description)` | Verify text is visible — returns PASS/FAIL |
| `assert_element_exists(selector, description)` | Verify element exists — returns PASS/FAIL |
| `assert_url_contains(pattern, description)` | Verify URL after navigation |
| `complete(verdict, summary, findings)` | End the run, return the verdict |

**Rule:** The agent always calls `get_dom` first. Every selector it uses for click/fill/assert must come from the DOM output — never invented.

---

## Live Feed

While the agent runs, the UI shows a real-time stream:

| Event | Icon | What it means |
|-------|------|--------------|
| Thought | 🧠 | Agent reasoning — what it's planning to do |
| Action | ⚡ | Tool being called with parameters |
| Observation | 👁 | Tool result — what was found on the page |
| Adapt | 🔄 | Tool returned FAIL — agent changing approach |
| Error | ❌ | Tool threw an error — agent will retry or move on |
| Complete | 🏁 | Run finished — verdict available |

---

## RICEPOT Prompt Design

The agent's behaviour is entirely defined by `prompts/agent_system.md` — a single RICEPOT-structured prompt loaded at runtime:

| Section | Role in agent behaviour |
|---------|------------------------|
| **R**ole | Senior autonomous QA engineer — independent, never asks for help |
| **I**nstructions | Think→Act→Observe→Adapt cycle; no human input; selector-from-DOM rule; retry once on failure |
| **C**ontext | `{{SPEC}}` and `{{URL}}` replaced at runtime |
| **E**xample | Full annotated agent run trace for pattern-matching |
| **P**arameters | 30 iteration limit; 1 retry per failure; finding status values |
| **O**utput | `complete` tool schema — verdict, summary, findings array |
| **T**one | Methodical, precise, relentlessly thorough |

**Changing agent behaviour requires only editing `prompts/agent_system.md` — no code changes.**

---

## Writing a Good Spec

The agent works best with goal-oriented specs, not step-by-step instructions:

**Good** (goal-oriented — agent figures out the HOW):
```markdown
# Feature: Login Page

## Scenarios
1. Page loads with all UI elements visible
2. Empty field submission shows an error
3. Invalid credentials show an error message
4. "Forgot password" link navigates correctly

## Acceptance criteria
- Error messages are clear and specific
- All links are functional
```

**Less good** (too prescriptive — defeats the purpose):
```markdown
1. Click on input[name="username"]
2. Type "test@example.com"
3. Click button[type="submit"]
```

The existing `specs/vwo-login-test-plan.md` contains a detailed scenario list — the agent reads it and decides which scenarios to execute first, how to find the elements, and what to assert.

---

## Running the App

### Prerequisites
- Node.js 18+
- Install Playwright browsers: `cd app/backend && npx playwright install chromium`

### Backend (port 3002)
```bash
cd app/backend
npm install
npm start
# or: npm run dev  (nodemon watch mode)
```

### Frontend (port 5174)
```bash
cd app/frontend
npm install
npm run dev
```

Open `http://localhost:5174`

---

## Supported LLM Providers

| Provider | Recommended model | Notes |
|----------|------------------|-------|
| **Anthropic Claude** | `claude-sonnet-4-6` | **Best for agents** — native tool use |
| OpenAI | `gpt-4o` | Function calling |
| Google Gemini | `gemini-1.5-flash` | OpenAI-compatible endpoint |
| Groq | `llama-3.3-70b-versatile` | Fast inference, OpenAI-compatible |

Anthropic Claude is the recommended provider — its tool use implementation is the most reliable for multi-turn agentic loops.

---

## Reports

Each completed run is saved as a JSON file in `reports/<runId>.json`:

```json
{
  "runId": "...",
  "url": "https://app.vwo.com",
  "verdict": "PARTIAL",
  "summary": "Tested 5 scenarios...",
  "findings": [
    { "scenario": "Empty field validation", "status": "PASS", "observation": "Error message visible" },
    { "scenario": "Invalid credentials", "status": "FAIL", "observation": "No error message found" }
  ],
  "duration": 45200,
  "iterations": 18
}
```

---

## Relationship to Other Projects

| Project | What it does | Agent involvement |
|---------|-------------|-------------------|
| Project_02_Playwright_MCP_Project | Generate + execute test cases via UI | Human drives every step |
| **Project_04_AI_Agent** | **Autonomous spec-to-verdict in one run** | **Fully autonomous** |
| Project_05_Test_Orchestrator | Orchestrates multiple agents/tests | Coordinates agents |

This is the project where AI stopped being "a smarter autocomplete" and became a junior QA engineer that never sleeps and never gets bored.
