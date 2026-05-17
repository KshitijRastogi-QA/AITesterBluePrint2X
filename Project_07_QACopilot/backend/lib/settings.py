from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    qdrant_path: str = "./qdrant_data"
    qdrant_url: str = ""
    qdrant_api_key: str = ""

    embed_model: str = "BAAI/bge-m3"
    rerank_model: str = "BAAI/bge-reranker-v2-m3"
    embed_device: str = "cpu"

    selenium_repo_dir: str = "./data/selenium_repo"
    playwright_repo_dir: str = "./data/playwright_repo"
    testcases_csv: str = "./data/csv/testcases_vwo_100.csv"
    pdfs_dir: str = "./data/pdf"
    jira_md_dir: str = "./data/md"

    top_k_per_collection: int = 12
    rerank_top_k: int = 4
    chunk_size: int = 1000
    chunk_overlap: int = 150
    history_turns: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

COLLECTIONS = [
    "selenium_code",
    "playwright_code",
    "vwo_testcases",
    "vwo_docs",
    "vwo_bugs",
]
