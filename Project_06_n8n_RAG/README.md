# Project 06 (n8n) — Advanced RAG Pipeline with Pinecone + Cohere + GPT-5

> The same Advanced RAG concept as Project_06 — but rebuilt entirely as a **no-code n8n workflow**. No Python, no FastAPI, no custom frontend. Just a visual canvas with two clearly separated pipelines: one for ingesting documents, one for answering questions.

Import `AdvanceRag_n8n.json` into your n8n instance and you have a working RAG system in minutes.

---

## What It Does

Upload a CSV via a web form → it gets chunked, embedded, and stored in Pinecone. Then open the chat interface → ask anything → the AI Agent retrieves the most relevant chunks, reranks them with Cohere, and generates a grounded answer using GPT-5 — with full conversation memory across turns.

---

## Workflow Structure

The workflow is split into two visually labelled sections on the n8n canvas:

### 1. Ingestion Pipeline

Triggered by a web form. Takes a CSV file upload and pushes it into Pinecone.

```
Form Trigger (CSV upload)
        │
        ▼
Pinecone Vector Store [insert mode → ragdev-new index]
        ▲               ▲                    ▲
        │               │                    │
Embeddings OpenAI   Default Data Loader   Recursive Character
(generate vectors)  (reads binary file)   Text Splitter
                            ▲
                            │
                    Text Splitter feeds
                    into Data Loader
```

| Node | Role |
|---|---|
| **On Form Submission** | Web form with a single file field — drag and drop a CSV to kick off ingestion |
| **Default Data Loader** | Reads the uploaded binary file and prepares it as documents |
| **Recursive Character Text Splitter** | Splits documents into overlapping chunks using recursive character boundaries — preserves semantic coherence better than fixed-size splitting |
| **Embeddings OpenAI** | Converts each chunk into a vector using OpenAI's embedding model |
| **Pinecone Vector Store (insert)** | Writes all chunk vectors + metadata into the `ragdev-new` Pinecone index |

---

### 2. RAG Query Pipeline

Triggered by a chat message. An AI Agent decides when and how to query the vector store, then generates a response.

```
Chat Trigger
      │
      ▼
  AI Agent ◄─── OpenAI Chat Model (GPT-5)
      │    ◄─── Simple Memory (conversation buffer)
      │    ◄─── Pinecone Vector Store [retrieve-as-tool]
                        ▲              ▲
                        │              │
               Embeddings OpenAI   Reranker Cohere
               (embed the query)   (rerank results)
```

| Node | Role |
|---|---|
| **When Chat Message Received** | Built-in n8n chat trigger — opens a chat UI automatically |
| **AI Agent** | Orchestrator — routes the query, decides when to call the retriever tool, synthesises the final answer |
| **OpenAI Chat Model (GPT-5)** | The LLM powering the agent |
| **Simple Memory** | Buffer window memory — keeps recent conversation turns in context so follow-up questions work naturally |
| **Pinecone Vector Store (retrieve-as-tool)** | Exposed to the Agent as a callable tool — the agent queries it on demand rather than every turn unconditionally |
| **Embeddings OpenAI** | Embeds the incoming query into a vector before searching Pinecone |
| **Reranker Cohere** | Re-scores retrieved chunks by relevance to the query — filters noise and surfaces the best matches before they reach the LLM |

---

## Stack

| Layer | Technology |
|---|---|
| **Workflow engine** | n8n (self-hosted or cloud) |
| **LLM** | GPT-5 via OpenAI API |
| **Embeddings** | OpenAI Embeddings API |
| **Vector store** | Pinecone (`ragdev-new` index) |
| **Reranker** | Cohere Rerank API |
| **Memory** | n8n Buffer Window Memory |
| **Chunking** | Recursive Character Text Splitter |

---

## How It Differs from Project_06 (Python/FastAPI version)

| Aspect | Project_06 (Python) | Project_06_n8n |
|---|---|---|
| **Setup** | Install Python, venv, pip, run server | Import JSON into n8n |
| **Embeddings** | all-MiniLM-L6-v2 (local) | OpenAI API |
| **Vector store** | ChromaDB (self-hosted, local) | Pinecone (cloud) |
| **Reranker** | scikit-learn cross-encoder (local) | Cohere Rerank API (cloud) |
| **LLM** | Groq (llama-3.3-70b, mixtral) | GPT-5 |
| **Retrieval pattern** | Fixed pipeline (always retrieve → generate) | Agentic (agent decides when to call retriever) |
| **Memory** | Per-session in Python | Built-in n8n buffer window |
| **Observability** | Full timing + token metrics in custom UI | n8n execution log per node |
| **Code required** | Yes — Python backend + JS frontend | No — pure visual workflow |

The key architectural difference: in Project_06, retrieval is **mandatory on every query**. Here, the Pinecone store is exposed as a **tool** — the AI Agent decides whether a retrieval call is needed. For simple follow-up questions or clarifications, it can answer from memory alone.

---

## Getting Started

### Prerequisites

- n8n instance (self-hosted via Docker or n8n cloud)
- OpenAI API key
- Pinecone account with an index named `ragdev-new`
- Cohere API key

### Import and Configure

1. In n8n, go to **Workflows → Import from file** and select `AdvanceRag_n8n.json`
2. Open the **Embeddings OpenAI** nodes and connect your OpenAI credential
3. Open the **OpenAI Chat Model** node and connect your OpenAI credential
4. Open both **Pinecone Vector Store** nodes and connect your Pinecone credential
5. Open the **Reranker Cohere** node and connect your Cohere credential
6. Activate the workflow

### Ingest Data

1. Open the **On Form Submission** trigger URL (n8n generates this automatically)
2. Upload your CSV file
3. The ingestion pipeline runs automatically — chunks, embeds, and upserts to Pinecone

### Chat

1. Open the **When Chat Message Received** trigger URL
2. Ask questions about your uploaded data
3. The agent retrieves relevant chunks, reranks them, and responds with a grounded answer

---

## Credentials Required

| Credential | Used By |
|---|---|
| `openAiApi` | Embeddings OpenAI, Embeddings OpenAI1, OpenAI Chat Model |
| `pineconeApi` | Pinecone Vector Store (insert), Pinecone Vector Store (retrieve) |
| `cohereApi` | Reranker Cohere |
