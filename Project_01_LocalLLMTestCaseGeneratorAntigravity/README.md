# Project 01 — Local LLM Test Case Generator (Antigravity)

A full-stack web app that generates functional and non-functional Jira test cases from a plain-text requirement using any LLM — local or cloud.

## What It Does

Paste a Jira requirement → select your LLM provider → click Generate → get structured test cases in Jira markdown format, covering both functional and non-functional scenarios.

## Supported LLM Providers

| Provider | Type | Needs API Key |
|----------|------|---------------|
| Ollama | Local | No |
| LM Studio | Local | No |
| Groq | Cloud | Yes |
| OpenAI (GPT-4o) | Cloud | Yes |
| Anthropic Claude | Cloud | Yes |
| Google Gemini | Cloud | Yes |

## Project Structure

```
Project_01_LocalLLMTestCaseGeneratorAntigravity/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express server (port 3000)
│   │   ├── routes/llm.ts      # /api/settings, /api/test-connection, /api/generate
│   │   └── services/llmService.ts  # LangChain provider adapter
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main React UI (chat + settings tabs)
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── task_plan.md               # Project phases and build checklist
```

## Prerequisites

- Node.js 18+
- npm
- One of the supported LLM providers running or API key ready

For local LLMs (no API key needed):
- **Ollama**: Install from [ollama.com](https://ollama.com) → `ollama pull gemma3:1b`
- **LM Studio**: Download from [lmstudio.ai](https://lmstudio.ai) and load a model

## Setup & Run

### 1. Start the Backend

```bash
cd backend
npm install        # only needed first time
npm start
```

Backend runs on `http://localhost:3000`. Health check: `http://localhost:3000/health`

### 2. Start the Frontend

```bash
cd frontend
npm install        # only needed first time
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Use the App

1. Open `http://localhost:5173` in your browser
2. Go to the **Settings** tab
3. Select your LLM provider and enter the API key (if cloud) or base URL (if local)
4. Click **Test Connection** to verify
5. Go to the **Chat** tab
6. Paste a Jira requirement and click **Generate**

## Example Output Format

```
*Functional Test Cases*

1. **Login with valid credentials**
- *Steps*: Navigate to login page, enter valid email and password, click Login.
- *Expected*: User is redirected to the dashboard.

*Non-Functional Test Cases*

1. **Login page load performance**
- *Steps*: Load the login page on a 3G network connection.
- *Expected*: Page loads within 3 seconds.
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/settings` | Save LLM config for the session |
| POST | `/api/test-connection` | Test if the LLM provider responds |
| POST | `/api/generate` | Generate test cases from a requirement |

### `/api/generate` Request Body

```json
{
  "requirement": "User should be able to log in with email and password",
  "config": {
    "provider": "ollama",
    "model": "gemma3:1b",
    "baseUrl": "http://localhost:11434"
  }
}
```

## Ports

| Service | Port |
|---------|------|
| Backend (Express) | 3000 |
| Frontend (Vite) | 5173 |
........