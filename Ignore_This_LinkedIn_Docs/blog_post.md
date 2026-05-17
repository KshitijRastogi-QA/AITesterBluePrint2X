# I Spent Months Building AI Systems for QA. Here's Everything I Learned.

*A brutally honest, occasionally chaotic, deeply technical account of going from
"I wonder if AI can help with testing" to building full autonomous QA pipelines —
one project at a time.*

---

## First, an honest confession.

I didn't start this with a grand plan.

I started with a problem most QA engineers know intimately:
**test case writing is tedious, repetitive, and somehow always urgent.**

A product manager drops a 400-line JIRA story on your desk at 4pm on a Thursday.
Stakeholders want test coverage by Friday morning.
Your coffee is cold. Your patience is thinner.

What if an AI could just... handle the boring parts?

That question sent me down a rabbit hole that is still going.

So far: 8 working projects, a broken environment more times than I can count,
and a fundamentally changed perspective on what QA engineering actually is.

This blog is that journey — mid-flight, unfiltered, and nowhere near done.

---

## The Blueprint

I called it **AITestNexus** — the nexus where QA engineering meets AI agents, automation tools, and everything in between.

The idea was simple: build one project per AI engineering concept,
keep it real, keep it runnable, and don't skip the hard parts.

No vibe-coded throw-away demos. Actually working systems.

Here's what that looked like across 8 projects.

---

## Project 01 — Local LLM Test Case Generator
### *"Wait, I can run this on my laptop?"*

The first project had one rule: **no cloud, no API keys, no data leaving the machine.**

This matters more than people realise. In regulated industries — banking, healthcare, legal —
you simply cannot paste your internal requirements into ChatGPT.
The data governance team will find you. They always find you.

So: local LLMs. Running entirely on-device.

The result was a test case generator that takes a feature description
and produces structured, traceable test cases — completely offline.

**The tricky part nobody tells you about:** local LLMs hallucinate differently than cloud models.
They're more confident about wrong things. So the real engineering challenge wasn't the LLM —
it was building **anti-hallucination guardrails** into the output pipeline.

Validation layers. Output structure enforcement. Confidence checks.

The lesson: *AI output is only as good as the guardrails you build around it.*

---

## Project 02 — Prompt Engineering for QA
### *"It's not just asking nicely. It's architecture."*

Everyone says "just prompt engineer it better" like it's a magic spell.

It isn't. It's a discipline.

This project was about getting serious with prompting for QA-specific tasks —
test plan generation, test case creation, edge case discovery.

I built around the **RICE POT framework**:
- **R**ole — tell the model exactly who it is
- **I**nstructions — be surgical, not vague
- **C**ontext — more background = better output
- **E**xamples — show, don't just tell
- **P**ersona — consistent voice and expertise level
- **O**utput format — structure it or prepare for chaos
- **T**one — enterprise QA has a specific register

The outputs went from "here are some test ideas" to
"here is a structured, traceable, priority-ordered test plan
covering functional, negative, boundary, and accessibility scenarios."

The difference between those two outputs isn't the model.
It's the engineering behind the prompt.

---

## Project 02 (also) — Playwright + MCP Project
### *"What if the AI could just run the tests itself?"*

This is where things got genuinely exciting.

MCP — **Model Context Protocol** — is Anthropic's open standard for
connecting AI models to external tools. Think of it as a universal adapter.
Your test runner, your browser, your JIRA instance — all as callable tools
that the AI can invoke, inspect the result, and decide what to do next.

The Playwright MCP project wired an AI agent directly to a browser.
Give it a test template. Give it a URL. Watch it:
- Figure out the page structure
- Write selectors on the fly
- Execute the test steps
- Report back

No pre-written test code. No hardcoded selectors. The agent reasons its way through it.

That's not automation. That's **autonomous testing**.

---

## Project 03 — AI Job Assistant
### *"I automated my own job search. No regrets."*

Okay, this one is a detour from QA — but it's the project that taught me
the most about **full-stack AI integration**, so it earns its place.

The problem: job hunting is a full-time job in itself.
Scraping listings, tailoring resumes, tracking 50 applications across different stages —
it's exhausting and deeply mechanical.

So I built a three-part system:

**Part 1: LinkedIn Job Scraper**
Automated scraping of job postings with keyword filters.
Extracts title, company, description, salary, Easy Apply flag — everything.
Saves to timestamped CSVs.

**Part 2: AI Resume Tailor**
Takes your base resume + a job description.
Outputs a tailored resume and cover letter, optimised for that specific role.
Two documents per application. Zero manual rewriting.

**Part 3: Kanban Application Tracker**
A drag-and-drop pipeline — Wishlist → Applied → Follow-up → Interview → Offer → Rejected.
Auto-detects whether tailored documents exist. One-click download.
Dark-themed. Glassmorphism UI. Because if you're spending time on this, it should look good.

The lesson here wasn't technical. It was philosophical:
*Any repetitive, structured, knowledge-based human task is a candidate for AI augmentation.*
QA has a lot of those tasks. A lot.

---

## Project 04 — AI Agent Framework
### *"Give it a spec. Go make coffee. Come back to results."*

Building on the Playwright MCP work, this project formalized the **AI agent pattern for QA**.

An agent isn't just a chatbot. It's a system that:
1. Receives a goal (not a task — a *goal*)
2. Breaks it into steps autonomously
3. Executes those steps using available tools
4. Observes the results
5. Adapts its plan based on what it finds
6. Repeats until the goal is achieved

For QA, the goal is: *"verify that this feature works correctly."*

The agent reads the spec, plans the test approach, chooses which tools to call
(browser navigation, form interaction, assertions), executes, and reports.

No human writes a single line of test code. The agent figures it out.

This is the project where I stopped thinking of AI as "a smarter autocomplete"
and started thinking of it as **a junior QA engineer that never sleeps and never gets bored.**

---

## Project 05 — Test Orchestrator
### *"One JIRA story ID. Everything else is automated."*

This is the flagship. The one I'm most proud of. The one that took the longest.

The Test Orchestrator is an end-to-end AI pipeline that takes a single input —
a JIRA Story ID — and produces everything a QA cycle needs:

```
📥 JIRA Story ID
      ↓
📋 Extracted Story (with Confluence PRD context)
      ↓
📄 Test Plan (following enterprise template)
      ↓
🧪 Test Cases (exhaustive, traceable, prioritised)
      ↓
🤖 Browser Execution (Playwright AI Agent, live)
      ↓
📊 Live Dashboard (pass rate, trends, AI insights)
      ↓
🐛 JIRA Bugs (auto-filed for every failure, with screenshots)
```

Every stage feeds the next. Every output is structured and versioned.
Failed test cases automatically generate JIRA bugs with screenshots attached.

The dashboard shows pass rate trends, flaky test detection, module-level failure analysis,
and AI-generated insights like:
*"Authentication module failed in 3 of last 5 runs — recommend prioritising before next release."*

This is what QA looks like when you stop asking AI for suggestions
and start asking it to **own the pipeline.**

---

## Project 06 — RAG System for QA
### *"What if you could ask your test history a question?"*

RAG — **Retrieval-Augmented Generation** — is the technology behind
"ask your documents" applications. But most tutorials show you how to
chat with a PDF. Boring.

I applied it to QA knowledge:

- Historical test cases (thousands of them)
- Past bug reports
- Test plan archives
- Execution history

Now instead of "let me search Confluence for 20 minutes,"
you ask: *"Have we ever tested the password reset flow on mobile Safari?"*

The system retrieves the relevant historical context,
augments the LLM's prompt with it, and gives you a grounded, specific answer.

The technical stack: vector database (ChromaDB / Qdrant), embedding models,
retrieval pipeline, and a FastAPI backend with a React frontend.

The practical impact: institutional QA knowledge becomes **searchable, queryable, and alive.**
New team members get up to speed in hours instead of weeks.

---

## Project 07 — QA Copilot
### *"Not a replacement. A co-pilot."*

The name is deliberate. This isn't about replacing QA engineers.
It's about giving them a co-pilot that's always context-aware.

The QA Copilot sits alongside your workflow:
- Reads your codebase
- Understands your test framework
- Knows your existing test coverage
- Suggests what to test next
- Flags what looks risky based on recent changes

It's the difference between asking a generic chatbot "write me a test"
and having a system that says "you just changed the authentication middleware —
here are the 6 test scenarios that are most at risk, ranked by historical failure rate."

Context is everything. And this project is about **making context automatic.**

---

## Project 08 — FastMCP Server + MCP Inspector
### *"Finally. The one that broke everything first."*

And here we arrive at the most recent project — and the one with the steepest learning curve
not because the concepts are hard, but because the tooling is new, the errors are cryptic,
and the documentation assumes you already know things you definitely don't.

Let me walk you through it honestly.

---

### What is MCP, Actually?

**Model Context Protocol (MCP)** is an open standard — think of it as the USB-C of AI.

Before MCP: every AI tool integration was bespoke.
Anthropic integration looked different from OpenAI integration looked different from your custom tool.

After MCP: one protocol. Any AI model that supports MCP can call any MCP server.
Your tools become model-agnostic.

An MCP server exposes three things:
- **Tools** — functions the AI can call (click a button, read a file, query a database)
- **Resources** — data the AI can read (configs, schemas, knowledge bases)
- **Prompts** — reusable prompt templates with parameters

Build it once. Wire it to any LLM that speaks MCP.

---

### What is FastMCP?

**FastMCP** is the Python library that makes building MCP servers feel like writing Flask routes.

No boilerplate. No protocol-level plumbing. Just decorators:

```python
from fastmcp import FastMCP

mcp = FastMCP("playwright-qa-mcp")

@mcp.tool()
def browser_to_url(url: str) -> str:
    """Navigate the browser to a URL."""
    print(f"Navigating to {url}")
    return "Ok started"

@mcp.resource("resource://qa/test-suite-config")
def get_config() -> str:
    """Return the QA test suite configuration."""
    return json.dumps({"browsers": ["chromium", "firefox"], "timeout": 30000})

@mcp.prompt()
def generate_login_test(url: str) -> str:
    """Generate a Playwright test for the login flow."""
    return f"Write a Playwright test for the login flow at {url}..."
```

That's it. That's your MCP server.

For this project I built:
- **24 Playwright-style tools** (dummy stubs — they print and return "Ok started")
- **3 QA resources** (test suite config, browser environments, test run history)
- **5 QA prompt templates** (generate login test, create bug report, suggest locator, write POM, review script)

Running on SSE transport at `http://127.0.0.1:8000/sse`.

---

### What is MCP Inspector?

**MCP Inspector** is a browser-based developer tool for exploring and testing MCP servers.

Think of it as **Postman, but for AI tools.**

You connect it to an MCP server, and it shows you:
- Every tool the server exposes (with parameter schemas)
- Every resource available
- Every prompt template
- A live interface to execute tools and see the raw response

Before MCP Inspector, the only way to test your MCP server was to wire it to an LLM
and hope the agent called your tool correctly. That's like testing a REST API
by only using it through a chatbot interface.

Inspector gives you direct access. Click a tool. Fill in the parameters. Execute. See the response.

---

### The Errors. Oh, the Errors.

Here's where the blog gets real. Because nothing worked first time.
And every error taught me something.

---

**Error 1: The file name that broke everything**

```
ModuleNotFoundError: No module named 'mcp.types'; 'mcp' is not a package
```

I named my server file `mcp.py`. Perfectly logical name.

Python disagreed.

When FastMCP tries to import `mcp.types` (from the MCP SDK package),
Python finds *my* `mcp.py` first — shadows the entire package — and explodes.

**Fix:** Rename the file. `server.py`. Done.

Lesson: *Check your file names against Python's installed packages.
It will silently pick yours every time.*

---

**Error 2: The CORS 405**

I had the server running. I had Inspector open. I typed in the SSE URL.
I clicked Connect. Nothing.

The server logs told the story:

```
OPTIONS /sse HTTP/1.1" 405 Method Not Allowed
OPTIONS /sse HTTP/1.1" 405 Method Not Allowed
OPTIONS /sse HTTP/1.1" 405 Method Not Allowed
```

The MCP Inspector is a browser app at `localhost:6274`.
The FastMCP server is at `127.0.0.1:8000`.
Different origins. Browser sends a CORS preflight `OPTIONS` request first.
FastMCP's SSE endpoint doesn't handle `OPTIONS`. Returns 405. Browser gives up.

**Fix:** Starlette `CORSMiddleware` via `http_app()`:

```python
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import uvicorn

app = mcp.http_app(
    transport="sse",
    middleware=[
        Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    ]
)
uvicorn.run(app, host="127.0.0.1", port=8000)
```

OPTIONS now returns 200. Connection established.

Lesson: *Browser-based dev tools always have CORS implications.
SSE servers need to explicitly handle preflight requests.*

---

**Error 3: The OAuth 404 That Wasn't OAuth**

I then tried to connect the **Selenium MCP** — a Node.js stdio server.

```
ServerError: HTTP 404: Invalid OAuth error response:
SyntaxError: JSON Parse error: Unrecognized token '<'.
Raw body: <!DOCTYPE html><html>...Cannot POST /register
```

That error looks scary. It's actually simple once you understand what's happening.

MCP Inspector 0.21+ added an OAuth registration flow.
Before connecting to *any* server, Inspector sends a `POST /register` request
to check if the server requires authentication.

A Python FastMCP SSE server? Fine — it has an HTTP layer that returns a proper 404 JSON.

A stdio server? It has no HTTP layer. It communicates over stdin/stdout.
So when Inspector tries to POST to it... the request goes nowhere... and somewhere a
generic HTML 404 error page gets returned... which Inspector tries to parse as JSON...
which fails... which produces the world's most confusing error message.

**Fix:** One environment variable.

```bash
DANGEROUSLY_OMIT_AUTH=true npx mcp-inspector
```

This disables the OAuth pre-flight entirely.

Yes, the name is alarming. No, it's not dangerous on localhost.
Yes, it should be the default for local development.

Lesson: *When an error mentions OAuth but you're not using OAuth,
the auth layer itself is probably the problem, not your server.*

---

**Error 4: "Command not found, transports removed"**

The Selenium MCP uses stdio transport.
In Inspector, you specify a Command and Arguments to launch it.

I typed: Command = `node`, Arguments = `node_modules/@angiejones/mcp-selenium/src/lib/server.js`

Inspector said: `Command not found, transports removed`

The Inspector proxy spawns the subprocess from **its own working directory** —
not the directory where you ran `npx mcp-inspector`.
Relative paths don't resolve. Bare `node` doesn't resolve if it's not in the proxy's PATH.

**Fix:** Absolute paths. Both of them.

```
Command:   /opt/homebrew/opt/node@22/bin/node
Arguments: /Users/you/Project_08_MCP_Basic/node_modules/@angiejones/mcp-selenium/src/lib/server.js
```

Lesson: *MCP Inspector's proxy is its own process. Treat it like a cron job —
absolute paths for everything, assume nothing about the environment.*

---

### What MCP Inspector Actually Feels Like (When It Works)

Once you get past the setup, MCP Inspector is genuinely delightful.

You're looking at:
- A sidebar with every tool your server exposes, neatly categorised
- Click a tool → a form appears with the parameter schema, types, and descriptions
- Fill in the values → hit Execute → raw JSON response renders instantly

No LLM needed. No "please call this tool" prompting. Direct. Immediate.

For the FastMCP server, I could click `browser_to_url`, type in a URL,
execute it, and see the response — `"Ok started"` — in under a second.
*(Yes, these are dummy tools. The point is the infrastructure, not the Playwright execution.)*

For the Selenium MCP, switching to stdio transport shows you the full
`@angiejones/mcp-selenium` toolkit — 18 real tools including `start_browser`,
`navigate`, `click_element`, `execute_script`, `handle_alert`, and more.
These would actually drive a browser if ChromeDriver is installed.

Two completely different servers. Two different transports (SSE and stdio).
One Inspector. Swap connections in seconds.

That's the power of a standard protocol.

---

## Practical Applications — Where This Actually Ships

Enough theory. Where does all of this land in a real QA or AI engineering role?

---

### 🔧 MCP as Your QA Tool Layer

Build an MCP server that wraps your existing test infrastructure:
- Expose your Selenium suite as MCP tools
- Expose your JIRA client as tools (create ticket, update status, attach file)
- Expose your test database as resources (current test coverage, last run results)

Now any LLM — Claude, GPT, Gemini — can call these tools natively.
You've turned your test infrastructure into an AI-callable API.
No custom integration per model. One server. Works everywhere.

---

### 🤖 Autonomous Sprint QA

Story is created on Monday.
By Tuesday morning the Test Orchestrator has:
- Read the JIRA story and linked Confluence PRD
- Generated an enterprise-grade test plan
- Created 40+ traceable test cases with priorities
- Executed automation-eligible cases against staging
- Filed JIRA bugs for failures with screenshots attached
- Updated the QA dashboard with pass rate and AI insights

Your QA engineer wakes up to results, not tasks.
They spend their day on exploratory testing, risk analysis, and the edge cases that AI missed.
That's a better use of human expertise than writing test case #38 for the login form.

---

### 📚 Living QA Knowledge Base (RAG)

Your past test cases, bug reports, and execution history are data.
Most organisations bury this data in Confluence pages nobody reads.

With a RAG pipeline, that data becomes **queryable**:
- "What mobile Safari edge cases have we hit before?"
- "Which test scenarios typically fail after checkout changes?"
- "What's the test coverage for the payment flow?"

Natural language in. Grounded, specific answers out.
New team members learn from institutional knowledge in hours.

---

### 🔒 Privacy-First AI Testing

Local LLMs mean your requirements never touch an external API.
For fintech, healthcare, or any GDPR-regulated product:
run the AI on your machine, generate the test cases, keep everything internal.

---

### 🧰 MCP Inspector as the QA Engineer's Debugger

Before you wire a tool to an agent, test it in Inspector.
Before you debug "why did the agent call the wrong tool," inspect the schema in Inspector.
Before you ship an MCP server, verify every tool, resource, and prompt in Inspector.

It's Postman for the AI era. Every AI engineer building tools needs it in their workflow.

---

## The Honest Verdict (So Far)

Eight projects in. Hundreds of hours logged. Environments broken and rebuilt.
And still going.

Here's what I actually think — at this point in the journey:

**AI won't replace QA engineers.** Not the good ones.

But it will replace the parts of the job that are mechanical, repetitive, and structural.
Test case generation from specs. Boilerplate test code. Basic regression execution.
Bug report formatting. Execution summaries.

What it won't replace:
- Knowing which edge cases matter for *your* users
- Deciding what's worth testing and what's risk-acceptable to skip
- Reading between the lines of a vague requirement
- Saying "this passes technically but feels wrong" in a UX test

The QA engineers who will thrive are the ones who can do both:
**deep human judgement + AI-augmented execution.**

I'm still figuring out that balance. Every project shifts it a little.
Some things I was confident about in Project 01 look naive by Project 08.
That's not a problem — that's the point.

Building these systems — not just using them — is how you develop that dual capability.

You understand the tools better when you build them.
You trust the output more when you know the guardrails you put in place.
You debug faster when you know what the agent is actually doing.

That's why AITestNexus exists.
To learn by building. And the learning hasn't stopped.

---

## What's Next — And There's a Lot

The blueprint is very much still in progress. These 8 projects are chapters, not a conclusion.

**Still actively building:**

- **Real Playwright execution** in the FastMCP server — the dummy tools become real ones.
  `browser_to_url` should actually navigate a browser. That's the next step for Project 08.

- **Multi-agent QA systems** — one agent that plans, one that executes, one that validates.
  Agents talking to agents. Coordination protocols. Failure handling between them.
  This is new territory and I don't know exactly what it'll look like yet. That's exciting.

- **MCP server for CI/CD** — trigger pipelines, read build logs, parse test coverage reports,
  surface flaky tests — all via MCP tools. Your LLM becomes your CI dashboard.

- **Fine-tuned local models for QA** — domain-specific models that speak test plan,
  understand JIRA semantics, and don't hallucinate test steps for features that don't exist.

- **LangFlow pipelines** — visual AI workflow builder for QA orchestration.
  Already scaffolded. Still learning the edges of what it can and can't do gracefully.

Every single one of these will break something unexpected on the way.
Every break will be worth writing about.

The uncomfortable truth about this kind of learning is that the roadmap
keeps getting longer the more you build — because each project reveals
three new questions you didn't know to ask before you started.

Project 08 answering "how do I expose QA tools to an LLM via MCP?"
immediately raised "how do I make those tools do something real?"
Which raises "how do I manage browser state across tool calls?"
Which raises "how do I handle failures mid-session?"

That's not scope creep. That's depth.

And honestly? That's the most energising part of this whole thing.
There's no bottom to this rabbit hole.
Which means there's always something new to build next weekend.

---

*Still learning. Still building. Updates as they happen.*

*If you're on a similar journey — or just starting to think about AI for QA —
I'd love to compare notes. Drop a comment, connect, or just steal these ideas
and build your own version.*

*Everything is open. All 8 projects. All the specs, prompts, and pipelines.*
*Work in progress — just like the learning.*

---

**Tags:** #AIEngineering #QAAutomation #MCP #ModelContextProtocol #FastMCP #SeleniumMCP
#PlaywrightTesting #AIAgents #RAG #LocalLLM #TestAutomation #PromptEngineering
#SoftwareTesting #AITesting #LangFlow #OpenSource #LLM #TechBlog
