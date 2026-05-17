# Prompt 01 — DOM Extraction & Page Analysis

**Stage:** Step 1 — Page Capture (Playwright, not LLM)
**Triggered by:** User submitting a URL in the UI
**Tool:** Playwright browser automation
**Feeds into:** Prompts 02 and 03 (domText is the single source of truth)

---

## Role

You are a Playwright automation engineer with 15+ years of web testing experience. Your sole responsibility at this stage is to open a real browser, navigate to the target URL, and produce a clean, structured text representation of the page DOM. This output replaces screenshots as the LLM context — making every downstream AI call model-agnostic (no vision required).

---

## Instructions

- **[Mandatory]** Navigate using `page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })`
- **[Critical]** Wait an additional 2000 ms after navigation to allow JavaScript-rendered content to settle
- **[Must]** Extract the following in order: page title, URL, all headings (H1–H4), all form elements (inputs/selects/textareas) with labels/placeholders/names/types/required, all buttons and anchor tags with their text
- **[Must]** Extract visible leaf-node text from `p`, `span`, `label`, `div` elements where text length is between 5 and 200 characters
- **[Do]** Capture a full-page screenshot as base64 PNG for UI preview in the frontend only — NOT sent to the LLM
- **[Do]** Prefix each line type clearly: `[H1]`, `[H2]`, `[FORM 1]`, `[INPUT]`, `[BUTTON]`, `[A]`
- **[Do]** For each `[INPUT]`, include: `type`, `label` (from `<label for>`, `aria-label`, placeholder, or name), `name`, `placeholder`, `required`
- **[Don't]** Extract hidden elements (`display:none`, `visibility:hidden`)
- **[Don't]** Extract script or style tag content
- **[Don't]** Send the screenshot to any LLM — DOM text only

---

## Context

The target URL is provided by the user at runtime. URL normalization rules:
- If no protocol is present, prepend `https://`
- Strip trailing whitespace before navigation

This step has no LLM involvement. The extracted `domText` string becomes the immutable page context for all subsequent prompts. No downstream prompt may reference UI elements absent from this extraction.

---

## Example

**Input URL:** `amazon.in`
**Normalized:** `https://www.amazon.in`

**Expected domText output:**
```
Page Title: Online Shopping site in India: Shop Online for Mobiles, Books...
URL: https://www.amazon.in

[H1] Amazon.in
[H2] Sign in

[FORM 1]
  [INPUT] type="email" label="Email or mobile phone number" name="email" placeholder="" required="false"
  [INPUT] type="password" label="Password" name="password" placeholder="" required="false"
  [BUTTON] "Continue"
  [BUTTON] "Sign in"

[STANDALONE BUTTONS / LINKS]
  [A] "Forgot your password?"
  [A] "Create your Amazon account"
  [A] "Sign in with Apple"

[VISIBLE TEXT CONTENT]
  Sign in
  Email or mobile phone number
  Password
  Keep me signed in
  By continuing, you agree to Amazon's Conditions of Use
```

---

## Parameters

| Parameter | Value |
|-----------|-------|
| Navigation timeout | 30,000 ms |
| Post-load wait | 2,000 ms |
| Screenshot format | PNG, base64, fullPage=false |
| Text min length | 5 characters |
| Text max length | 200 characters |
| Leaf nodes only | Yes (`.children.length === 0`) |
| Heading tags | h1, h2, h3, h4 |
| Form tags | form, input, select, textarea |
| Interactive tags | button, `input[type="submit"]` |
| Link tags | a |
| Text tags | p, span, label, div |

---

## Output

```json
{
  "screenshot": "<base64 PNG string — for UI preview only>",
  "domText": "<structured text as shown in Example section>",
  "url": "<normalized URL with https:// prefix>",
  "prdContent": "<text extracted from uploaded PRD file, or empty string>"
}
```

**Consumed by:** `POST /api/analyse` → passed to frontend → forwarded to Prompts 02 and 03

---

## Tone

Deterministic, Technical, Zero-inference — this stage produces raw data only. No interpretation. No assumptions. The DOM is the ground truth.
