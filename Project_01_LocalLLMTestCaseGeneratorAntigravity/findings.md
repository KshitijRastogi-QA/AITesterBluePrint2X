# Findings

## Research
- The user is generating API and web application test cases (functional and non-functional).
- The test cases must be formatted for Jira.
- The UI contains two main pages (as seen in the mockups):
    1. A generation chat interface with a History sidebar, a main window for test case output, and an input area for pasting Jira requirements.
    2. A settings area for managing various LLM connections with "Save" and "Test Connection" options.

## Discoveries
- Supported LLM integrations: Ollama API, LM Studio API, Groq API, OpenAI API, Claude API, Gemini API.
- Generator Tech Stack: Node.js Backend, React Frontend. Both written in TypeScript.
- Input Mechanism: The primary method is the user pasting Jira requirements or chatting within the application.

## Constraints
- Output must strictly follow a formal Jira formatting structure for both functional and non-functional test cases.
- Execution remains halted until the Blueprint is explicitly approved.
