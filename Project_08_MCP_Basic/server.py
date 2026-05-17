import json
import uvicorn
from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

mcp = FastMCP("playwright-qa-mcp")

# ─────────────────────────────────────────────
# 24 DUMMY PLAYWRIGHT TOOLS
# Each tool prints its invocation and returns "Ok started"
# ─────────────────────────────────────────────

@mcp.tool()
def browser_to_url(url: str) -> str:
    """Navigate the browser to the specified URL."""
    print(f"[browser_to_url] url={url}")
    return "Ok started"

@mcp.tool()
def browser_click(selector: str) -> str:
    """Click an element identified by the given CSS/XPath selector."""
    print(f"[browser_click] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_fill(selector: str, value: str) -> str:
    """Fill an input field with the given value."""
    print(f"[browser_fill] selector={selector} value={value}")
    return "Ok started"

@mcp.tool()
def browser_screenshot(path: str = "screenshot.png") -> str:
    """Take a screenshot of the current page and save it to path."""
    print(f"[browser_screenshot] path={path}")
    return "Ok started"

@mcp.tool()
def browser_get_text(selector: str) -> str:
    """Get the text content of an element."""
    print(f"[browser_get_text] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_hover(selector: str) -> str:
    """Hover the mouse over an element."""
    print(f"[browser_hover] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_double_click(selector: str) -> str:
    """Double-click an element."""
    print(f"[browser_double_click] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_right_click(selector: str) -> str:
    """Right-click (context-menu click) an element."""
    print(f"[browser_right_click] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_scroll(direction: str = "down", pixels: int = 300) -> str:
    """Scroll the page up or down by a given number of pixels."""
    print(f"[browser_scroll] direction={direction} pixels={pixels}")
    return "Ok started"

@mcp.tool()
def browser_wait_for_element(selector: str, timeout_ms: int = 5000) -> str:
    """Wait for an element to appear in the DOM within the timeout."""
    print(f"[browser_wait_for_element] selector={selector} timeout_ms={timeout_ms}")
    return "Ok started"

@mcp.tool()
def browser_press_key(key: str) -> str:
    """Press a keyboard key (e.g. 'Enter', 'Tab', 'Escape')."""
    print(f"[browser_press_key] key={key}")
    return "Ok started"

@mcp.tool()
def browser_select_option(selector: str, option_value: str) -> str:
    """Select an option from a <select> dropdown by its value."""
    print(f"[browser_select_option] selector={selector} option_value={option_value}")
    return "Ok started"

@mcp.tool()
def browser_check_checkbox(selector: str) -> str:
    """Check a checkbox element."""
    print(f"[browser_check_checkbox] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_uncheck_checkbox(selector: str) -> str:
    """Uncheck a checkbox element."""
    print(f"[browser_uncheck_checkbox] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_upload_file(selector: str, file_path: str) -> str:
    """Upload a file to a file input element."""
    print(f"[browser_upload_file] selector={selector} file_path={file_path}")
    return "Ok started"

@mcp.tool()
def browser_drag_and_drop(source_selector: str, target_selector: str) -> str:
    """Drag one element and drop it onto another."""
    print(f"[browser_drag_and_drop] source={source_selector} target={target_selector}")
    return "Ok started"

@mcp.tool()
def browser_get_attribute(selector: str, attribute: str) -> str:
    """Get the value of a specific attribute from an element."""
    print(f"[browser_get_attribute] selector={selector} attribute={attribute}")
    return "Ok started"

@mcp.tool()
def browser_assert_visible(selector: str) -> str:
    """Assert that an element is visible on the page."""
    print(f"[browser_assert_visible] selector={selector}")
    return "Ok started"

@mcp.tool()
def browser_assert_text(selector: str, expected_text: str) -> str:
    """Assert that an element contains the expected text."""
    print(f"[browser_assert_text] selector={selector} expected_text={expected_text}")
    return "Ok started"

@mcp.tool()
def browser_close_tab() -> str:
    """Close the current browser tab."""
    print("[browser_close_tab]")
    return "Ok started"

@mcp.tool()
def browser_new_tab(url: str = "") -> str:
    """Open a new browser tab, optionally navigating to a URL."""
    print(f"[browser_new_tab] url={url}")
    return "Ok started"

@mcp.tool()
def browser_go_back() -> str:
    """Navigate the browser back to the previous page."""
    print("[browser_go_back]")
    return "Ok started"

@mcp.tool()
def browser_go_forward() -> str:
    """Navigate the browser forward to the next page."""
    print("[browser_go_forward]")
    return "Ok started"

@mcp.tool()
def browser_refresh() -> str:
    """Reload / refresh the current page."""
    print("[browser_refresh]")
    return "Ok started"


# ─────────────────────────────────────────────
# 3 RESOURCES  (2 data / JSON  +  1 text)
# ─────────────────────────────────────────────

@mcp.resource("resource://qa/test-suite-config")
def get_test_suite_config() -> str:
    """QA test suite configuration — browsers, base URL, timeouts, retries."""
    data = {
        "suite_name": "Playwright QA Suite",
        "base_url": "https://example.com",
        "browsers": ["chromium", "firefox", "webkit"],
        "viewport": {"width": 1280, "height": 720},
        "timeout_ms": 30000,
        "retries": 2,
        "headless": True,
        "screenshot_on_failure": True,
        "video_on_failure": False,
    }
    return json.dumps(data, indent=2)

@mcp.resource("resource://qa/browser-environments")
def get_browser_environments() -> str:
    """Supported browser environments with versions and capability flags."""
    data = {
        "environments": [
            {
                "name": "chromium",
                "version": "124.0",
                "supports_pdf": True,
                "supports_webgl": True,
                "mobile_emulation": True,
            },
            {
                "name": "firefox",
                "version": "125.0",
                "supports_pdf": False,
                "supports_webgl": True,
                "mobile_emulation": False,
            },
            {
                "name": "webkit",
                "version": "17.4",
                "supports_pdf": False,
                "supports_webgl": True,
                "mobile_emulation": True,
            },
        ]
    }
    return json.dumps(data, indent=2)

@mcp.resource("resource://qa/test-run-history")
def get_test_run_history() -> str:
    """Last 5 dummy test run results with pass/fail status."""
    return (
        "=== QA Test Run History (last 5 runs) ===\n\n"
        "Run #101 | 2026-05-17 09:00 | PASSED  | 42/42 tests | 1m 12s\n"
        "Run #100 | 2026-05-16 18:30 | FAILED  | 40/42 tests | 1m 08s  [2 failures: login_flow, checkout]\n"
        "Run #099 | 2026-05-16 09:00 | PASSED  | 42/42 tests | 1m 15s\n"
        "Run #098 | 2026-05-15 18:30 | PASSED  | 42/42 tests | 1m 10s\n"
        "Run #097 | 2026-05-15 09:00 | FAILED  | 39/42 tests | 1m 20s  [3 failures: profile, upload, drag]\n"
    )


# ─────────────────────────────────────────────
# 5 PROMPTS  (QA / Playwright themed)
# ─────────────────────────────────────────────

@mcp.prompt()
def generate_login_test(
    url: str,
    username_selector: str = "#username",
    password_selector: str = "#password",
) -> str:
    """Generate a complete Playwright test for a login flow."""
    return (
        f"Generate a complete Playwright test in Python for the login flow.\n\n"
        f"Page URL: {url}\n"
        f"Username selector: {username_selector}\n"
        f"Password selector: {password_selector}\n\n"
        f"Requirements:\n"
        f"- Use pytest-playwright fixtures (page, browser)\n"
        f"- Fill credentials and submit the form\n"
        f"- Assert successful login (e.g. URL change or dashboard element visible)\n"
        f"- Add explicit waits instead of sleep()\n"
        f"- Include a negative test case for invalid credentials\n"
        f"- Follow the Page Object Model pattern"
    )

@mcp.prompt()
def create_bug_report(
    title: str,
    steps_to_reproduce: str,
    expected: str,
    actual: str,
) -> str:
    """Create a structured QA bug report from raw observations."""
    return (
        f"Create a professional QA bug report with the following information:\n\n"
        f"**Title:** {title}\n\n"
        f"**Steps to Reproduce:**\n{steps_to_reproduce}\n\n"
        f"**Expected Result:** {expected}\n\n"
        f"**Actual Result:** {actual}\n\n"
        f"Format the report with: Summary, Environment, Severity, Steps to Reproduce, "
        f"Expected vs Actual, Screenshots placeholder, and Suggested Fix sections."
    )

@mcp.prompt()
def suggest_locator_strategy(
    element_description: str,
    page_url: str,
) -> str:
    """Recommend the best Playwright locator strategy for a given element."""
    return (
        f"Suggest the best Playwright locator strategy for the following element:\n\n"
        f"Element: {element_description}\n"
        f"Page URL: {page_url}\n\n"
        f"Evaluate and rank these strategies in order of preference:\n"
        f"1. getByRole (ARIA role + accessible name)\n"
        f"2. getByLabel / getByPlaceholder / getByText\n"
        f"3. data-testid attribute\n"
        f"4. CSS selector\n"
        f"5. XPath (last resort)\n\n"
        f"Provide a concrete Playwright code snippet for the recommended strategy "
        f"and explain why it is the most resilient choice."
    )

@mcp.prompt()
def write_page_object(
    page_name: str,
    page_url: str,
) -> str:
    """Generate a Page Object Model (POM) class for a given page."""
    return (
        f"Write a Playwright Page Object Model (POM) class in Python for:\n\n"
        f"Page Name: {page_name}\n"
        f"Page URL: {page_url}\n\n"
        f"The POM class should:\n"
        f"- Accept a Playwright `page` fixture in __init__\n"
        f"- Expose @property locators for all major interactive elements\n"
        f"- Provide action methods (e.g. fill_form(), submit(), assert_success())\n"
        f"- Include a navigate() method that goes to {page_url}\n"
        f"- Follow Python type hints and docstrings\n"
        f"- Be importable from a tests/ directory"
    )

@mcp.prompt()
def review_test_script(script: str) -> str:
    """Review a Playwright test script and suggest improvements."""
    return (
        f"Review the following Playwright test script and provide actionable feedback:\n\n"
        f"```python\n{script}\n```\n\n"
        f"Check for:\n"
        f"1. Hardcoded sleeps (time.sleep) — suggest explicit waits instead\n"
        f"2. Fragile selectors — recommend more resilient alternatives\n"
        f"3. Missing assertions — identify gaps in test coverage\n"
        f"4. Missing error handling / try-finally for cleanup\n"
        f"5. POM pattern violations — flag inline selectors that should be in a POM\n"
        f"6. Performance — flag unnecessary re-navigation or redundant steps\n\n"
        f"Return a numbered list of issues with severity (High/Medium/Low) and a fixed code snippet."
    )


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    app = mcp.http_app(
        transport="sse",
        middleware=[
            Middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        ],
    )
    uvicorn.run(app, host="127.0.0.1", port=8000)
