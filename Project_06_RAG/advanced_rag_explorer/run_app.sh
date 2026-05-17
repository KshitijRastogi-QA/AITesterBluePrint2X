#!/bin/bash
cd backend
echo "Starting Advanced RAG Explorer..."
source ../venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
