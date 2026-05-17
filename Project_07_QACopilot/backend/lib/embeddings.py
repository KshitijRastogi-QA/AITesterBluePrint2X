"""bge-m3 dual-vector encoder — produces both dense (1024-dim) and sparse lexical vectors."""
from __future__ import annotations
from typing import Any
import logging

logger = logging.getLogger(__name__)

_model = None


def get_model():
    global _model
    if _model is None:
        from .settings import settings
        from FlagEmbedding import BGEM3FlagModel
        logger.info(f"Loading {settings.embed_model} — first run downloads ~2 GB …")
        use_fp16 = settings.embed_device != "cpu"
        _model = BGEM3FlagModel(settings.embed_model, use_fp16=use_fp16)
        logger.info("Embedding model ready.")
    return _model


def encode(texts: list[str], batch_size: int = 16) -> dict[str, Any]:
    """
    Returns:
        dense:  list[list[float]]  — shape (n, 1024)
        sparse: list[dict[int, float]] — lexical weights per text
    """
    model = get_model()
    output = model.encode(
        texts,
        batch_size=batch_size,
        return_dense=True,
        return_sparse=True,
        return_colbert_vecs=False,
    )
    return {
        "dense": output["dense_vecs"].tolist(),
        "sparse": output["lexical_weights"],
    }


def lexical_to_sparse_vec(weights: dict[int, float]) -> tuple[list[int], list[float]]:
    """Convert bge-m3 lexical_weights dict to (indices, values) for Qdrant SparseVector."""
    indices = [int(k) for k in weights.keys()]
    values = [float(v) for v in weights.values()]
    return indices, values
