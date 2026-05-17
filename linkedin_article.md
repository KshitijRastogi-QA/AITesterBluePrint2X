I Spent Months Building AI Systems for QA. Here's Everything I Learned.

A brutally honest, occasionally chaotic, deeply technical account of going from "I wonder if AI can help with testing" to building full autonomous QA pipelines — one project at a time.


First, an honest confession.

I didn't start this with a grand plan.

I started with a problem most QA engineers know intimately: test case writing is tedious, repetitive, and somehow always urgent.

A product manager drops a 400-line JIRA story on your desk at 4pm on a Thursday. Stakeholders want test coverage by Friday morning. Your coffee is cold. Your patience is thinner.

What if an AI could just... handle the boring parts?

That question sent me down a rabbit hole that is still going.

So far: 8 working projects, a broken environment more times than I can count, and a fundamentally changed perspective on what QA engineering actually is.

This is that journey — mid-flight, unfiltered, and nowhere near done.


The Project: AITestNexus

I called it AITestNexus — the nexus where QA engineering meets AI agents, MCP servers, RAG pipelines, and automation tools. One central hub. Everything connected.

One project per AI engineering concept. Keep it real. Keep it runnable. Don't skip the hard parts.

No vibe-coded throwaway demos. Actually working systems.

Here's what that looked like across 8 projects.


Project 01 — Local LLM Test Case Generator
"Wait, I can run this on my laptop?"

The first project had one rule: no cloud, no API keys, no data leaving the machine.

This matters more than people realise. In regulated industries — banking, healthcare, legal — you simply cannot paste your internal requirements into ChatGPT. The data governance team will find you. They always find you.

So: local LLMs. Running entirely on-device.

The result was a test case generator that takes a feature description and produces structured, traceable test cases — completely offline.

The tricky part nobody tells you about: local LLMs hallucinate differently than cloud models. They're more confident about wrong things. So the real engineering challenge wasn't the LLM — it was building anti-hallucination guardrails into the output pipeline.

Validation layers. Output structure enforcement. Confidence checks.

The lesson: AI output is only as good as the guardrails you build around it.


Project 02 — Prompt Engineering for QA
"It's not just asking nicely. It's architecture."

Everyone says "just prompt engineer it better" like it's a magic spell.

It isn't. It's a discipline.

This project was about getting serious with prompting for QA-specific tasks — test plan generation, test case creation, edge case discovery.

I built around the RICE POT framework:

• Role — tell the model exactly who it is
• Instructions — be surgical, not vague
• Context — more background = better output
• Examples — show, don't just tell
• Persona — consistent voice and expertise level
• Output format — structure it or prepare for chaos
• Tone — enterprise QA has a specific register

The outputs went from "here are some test ideas" to "here is a structured, traceable, priority-ordered test plan covering functional, negative, boundary, and accessibility scenarios."

The difference between those two outputs isn't the model. It's the engineering behind the prompt.


Project 02 — Playwright + MCP
"What if the AI could just run the tests itself?"

This is where things got genuinely exciting.

MCP — Model Context Protocol — is Anthropic's open standard for connecting AI models to external tools. Think of it as a universal adapter. Your test runner, your browser, your JIRA instance — all as callable tools that the AI can invoke, inspect the result, and decide what to do next.

The Playwright MCP project wired an AI agent directly to a browser. Give it a test template. Give it a URL. Watch it:

• Figure out the page structure
• Write selectors on the fly
• Execute the test steps
• Report back

No pre-written test code. No hardcoded selectors. The agent reasons its way through it.

That's not automation. That's autonomous testing.


Project 03 — AI Job Assistant
"I automated my own job search. No regrets."

Okay, this one is a detour from QA — but it's the project that taught me the most about full-stack AI integration, so it earns its place.

The problem: job hunting is a full-time job in itself. Scraping listings, tailoring resumes, tracking 50 applications across different stages — exhausting and deeply mechanical.

So I built a three-part system:

Part 1 — LinkedIn Job Scraper
Automated scraping of job postings with keyword filters. Extracts title, company, description, salary, Easy Apply flag — everything. Saves to timestamped CSVs.

Part 2 — AI Resume Tailor
Takes your base resume + a job description. Outputs a tailored resume and cover letter, optimised for that specific role. Two documents per application. Zero manual rewriting.

Part 3 — Kanban Application Tracker
Drag-and-drop pipeline — Wishlist → Applied → Follow-up → Interview → Offer → Rejected. Auto-detects whether tailored documents exist. One-click download. Dark-themed glassmorphism UI. Because if you're spending time on this, it should look good.

The lesson wasn't technical. It was philosophical: any repetitive, structured, knowledge-based human task is a candidate for AI augmentation. QA has a lot of those tasks. A lot.


Project 04 — AI Agent Framework
"Give it a spec. Go make coffee. Come back to results."

Building on the Playwright MCP work, this project formalised the AI agent pattern for QA.

An agent isn't just a chatbot. It's a system that:

1. Receives a goal (not a task — a goal)
2. Breaks it into steps autonomously
3. Executes those steps using available tools
4. Observes the results
5. Adapts its plan based on what it finds
6. Repeats until the goal is achieved

For QA, the goal is: "verify that this feature works correctly."

The agent reads the spec, plans the test approach, chooses which tools to call, executes, and reports. No human writes a single line of test code. The agent figures it out.

This is the project where I stopped thinking of AI as "a smarter autocomplete" and started thinking of it as a junior QA engineer that never sleeps and never gets bored.


Project 05 — Test Orchestrator
"One JIRA story ID. Everything else is automated."

This is the flagship. The one I'm most proud of. The one that took the longest.

The Test Orchestrator is an end-to-end AI pipeline that takes a single input — a JIRA Story ID — and produces everything a QA cycle needs:

• JIRA Story extracted (with Confluence PRD context)
• Enterprise test plan generated
• Exhaustive, traceable test cases created
• Browser execution via Playwright AI Agent
• Live dashboard — pass rate, trends, AI insights
• JIRA bugs auto-filed for every failure, with screenshots

Every stage feeds the next. Every output is structured and versioned.

The dashboard shows pass rate trends, flaky test detection, module-level failure analysis, and AI-generated insights like: "Authentication module failed in 3 of last 5 runs — recommend prioritising before next release."

This is what QA looks like when you stop asking AI for suggestions and start asking it to own the pipeline.


Project 06 — RAG System for QA
"What if you could ask your test history a question?"

RAG — Retrieval-Augmented Generation — is the technology behind "ask your documents" apps. But most tutorials show you how to chat with a PDF. Boring.

I applied it to QA knowledge:

• Historical test cases (thousands of them)
• Past bug reports
• Test plan archives
• Execution history

Now instead of "let me search Confluence for 20 minutes," you ask: "Have we ever tested the password reset flow on mobile Safari?"

The system retrieves the relevant historical context, augments the LLM's prompt with it, and gives you a grounded, specific answer.

Technical stack: vector database (ChromaDB / Qdrant), embedding models, retrieval pipeline, FastAPI backend, React frontend.

The practical impact: institutional QA knowledge becomes searchable, queryable, and alive. New team members get up to speed in hours instead of weeks.


Project 07 — QA Copilot
"Not a replacement. A co-pilot."

The name is deliberate. This isn't about replacing QA engineers. It's about giving them a co-pilot that's always context-aware.

The QA Copilot sits alongside your workflow:

• Reads your codebase
• Understands your test framework
• Knows your existing test coverage
• Suggests what to test next
• Flags what looks risky based on recent changes

It's the difference between asking a generic chatbot "write me a test" and having a system that says "you just changed the authentication middleware — here are the 6 test scenarios most at risk, ranked by historical failure rate."

Context is everything. And this project is about making context automatic.


Project 08 — FastMCP Server + MCP Inspector
"Finally. The one that broke everything first."

And here we arrive at the most recent project — and the one with the steepest learning curve. Not because the concepts are hard, but because the tooling is new, the errors are cryptic, and the documentation assumes you already know things you definitely don't.

Let me walk you through it honestly.


What is MCP, Actually?

Model Context Protocol (MCP) is an open standard — think of it as the USB-C of AI.

Before MCP: every AI tool integration was bespoke. Anthropic looked different from OpenAI looked different from your custom tool.

After MCP: one protocol. Any AI model that supports MCP can call any MCP server. Your tools become model-agnostic.

An MCP server exposes three things:

• Tools — functions the AI can call (click a button, read a file, query a database)
• Resources — data the AI can read (configs, schemas, knowledge bases)
• Prompts — reusable prompt templates with parameters

Build it once. Wire it to any LLM that speaks MCP.


What is FastMCP?

FastMCP is the Python library that makes building MCP servers feel like writing Flask routes. No boilerplate. No protocol-level plumbing. Just decorators.

Here's an actual snippet from the project:

from fastmcp import FastMCP

mcp = FastMCP("playwright-qa-mcp")

@mcp.tool()
def browser_to_url(url: str) -> str:
    print(f"Navigating to {url}")
    return "Ok started"

@mcp.resource("resource://qa/test-suite-config")
def get_config() -> str:
    return json.dumps({"browsers": ["chromium", "firefox"], "timeout": 30000})

@mcp.prompt()
def generate_login_test(url: str) -> str:
    return f"Write a Playwright test for the login flow at {url}..."

That's it. That's your MCP server.

For this project I built 24 Playwright-style tools, 3 QA resources, and 5 QA prompt templates — all running on SSE transport.


What is MCP Inspector?

MCP Inspector is a browser-based developer tool for exploring and testing MCP servers.

Think of it as Postman, but for AI tools.

Connect it to an MCP server and it shows you every tool the server exposes, every resource available, every prompt template — with a live interface to execute them and see the raw response.

Before MCP Inspector, the only way to test your MCP server was to wire it to an LLM and hope the agent called your tool correctly. That's like testing a REST API by only using it through a chatbot.

Inspector gives you direct access. Click a tool. Fill in the parameters. Execute. See the response.


The Errors. Oh, the Errors.

Here's where it gets real. Because nothing worked first time. And every error taught me something.


Error 1 — The file name that broke everything

I named my server file mcp.py. Perfectly logical name. Python disagreed.

When FastMCP tries to import mcp.types from the MCP SDK package, Python finds my mcp.py first — shadows the entire package — and explodes with a ModuleNotFoundError.

Fix: Rename the file to server.py. Done.
Lesson: Check your file names against Python's installed packages. It will silently pick yours every time.


Error 2 — The CORS 405

I had the server running. I had Inspector open. I typed in the SSE URL. I clicked Connect. Nothing.

The server logs told the story: OPTIONS /sse 405 Method Not Allowed, repeated endlessly.

The Inspector is a browser app at localhost:6274. The FastMCP server is at 127.0.0.1:8000. Different origins. Browser sends a CORS preflight OPTIONS request first. FastMCP's SSE endpoint doesn't handle OPTIONS. Returns 405. Browser gives up.

Fix: Add Starlette CORSMiddleware via http_app() — OPTIONS now returns 200.
Lesson: Browser-based dev tools always have CORS implications. SSE servers need to explicitly handle preflight requests.


Error 3 — The OAuth 404 That Wasn't OAuth

I tried connecting the Selenium MCP — a Node.js stdio server. Got this:

ServerError: HTTP 404: Invalid OAuth error response: SyntaxError: JSON Parse error: Unrecognized token '<'. Raw body: Cannot POST /register

That error looks terrifying. It's actually simple.

MCP Inspector 0.21+ sends a POST /register request before every connection to check for auth. A stdio server has no HTTP layer — it communicates over stdin/stdout. So the request goes nowhere, a generic HTML 404 page comes back, Inspector tries to parse it as JSON, fails, and produces the world's most confusing error message.

Fix: DANGEROUSLY_OMIT_AUTH=true npx mcp-inspector
Lesson: When an error mentions OAuth but you're not using OAuth, the auth layer itself is probably the problem.


Error 4 — "Command not found, transports removed"

In Inspector, I typed: Command = node, Arguments = node_modules/@angiejones/mcp-selenium/src/lib/server.js

Inspector said: Command not found, transports removed.

The Inspector proxy spawns the subprocess from its own working directory — not yours. Relative paths don't resolve. Bare node doesn't resolve if it's not in the proxy's PATH.

Fix: Absolute paths for everything.
Lesson: Treat Inspector's proxy like a cron job — assume nothing about the environment.


When It Finally Works

Once you get past the setup, MCP Inspector is genuinely delightful.

A sidebar shows every tool your server exposes. Click one — a form appears with the parameter schema, types, and descriptions. Fill in the values. Hit Execute. Raw JSON response renders instantly.

No LLM needed. No "please call this tool" prompting. Direct. Immediate.

Two completely different servers — FastMCP Python and Selenium Node.js. Two different transports — SSE and stdio. One Inspector. Swap connections in seconds.

That's the power of a standard protocol.


Practical Applications — Where This Actually Ships

Enough theory. Here's where each piece lands in a real QA or AI engineering role.

MCP as Your QA Tool Layer
Expose your Selenium suite, JIRA client, and test database as MCP tools. Now any LLM — Claude, GPT, Gemini — can call them natively. You've turned your test infrastructure into a model-agnostic API. No custom integration per model. One server. Works everywhere.

Autonomous Sprint QA
Story created Monday. By Tuesday morning: JIRA extracted, test plan generated, 40+ test cases created, automation run against staging, JIRA bugs filed with screenshots, dashboard updated. Your QA engineer wakes up to results, not tasks.

Living QA Knowledge Base
Query thousands of historical test cases, bug reports, and execution logs in plain English. "What mobile Safari edge cases have we hit before?" — grounded, specific answer in seconds. New team members learn from institutional knowledge in hours, not weeks.

Privacy-First AI Testing
Local LLMs mean your requirements never touch an external API. GDPR-compliant AI test generation for fintech, healthcare, or any regulated product.

MCP Inspector as the QA Debugger
Before you wire a tool to an agent, test it in Inspector. Before you debug "why did the agent call the wrong tool," inspect the schema in Inspector. It's Postman for the AI era. Every AI engineer building tools needs it in their workflow.


The Honest Verdict (So Far)

Eight projects in. Hundreds of hours logged. Environments broken and rebuilt. And still going.

AI won't replace QA engineers. Not the good ones.

But it will replace the parts of the job that are mechanical, repetitive, and structural. Test case generation from specs. Boilerplate test code. Basic regression execution. Bug report formatting.

What it won't replace:

• Knowing which edge cases matter for your users
• Deciding what's worth testing and what's risk-acceptable to skip
• Reading between the lines of a vague requirement
• Saying "this passes technically but feels wrong" in a UX test

The QA engineers who will thrive are the ones who can do both: deep human judgement + AI-augmented execution.

I'm still figuring out that balance. Every project shifts it a little. Some things I was confident about in Project 01 look naive by Project 08. That's not a problem — that's the point.

Building these systems — not just using them — is how you develop that dual capability. You understand the tools better when you build them. You trust the output more when you know the guardrails you put in. You debug faster when you know what the agent is actually doing.

That's why AITestNexus exists. To learn by building. And the learning hasn't stopped.


What's Next — And There's a Lot

The blueprint is very much still in progress. These 8 projects are chapters, not a conclusion.

Still actively building:

• Real Playwright execution in the FastMCP server — browser_to_url should actually navigate a browser. That's the immediate next step.

• Multi-agent QA systems — one agent that plans, one that executes, one that validates. Agents talking to agents. Coordination protocols. Failure handling between them. New territory. That's exciting.

• MCP server for CI/CD — trigger pipelines, read build logs, parse test coverage reports, surface flaky tests — all via MCP tools. Your LLM becomes your CI dashboard.

• Fine-tuned local models for QA — domain-specific models that speak test plan, understand JIRA semantics, and don't hallucinate test steps for features that don't exist.

• LangFlow pipelines — visual AI workflow builder for QA orchestration. Already scaffolded. Still learning the edges.

The uncomfortable truth about this kind of learning: the roadmap gets longer the more you build. Each project reveals three new questions you didn't know to ask before you started.

Project 08 answering "how do I expose QA tools to an LLM via MCP?" immediately raised "how do I make those tools do something real?" Which raises "how do I manage browser state across tool calls?" Which raises "how do I handle failures mid-session?"

That's not scope creep. That's depth.

There's no bottom to this rabbit hole. Which means there's always something new to build next weekend.


Still learning. Still building. Updates as they happen.

If you're on a similar journey — or just starting to think about AI for QA — I'd love to compare notes. Drop a comment below with which project you'd want a deeper write-up on. Or connect — always happy to nerd out about AI, testing, and the intersection of both.

Everything is open. All 8 projects. All the specs, prompts, and pipelines. Work in progress — just like the learning.


#AIEngineering #QAAutomation #MCP #ModelContextProtocol #FastMCP #PlaywrightTesting #SeleniumMCP #AIAgents #RAG #LocalLLM #TestAutomation #PromptEngineering #SoftwareTesting #AITesting #LangFlow #OpenSource #LLM #AITestNexus #TechBlog #BuildInPublic
