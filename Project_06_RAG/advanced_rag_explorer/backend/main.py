"""
Advanced RAG Explorer - Backend API
====================================
FastAPI backend with ChromaDB vector store, sentence-transformers embeddings,
and Groq LLM for Advanced RAG with full observability.
"""

import os
import json
import uuid
import time
import math
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
import io

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from groq import Groq

load_dotenv()

# ───────────────────────────── Logging ──────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ───────────────────────────── App Setup ────────────────────────────
app = FastAPI(title="Advanced RAG Explorer", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
CHROMA_DIR = DATA_DIR / "chroma_db"
CHROMA_DIR.mkdir(exist_ok=True)

# ───────────────────────────── Global State ──────────────────────────
embedding_model: Optional[SentenceTransformer] = None
chroma_client: Optional[chromadb.PersistentClient] = None
groq_client: Optional[Groq] = None
collection_name = "advanced_rag_testcases"
ingestion_stats: Dict[str, Any] = {}

# ───────────────────────────── Models ────────────────────────────────
class ChunkConfig(BaseModel):
    chunk_size: int = 300
    chunk_overlap: int = 50
    chunking_strategy: str = "fixed"   # fixed | sentence | semantic

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10
    rerank_top_k: int = 5
    groq_model: str = "llama-3.3-70b-versatile"

class APIKeyRequest(BaseModel):
    api_key: str

# ───────────────────────────── Startup ───────────────────────────────
@app.on_event("startup")
async def startup_event():
    global embedding_model, chroma_client, groq_client
    logger.info("Loading sentence-transformer model…")
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("Connecting to ChromaDB…")
    chroma_client = chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False)
    )
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if groq_api_key:
        groq_client = Groq(api_key=groq_api_key)
        logger.info("Groq client initialized from environment.")
    else:
        logger.warning("GROQ_API_KEY not set. Use /api/set-api-key endpoint.")
    logger.info("✅ Advanced RAG Explorer ready!")

# ───────────────────────────── Helpers ───────────────────────────────
def smart_chunk(text: str, chunk_size: int, overlap: int, strategy: str) -> List[Dict]:
    """Chunk text with the chosen strategy, returning metadata per chunk."""
    chunks = []
    if strategy == "sentence":
        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
        current, current_len, start_char = [], 0, 0
        for sent in sentences:
            word_count = len(sent.split())
            if current_len + word_count > chunk_size and current:
                chunk_text = ". ".join(current) + "."
                chunks.append({"text": chunk_text, "start_char": start_char, "tokens": current_len, "strategy": "sentence"})
                # overlap: keep last N words worth of sentences
                overlap_words = 0
                overlap_sents = []
                for s in reversed(current):
                    overlap_words += len(s.split())
                    if overlap_words >= overlap:
                        break
                    overlap_sents.insert(0, s)
                current = overlap_sents
                current_len = sum(len(s.split()) for s in current)
                start_char = text.find(current[0]) if current else start_char
            current.append(sent)
            current_len += word_count
        if current:
            chunks.append({"text": ". ".join(current) + ".", "start_char": start_char, "tokens": current_len, "strategy": "sentence"})
    else:
        # Fixed-size word chunking
        words = text.split()
        step = max(1, chunk_size - overlap)
        pos = 0
        char_pos = 0
        while pos < len(words):
            chunk_words = words[pos: pos + chunk_size]
            chunk_text = " ".join(chunk_words)
            chunks.append({
                "text": chunk_text,
                "start_char": char_pos,
                "tokens": len(chunk_words),
                "strategy": strategy,
            })
            char_pos += len(" ".join(words[pos: pos + step])) + 1
            pos += step
    return chunks

def row_to_text(row: pd.Series, columns: List[str]) -> str:
    parts = []
    for col in columns:
        val = str(row.get(col, "")).strip()
        if val and val.lower() not in ("nan", "none", ""):
            parts.append(f"{col}: {val}")
    return " | ".join(parts)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def rerank_chunks(query: str, chunks: List[Dict], top_k: int) -> List[Dict]:
    """Cross-encoder style reranking using cosine similarity on full embeddings."""
    query_emb = embedding_model.encode([query])[0]
    for chunk in chunks:
        chunk_emb = embedding_model.encode([chunk["text"]])[0]
        chunk["rerank_score"] = cosine_similarity(query_emb, chunk_emb)
    reranked = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)
    return reranked[:top_k]

# ───────────────────────────── Endpoints ─────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": "all-MiniLM-L6-v2",
        "groq_ready": groq_client is not None,
        "collection": collection_name,
    }

@app.post("/api/set-api-key")
async def set_api_key(req: APIKeyRequest):
    global groq_client
    groq_client = Groq(api_key=req.api_key)
    os.environ["GROQ_API_KEY"] = req.api_key
    return {"status": "ok", "message": "Groq API key set successfully."}

@app.get("/api/collection-stats")
async def collection_stats():
    try:
        col = chroma_client.get_or_create_collection(collection_name)
        count = col.count()
        sample = col.peek(10) if count > 0 else {}
        return {
            "collection": collection_name,
            "total_chunks": count,
            "sample_ids": sample.get("ids", []),
            "ingestion_stats": ingestion_stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
async def ingest(
    file: UploadFile = File(...),
    chunk_size: int = 300,
    chunk_overlap: int = 50,
    chunking_strategy: str = "fixed",
    reset_collection: bool = True,
):
    global ingestion_stats
    t_start = time.time()

    # ── Read file ──────────────────────────────────────────────────
    content = await file.read()
    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported.")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"File parse error: {e}")

    df = df.dropna(how="all")
    columns = df.columns.tolist()
    total_rows = len(df)

    if total_rows == 0:
        raise HTTPException(status_code=400, detail="Uploaded file has no data rows.")

    # ── Reset / create collection ──────────────────────────────────
    if reset_collection:
        try:
            chroma_client.delete_collection(collection_name)
        except Exception:
            pass
    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    # ── Chunk & Embed ──────────────────────────────────────────────
    all_chunks = []
    chunk_details = []
    doc_ids = []
    embeddings = []

    for idx, row in df.iterrows():
        text = row_to_text(row, columns)
        row_chunks = smart_chunk(text, chunk_size, chunk_overlap, chunking_strategy)
        for ci, chunk in enumerate(row_chunks):
            chunk_id = f"row{idx}_chunk{ci}_{uuid.uuid4().hex[:6]}"
            chunk_meta = {
                "row_index": int(idx),
                "chunk_index": ci,
                "total_chunks_in_row": len(row_chunks),
                "tokens": chunk["tokens"],
                "strategy": chunk["strategy"],
                "start_char": chunk["start_char"],
                "source_file": file.filename,
                **{col: str(row.get(col, ""))[:200] for col in columns[:5]},
            }
            all_chunks.append(chunk["text"])
            doc_ids.append(chunk_id)
            chunk_details.append({
                "id": chunk_id,
                "text": chunk["text"][:400],
                "text_full": chunk["text"],
                "metadata": chunk_meta,
            })

    # Batch embed (batches of 256)
    batch_size = 256
    t_embed_start = time.time()
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i: i + batch_size]
        embs = embedding_model.encode(batch, show_progress_bar=False)
        embeddings.extend(embs.tolist())
    t_embed_end = time.time()

    # Upsert to ChromaDB in batches
    t_upsert_start = time.time()
    for i in range(0, len(all_chunks), batch_size):
        collection.upsert(
            ids=doc_ids[i: i + batch_size],
            documents=all_chunks[i: i + batch_size],
            embeddings=embeddings[i: i + batch_size],
            metadatas=[c["metadata"] for c in chunk_details[i: i + batch_size]],
        )
    t_upsert_end = time.time()

    t_total = time.time() - t_start

    # ── Compute overlap distribution ───────────────────────────────
    tokens_list = [c["metadata"]["tokens"] for c in chunk_details]
    avg_tokens = float(np.mean(tokens_list)) if tokens_list else 0
    min_tokens = int(np.min(tokens_list)) if tokens_list else 0
    max_tokens = int(np.max(tokens_list)) if tokens_list else 0

    ingestion_stats = {
        "filename": file.filename,
        "total_rows": total_rows,
        "columns": columns,
        "total_chunks": len(all_chunks),
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "chunking_strategy": chunking_strategy,
        "embedding_model": "all-MiniLM-L6-v2",
        "embedding_dim": 384,
        "avg_tokens_per_chunk": round(avg_tokens, 1),
        "min_tokens": min_tokens,
        "max_tokens": max_tokens,
        "embed_time_sec": round(t_embed_end - t_embed_start, 2),
        "upsert_time_sec": round(t_upsert_end - t_upsert_start, 2),
        "total_time_sec": round(t_total, 2),
        "vector_store": "ChromaDB (cosine)",
        "chunks_per_row": round(len(all_chunks) / max(total_rows, 1), 2),
    }

    # Return first 100 chunk details for preview
    return {
        "status": "success",
        "stats": ingestion_stats,
        "chunk_preview": chunk_details[:100],
        "sample_columns": columns,
    }

@app.post("/api/query")
async def query_rag(req: QueryRequest):
    if embedding_model is None:
        raise HTTPException(status_code=503, detail="Embedding model not loaded.")
    if groq_client is None:
        raise HTTPException(status_code=400, detail="Groq API key not configured. Use /api/set-api-key.")

    try:
        collection = chroma_client.get_collection(collection_name)
    except Exception:
        raise HTTPException(status_code=400, detail="No data ingested yet. Please upload a file first.")

    t0 = time.time()

    # ── Step 1: Embed query ────────────────────────────────────────
    t_embed_start = time.time()
    query_embedding = embedding_model.encode([req.query])[0].tolist()
    t_embed_end = time.time()

    # ── Step 2: Vector retrieval (top_k) ──────────────────────────
    t_retrieve_start = time.time()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(req.top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )
    t_retrieve_end = time.time()

    retrieved_chunks = []
    for i, doc in enumerate(results["documents"][0]):
        distance = results["distances"][0][i]
        similarity = 1 - distance  # cosine distance → similarity
        retrieved_chunks.append({
            "id": results["ids"][0][i],
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "similarity_score": round(similarity, 4),
            "rank": i + 1,
        })

    # ── Step 3: Re-ranking ────────────────────────────────────────
    t_rerank_start = time.time()
    reranked = rerank_chunks(req.query, [dict(c) for c in retrieved_chunks], req.rerank_top_k)
    t_rerank_end = time.time()

    for i, chunk in enumerate(reranked):
        chunk["reranked_rank"] = i + 1

    # ── Step 4: Build context & prompt ───────────────────────────
    context = "\n\n".join([f"[Chunk {c['reranked_rank']}]\n{c['text']}" for c in reranked])
    system_prompt = """You are an expert QA Engineer and Test Case Specialist assistant.
Your role is to help analyze and generate test cases based on the provided context from a test case repository.
When asked to create new test cases, follow the same structure and format as the existing ones.
Be precise, detailed, and follow software testing best practices."""

    user_prompt = f"""Context from the test case repository:
{context}

User Query: {req.query}

Please provide a comprehensive and helpful response based on the context above.
If creating new test cases, follow the same format and structure as the existing ones."""

    # ── Step 5: LLM generation ────────────────────────────────────
    t_llm_start = time.time()
    llm_response = groq_client.chat.completions.create(
        model=req.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=2048,
    )
    t_llm_end = time.time()
    t_total = time.time() - t0

    answer = llm_response.choices[0].message.content
    usage = llm_response.usage

    return {
        "query": req.query,
        "pipeline": {
            "embed_time_ms": round((t_embed_end - t_embed_start) * 1000, 1),
            "retrieve_time_ms": round((t_retrieve_end - t_retrieve_start) * 1000, 1),
            "rerank_time_ms": round((t_rerank_end - t_rerank_start) * 1000, 1),
            "llm_time_ms": round((t_llm_end - t_llm_start) * 1000, 1),
            "total_time_ms": round(t_total * 1000, 1),
        },
        "retrieval": {
            "top_k_requested": req.top_k,
            "chunks_retrieved": len(retrieved_chunks),
            "chunks_after_rerank": len(reranked),
            "retrieval_strategy": "cosine similarity (ChromaDB HNSW)",
            "rerank_strategy": "cross-encoder cosine similarity",
        },
        "retrieved_chunks": retrieved_chunks,
        "reranked_chunks": reranked,
        "llm": {
            "model": req.groq_model,
            "prompt_tokens": usage.prompt_tokens,
            "completion_tokens": usage.completion_tokens,
            "total_tokens": usage.total_tokens,
        },
        "answer": answer,
    }

@app.get("/api/browse-chunks")
async def browse_chunks(page: int = 1, page_size: int = 20, search: str = ""):
    try:
        collection = chroma_client.get_collection(collection_name)
    except Exception:
        return {"chunks": [], "total": 0, "page": page, "page_size": page_size}
    
    total = collection.count()
    if total == 0:
        return {"chunks": [], "total": 0, "page": page, "page_size": page_size}

    offset = (page - 1) * page_size
    
    if search:
        # Search and paginate
        query_emb = embedding_model.encode([search])[0].tolist()
        results = collection.query(
            query_embeddings=[query_emb],
            n_results=min(100, total),
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            chunks.append({
                "id": results["ids"][0][i],
                "text": doc[:300],
                "metadata": results["metadatas"][0][i],
                "score": round(1 - results["distances"][0][i], 4),
            })
        paginated = chunks[offset: offset + page_size]
        return {"chunks": paginated, "total": len(chunks), "page": page, "page_size": page_size}
    else:
        results = collection.get(
            limit=page_size,
            offset=offset,
            include=["documents", "metadatas"],
        )
        chunks = []
        for i, doc in enumerate(results["documents"]):
            chunks.append({
                "id": results["ids"][i],
                "text": doc[:300],
                "metadata": results["metadatas"][i],
            })
        return {"chunks": chunks, "total": total, "page": page, "page_size": page_size}

# ── Serve frontend ────────────────────────────────────────────────────
FRONTEND_DIR = BASE_DIR / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
async def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))
