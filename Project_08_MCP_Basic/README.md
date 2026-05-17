# Project 08 — FastMCP Playwright QA Server + Selenium MCP + Inspector

## What This Project Does

Two MCP servers connected to **MCP Inspector** for live exploration:

| Server | Type | Transport | Tools |
|---|---|---|---|
| **Playwright QA** (`server.py`) | FastMCP / Python | SSE over HTTP | 24 dummy tools + 3 resources + 5 prompts |
| **Selenium MCP** (`@angiejones/mcp-selenium`) | Node.js package | stdio | 18 real Selenium tools |

Built using the **VIBE coding style** — describe what you want, let FastMCP wire it up automatically.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  MCP Inspector (Browser)                     │
│                  http://localhost:6274                        │
│                                                              │
│   Connect A (SSE)              Connect B (stdio)             │
└──────┬─────────────────────────────────┬─────────────────────┘
       │ SSE                             │ stdio (subprocess)
       ▼                                 ▼
┌─────────────────────┐     ┌────────────────────────────┐
│  FastMCP Server     │     │  Selenium MCP Server       │
│  server.py          │     │  @angiejones/mcp-selenium  │
│  127.0.0.1:8000/sse │     │  (spawned by Inspector)    │
│                     │     │                            │
│  24 Dummy Tools     │     │  18 Selenium Tools         │
│  3 Resources        │     │  2 Resources               │
│  5 Prompts          │     │                            │
└─────────────────────┘     └────────────────────────────┘
```

---

## Server A — Dummy Playwright Tools (FastMCP)

### What "Dummy" Means

These tools are **intentional stubs** — they do NOT launch a real browser or execute Playwright.
Each tool only does two things:
1. `print()` the tool name + parameters to the server console
2. Return the string `"Ok started"`

This is by design — the purpose is to demonstrate MCP tool registration, Inspector connectivity,
and the FastMCP VIBE-coding pattern. To add real Playwright execution, replace the `print()`/`return`
body with actual `playwright` calls.

**Example response for any tool:**
```json
{
  "content": [{ "type": "text", "text": "Ok started" }],
  "isError": false
}
```

### 24 Dummy Playwright Tools

| # | Tool Name | Parameters | Description |
|---|-----------|-----------|-------------|
| 1 | `browser_to_url` | `url` | Navigate to a URL |
| 2 | `browser_click` | `selector` | Click an element by CSS/XPath selector |
| 3 | `browser_fill` | `selector`, `value` | Fill an input field |
| 4 | `browser_screenshot` | `path` | Take a page screenshot |
| 5 | `browser_get_text` | `selector` | Get text content of an element |
| 6 | `browser_hover` | `selector` | Hover over an element |
| 7 | `browser_double_click` | `selector` | Double-click an element |
| 8 | `browser_right_click` | `selector` | Right-click an element |
| 9 | `browser_scroll` | `direction`, `pixels` | Scroll the page up or down |
| 10 | `browser_wait_for_element` | `selector`, `timeout_ms` | Wait for an element to appear |
| 11 | `browser_press_key` | `key` | Press a keyboard key (e.g. `Enter`) |
| 12 | `browser_select_option` | `selector`, `option_value` | Select a dropdown option |
| 13 | `browser_check_checkbox` | `selector` | Check a checkbox |
| 14 | `browser_uncheck_checkbox` | `selector` | Uncheck a checkbox |
| 15 | `browser_upload_file` | `selector`, `file_path` | Upload a file to a file input |
| 16 | `browser_drag_and_drop` | `source_selector`, `target_selector` | Drag one element onto another |
| 17 | `browser_get_attribute` | `selector`, `attribute` | Get an element's attribute value |
| 18 | `browser_assert_visible` | `selector` | Assert an element is visible |
| 19 | `browser_assert_text` | `selector`, `expected_text` | Assert element contains text |
| 20 | `browser_close_tab` | — | Close the current tab |
| 21 | `browser_new_tab` | `url` | Open a new tab |
| 22 | `browser_go_back` | — | Navigate browser back |
| 23 | `browser_go_forward` | — | Navigate browser forward |
| 24 | `browser_refresh` | — | Refresh the current page |

### 3 Resources (QA / Testing themed)

| Resource URI | Returns | Description |
|---|---|---|
| `resource://qa/test-suite-config` | JSON | Base URL, browsers, timeout, retries, headless flag |
| `resource://qa/browser-environments` | JSON | Chromium / Firefox / WebKit versions and capabilities |
| `resource://qa/test-run-history` | Text | Last 5 dummy test run results with pass/fail status |

### 5 Prompts (QA / Playwright themed)

| Prompt | Parameters | Purpose |
|---|---|---|
| `generate_login_test` | `url`, `username_selector`, `password_selector` | Generate a full Playwright login test |
| `create_bug_report` | `title`, `steps_to_reproduce`, `expected`, `actual` | Create a structured bug report |
| `suggest_locator_strategy` | `element_description`, `page_url` | Recommend the best Playwright locator |
| `write_page_object` | `page_name`, `page_url` | Generate a Page Object Model class |
| `review_test_script` | `script` | Review a Playwright script for improvements |

---

## Server B — Selenium MCP (`@angiejones/mcp-selenium`)

### What This Server Does

A real Selenium MCP server — these tools **actually drive a browser** via WebDriver when executed.
It requires Chrome/Firefox + ChromeDriver/GeckoDriver to be installed for tool execution.
The Inspector will list all tools even without a browser running.

**Package:** `@angiejones/mcp-selenium` v0.2.3
**Transport:** stdio (Inspector spawns it as a subprocess)
**Downloads:** ~2,700/month (most popular Selenium MCP on npm)

### 18 Selenium Tools

| # | Tool Name | Description |
|---|-----------|-------------|
| 1 | `start_browser` | Launch Chrome or Firefox via WebDriver |
| 2 | `navigate` | Navigate to a URL |
| 3 | `find_element` | Find an element by selector strategy |
| 4 | `click_element` | Click an element |
| 5 | `send_keys` | Type into an element |
| 6 | `get_element_text` | Read text content of an element |
| 7 | `get_element_attribute` | Get an attribute value |
| 8 | `press_key` | Send a keyboard key press |
| 9 | `upload_file` | Upload a file via file input |
| 10 | `take_screenshot` | Capture a screenshot |
| 11 | `execute_script` | Run arbitrary JavaScript |
| 12 | `switch_window` | Switch between browser tabs/windows |
| 13 | `switch_frame` | Switch into an iframe |
| 14 | `handle_alert` | Accept/dismiss/read browser alerts |
| 15 | `add_cookie` | Add a cookie |
| 16 | `get_cookies` | Read all cookies |
| 17 | `delete_cookie` | Delete a specific cookie |
| 18 | `close_session` | Quit the browser session |

### 2 Resources

| Resource | Description |
|---|---|
| `accessibility://current` | Live accessibility tree of the current page |
| `browser://status` | Current browser session status |

---

## Project File Structure

```
Project_08_MCP_Basic/
├── server.py                ← FastMCP server (24 tools + 3 resources + 5 prompts)
├── pyproject.toml           ← uv project config (fastmcp dependency)
├── .python-version          ← Python version pin (3.11)
├── .venv/                   ← Virtual environment (Python 3.11, fastmcp 3.3.1)
├── package.json             ← npm scripts + both MCP packages
├── package-lock.json        ← npm lockfile
├── node_modules/
│   ├── @modelcontextprotocol/inspector/  ← MCP Inspector v0.21.2
│   └── @angiejones/mcp-selenium/         ← Selenium MCP v0.2.3
└── README.md                ← This file
```

---

## Steps to Run

> **Already done (one-time setup):** `.venv/` exists with `fastmcp 3.3.1`.
> `node_modules/` has both Inspector and Selenium MCP installed.

### Prerequisites (install once if missing)

- **Python 3.11+**, **Node.js 18+**, **npm**
- **uv** — `curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.zshrc`
- **First-time setup only:**
  ```bash
  cd Project_08_MCP_Basic
  uv venv --python 3.11 && uv pip install fastmcp
  npm install
  ```

---

### Step 1 — Start the FastMCP Server

Open **Terminal 1**:

```bash
cd Project_08_MCP_Basic
source .venv/bin/activate
python server.py
```

Expected output:
```
FastMCP 3.3.1  —  playwright-qa-mcp
Starting MCP server with transport 'sse' on http://127.0.0.1:8000/sse
Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Keep this terminal open.

---

### Step 2 — Launch MCP Inspector

Open **Terminal 2**:

```bash
cd Project_08_MCP_Basic
DANGEROUSLY_OMIT_AUTH=true npx mcp-inspector

# or via npm script (same thing):
npm run inspector
```

> **Why `DANGEROUSLY_OMIT_AUTH=true`?**
> MCP Inspector 0.21+ sends an OAuth `POST /register` request before every connection.
> stdio-based servers (Selenium MCP) have no HTTP server to handle it — they return a 404 HTML page,
> which causes "Invalid OAuth error response". This flag disables the auth flow entirely.

Inspector opens at: **http://localhost:6274**
Proxy server runs on: `localhost:6277`

---

### Step 3A — Connect to FastMCP (Playwright dummy tools)

In the Inspector UI at `http://localhost:6274`:

| Field | Value |
|---|---|
| Transport | `SSE` |
| URL | `http://127.0.0.1:8000/sse` |

Click **Connect** → see **24 tools**, **3 resources**, **5 prompts**.

---

### Step 3B — Connect to Selenium MCP

In the Inspector UI, switch to a new connection:

| Field | Value |
|---|---|
| Transport | `stdio` |
| Command | `/opt/homebrew/opt/node@22/bin/node` |
| Arguments | `/Users/kshitijrastogi/Documents/AITesterBluePrint2X/Project_08_MCP_Basic/node_modules/@angiejones/mcp-selenium/src/lib/server.js` |

Click **Connect** → see **18 Selenium tools** + **2 resources**.

> **Important:** Use absolute paths. The Inspector proxy spawns the subprocess from its own working
> directory — relative paths like `node_modules/...` or bare `node` won't resolve.

---

### Step 4 — Test the FastMCP Tools

| Tab | Action | Expected result |
|---|---|---|
| **Tools** | `browser_to_url` → set `url=amazon.in` → Execute | Returns `"Ok started"` *(stub — no real browser opens)* |
| **Tools** | `browser_fill` → `selector=#q`, `value=laptop` → Execute | Returns `"Ok started"` |
| **Tools** | `browser_screenshot` → `path=shot.png` → Execute | Returns `"Ok started"` |
| **Resources** | `resource://qa/test-suite-config` | JSON: browsers, timeout, base_url |
| **Resources** | `resource://qa/browser-environments` | JSON: chromium/firefox/webkit |
| **Resources** | `resource://qa/test-run-history` | Text: last 5 run results |
| **Prompts** | `generate_login_test` → fill `url` → Get Prompt | Full Playwright test prompt text |
| **Prompts** | `create_bug_report` → fill fields → Get Prompt | Structured bug report prompt |

---

## Known Gotchas

| Issue | Cause | Fix |
|---|---|---|
| `"Command not found"` in Inspector | Relative path or bare `node` | Use full absolute paths (see Step 3B) |
| `"Invalid OAuth error response"` | Inspector 0.21+ OAuth flow hits stdio server | Add `DANGEROUSLY_OMIT_AUTH=true` |
| `OPTIONS 405` on SSE connect | Browser CORS preflight blocked | Already fixed — `CORSMiddleware` added in `server.py` |
| Tool returns `"Ok started"` with no browser | Playwright tools are intentional stubs | Expected — these are dummy tools by design |
| `mcp.py` name conflict | Shadows Python's `mcp` package | Server file is named `server.py` (not `mcp.py`) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| FastMCP Server | [FastMCP](https://github.com/jlowin/fastmcp) 3.3.1 (Python 3.11) |
| Selenium MCP | [@angiejones/mcp-selenium](https://github.com/angiejones/mcp-selenium) v0.2.3 (Node.js) |
| FastMCP Transport | SSE over HTTP — `http://127.0.0.1:8000/sse` |
| Selenium Transport | stdio (subprocess spawned by Inspector proxy) |
| Inspector | `@modelcontextprotocol/inspector` v0.21.2 |
| Python Package Mgr | uv 0.11.14 |
| Node Runtime | Node.js 22 + npm 10 |

---

## Quick Reference

| Service | URL / Command |
|---|---|
| FastMCP SSE Server | `http://127.0.0.1:8000/sse` |
| MCP Inspector UI | `http://localhost:6274` |
| Inspector Proxy | `localhost:6277` |
| Start FastMCP | `source .venv/bin/activate && python server.py` |
| Start Inspector | `DANGEROUSLY_OMIT_AUTH=true npx mcp-inspector` |
| Selenium node path | `/opt/homebrew/opt/node@22/bin/node` |
| Selenium script path | `<project>/node_modules/@angiejones/mcp-selenium/src/lib/server.js` |
