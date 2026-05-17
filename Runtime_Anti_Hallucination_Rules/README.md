# Project 01 — Local LLM Test Case Generator (Anti-Hallucination Rules)

## What This Is

A prompt engineering rule set that constrains a local LLM to behave as a strict, non-hallucinating QA assistant when generating test cases.

The core problem it solves: LLMs tend to invent features, assume default behavior, or fabricate error codes when generating test cases. This rule set forces the model to only use what you explicitly give it.

## File

| File | Purpose |
|------|---------|
| `Anti-hallucinationRule.md` | System prompt rules to paste into any LLM (ChatGPT, Claude, Ollama, etc.) before asking it to generate test cases |

## How to Use

1. Open `Anti-hallucinationRule.md`
2. Copy the entire content
3. Paste it as the **system prompt** (or first message) in your LLM of choice
4. Then provide your input — PRD, API docs, screenshots, logs, or test data
5. Ask the LLM to generate test cases

The model will only generate assertions traceable to what you provided. If something is missing, it will say `"Insufficient information to determine."` instead of guessing.

## Output Format the LLM Follows

```
Verified Facts:
Missing / Unknown Information:
Generated Output:
Self-Validation Check:
```

## Works With

- ChatGPT (GPT-4o, o1)
- Claude (claude.ai or Claude Code)
- Local models via Ollama (llama3, mistral, etc.)
- Any LLM that accepts a system prompt

## Key Rules Enforced

- No invented features, APIs, error codes, or UI elements
- No assumed "typical" behavior
- All inferences must be labeled as `Inference (low confidence)`
- Output must be deterministic and repeatable
- Self-validation check required on every output

## No Setup Required

This is a pure prompt rule set — no code, no dependencies, no installation needed.
