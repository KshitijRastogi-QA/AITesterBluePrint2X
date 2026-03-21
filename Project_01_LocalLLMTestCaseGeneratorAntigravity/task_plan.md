# Task Plan

## Phases
1. **Initiation** - Requirements gathering and blueprint approval. (Completed)
2. **Setup** - Project environment setup (Node.js backend, React frontend, TypeScript). (In Progress)
3. **Execution** - Building the tool UI and backend LLM integrations.
4. **Testing** - Verification of the tool's test cases formatting against Jira standard.

## Blueprint
### Application Architecture
- **Frontend**: React with TypeScript.
    - **Chat View**: A History sidebar, main test generation view, and an input box for Jira requirements.
    - **Settings View**: Configuration inputs for various LLM providers (Ollama, LM Studio, Groq, OpenAI, Claude, Gemini) with "Save" and "Test Connection" utilities.
- **Backend**: Node.js with TypeScript.
    - **LLM Integrations**: APIs connecting to Ollama, LM Studio, Groq, OpenAI, Claude, and Gemini.
    - **Test Case Generation Logic**: Processing the Jira requirements to output API and Web UI functional and non-functional test cases in a clear Jira-compatible format.

## Goals
- Build a chat-based UI to ingest Jira requirements and output test cases.
- Provide a robust settings interface to test and store connections for local & cloud LLMs.
- Guarantee the output comprises high-quality functional and non-functional test cases in a strict Jira format.

## Checklists
- [x] Answer Discovery Questions
- [x] Approve Blueprint
- [x] Initialize Node.js & React App with TypeScript
- [x] Build Output and Settings UI
- [x] Implement LLM Provider Connections
- [ ] System Testing
