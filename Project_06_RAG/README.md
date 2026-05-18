# Project 06 — Advanced RAG Explorer for QA

> **Weekend AI Fun** — A Retrieval-Augmented Generation platform that removes the "black box" of AI by letting you *see* exactly how your QA test cases are ingested, stored, retrieved, and reasoned over.

---

## What It Does

Most RAG tools are opaque. You upload data, ask a question, get an answer — with no visibility into what happened in between. This explorer exposes every step of the pipeline in real time:

- **Drag-and-drop your test cases** (CSV or Excel) and watch them get chunked and tokenised before your eyes.
- **Browse directly inside the vector store** — audit every chunk, its metadata, and how it scored against a search query.
- **Chat with your QA history** — ask the AI to write new test cases for a Jira ticket, surface edge cases from past runs, or explain test coverage gaps. All grounded in *your actual test data*, not generic knowledge.
- **Trace every query step-by-step** — see which chunks were retrieved, their reranking scores, and live LLM token usage.

---

## Features

### Visual Ingestion
- Drag-and-drop CSV / XLSX / XLS upload
- Configurable chunking: fixed-size word chunks (default 300 words, 50-word overlap) or sentence-aware chunking that preserves sentence boundaries
- Real-time statistics: token distribution (avg / min / max per chunk), embedding time, upsert time, chunks-per-row ratio
- Batch embedding (256 chunks per batch) for large datasets — tested on 5 000-row VWO Jira test case exports

### Database Browser
- Search the vector store by keyword or semantic query
- Paginated chunk viewer with full metadata: row index, chunk index, token count, chunking strategy used
- Direct audit of what is actually stored in ChromaDB — no guessing what the retriever "sees"

### QA Chat Assistant
- Ask in plain English: *"Write 5 edge case tests for login with SSO"* or *"What test cases do we have for checkout timeout?"*
- Answers are generated from retrieved historical test data — grounded, not hallucinated
- Full message history within the session

### Pipeline Inspector
- Per-query timing breakdown: embed → retrieve → rerank → LLM
- Exact chunks passed to the LLM with their reranking scores
- LLM token usage (prompt / completion / total) reported after every response

---

## Stack

| Layer | Technology |
|---|---|
| **LLM** | Groq API — `llama-3.3-70b-versatile`, `mixtral-8x7b`, etc. |
| **Embeddings** | `all-MiniLM-L6-v2` (Sentence-Transformers, 384-dim vectors) |
| **Vector Store** | ChromaDB with HNSW index (cosine similarity) |
| **Reranking** | Cross-encoder cosine similarity (scikit-learn) |
| **Backend** | FastAPI + Uvicorn (Python 3.12) |
| **Frontend** | Vanilla HTML5 + JavaScript + CSS3 (no framework, no build step) |
| **Charts** | Chart.js |
| **Token counting** | tiktoken |

---

## Project Structure

```
Project_06_RAG/
├── advanced_rag_explorer/
│   ├── run_app.sh                  # One-command startup
│   ├── backend/
│   │   ├── main.py                 # FastAPI app — all endpoints and RAG logic
│   │   └── requirements.txt
│   ├── frontend/
│   │   ├── index.html              # Single-page UI
│   │   ├── app.js                  # All client-side logic
│   │   └── styles.css              # Claude-inspired cream/rust theme
│   └── data/
│       ├── chroma_db/              # Persistent vector store (auto-created)
│       └── sample_test_cases.csv   # Small sample to try the tool immediately
└── app_vwo_jira_test_cases_5000.csv  # Real 5 000-row VWO/Jira test dataset
```

---

## Getting Started

### Prerequisites

- Python 3.12 (use `pyenv` — `.python-version` is provided)
- A [Groq API key](https://console.groq.com) (free tier is sufficient for exploration)

### Install and Run

```bash
cd Project_06_RAG/advanced_rag_explorer

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the server
./run_app.sh
# or manually:
cd backend && uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000` in your browser.

### First Run

1. Enter your Groq API key in the key modal (stored in-browser only, never sent to disk).
2. Go to the **Ingestion** tab and upload `sample_test_cases.csv` (or the full 5 000-row dataset).
3. Adjust chunking settings if needed, then click **Ingest**.
4. Switch to **Vector Browser** to inspect stored chunks.
5. Open **RAG Chat** and ask a question about your test cases.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Backend status and ChromaDB collection info |
| `POST` | `/api/set-api-key` | Set Groq API key for the session |
| `POST` | `/api/ingest` | Upload and chunk a CSV/Excel file |
| `POST` | `/api/query` | Run a full RAG query (embed → retrieve → rerank → generate) |
| `GET` | `/api/browse-chunks` | Browse or search stored chunks with pagination |
| `GET` | `/api/collection-stats` | Ingestion statistics and token distribution |
| `GET` | `/` | Serve the frontend |

---

## How the RAG Pipeline Works

```
User Query
    │
    ▼
1. Embed query          (all-MiniLM-L6-v2 → 384-dim vector)
    │
    ▼
2. Vector search        (ChromaDB HNSW cosine similarity → top-k chunks)
    │
    ▼
3. Rerank               (cross-encoder cosine scoring → filter + reorder)
    │
    ▼
4. Generate             (Groq LLM with retrieved chunks as context)
    │
    ▼
Response + timing breakdown + token usage
```

Every step is timed and returned to the frontend so you can see exactly where time is spent and which chunks influenced the answer.

---

## Why This Exists

Standard RAG setups hide too much. When a QA team wants to trust AI-generated test cases, they need to answer:

- *Where did this answer come from?*
- *Which historical test cases were used as context?*
- *How confident is the retriever in these results?*

This tool makes all of that observable without requiring a data science background. If you can read a spreadsheet, you can audit this pipeline.
