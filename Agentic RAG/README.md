# Agentic RAG for PDF Synthesis

A specialized Retrieval-Augmented Generation (RAG) system designed to synthesize high-quality insights from PDF documents. This project implements an advanced "Parent-Child" chunking strategy, hybrid search, and agentic workflows using LangGraph and Ollama.

##  Key Features

*   **Intelligent PDF Processing**:
    *   **Adaptive Ingestion**: Categorizes PDFs into *Simple* (text-only) and *Medium/Complex* (scanned, tables, images).
    *   **Tools**: Uses `PyMuPDF4LLM` for fast text extraction and `Docling` for OCR and table structure extraction.
    *   **Structure Preservation**: Converts content to Markdown, preserving headers and logical flow.

*   **Advanced Retrieval Strategy**:
    *   **Parent-Child Chunking**: Use small "child" chunks (~500 chars) for precise vector search, which link back to larger "parent" chunks (2k-10k chars) to provide full context to the LLM.
    *   **Hybrid Search**: Combines **Dense Embeddings** (semantic meaning) and **Sparse Embeddings** (keyword matching/BM25) for optimal retrieval accuracy.
    *   **Reranking**: optimization retrieval results using FlashRank.

*   **Agentic Architecture**:
    *   Built with **LangGraph** to create stateful, multi-step reasoning agents.
    *   Supports local LLM execution via **Ollama**.

## Tech Stack

*   **Frameworks**: [LangChain](https://www.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraph/)
*   **Vector Database**: [Qdrant](https://qdrant.tech/) (Local file-based)
*   **LLM Engine**: [Ollama](https://ollama.com/)
*   **Embeddings**:
    *   Dense: `sentence-transformers/all-mpnet-base-v2` (via HuggingFace)
    *   Sparse: `Qdrant/bm25` (via FastEmbed)
*   **Document Processing**: `PyMuPDF`, `Docling`
*   **UI**: Gradio

##  Project Structure

```bash
Agentic RAG/
├── docs/                      # Input directory for raw PDF files
├── markdown/                  # Intermediate directory for converted Markdown files
├── parent_store/              # JSON storage for large parent chunks (Context)
├── qdrant_db/                 # Persistence directory for the Qdrant vector database
├── pdf_to_markdown.ipynb      # Logic for categorizing and converting PDFs
├── RAG_FOR_SYTHENSIZE_PDF_DATA.ipynb  # Main pipeline: Indexing + Retrieval + Generation
└── requirements.txt           # Python dependencies
```

## Getting Started

### Prerequisites

1.  **Python 3.10+** needed.
2.  **Ollama** installed and running.
    *   Pull the model used in configuration (e.g., `ollama pull gpt-oss:20b-cloud` or update the code to use standard models like `llama3` or `mistral`).

### Installation

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Steps to Run**:
    *   **Step 1: Ingest Data**: Place your PDFs in the `docs/` folder.
    *   **Step 2: Convert to Generic Markdown**: Open and run `pdf_to_markdown.ipynb` to process the PDFs into clean Markdown.
    *   **Step 3: Index & Run RAG**: Open `RAG_FOR_SYTHENSIZE_PDF_DATA.ipynb` to index the data into Qdrant and start the agentic RAG workflow.

##  How It Works (The "Why")

Standard RAG systems often face a trade-off: **Small chunks** are good for search precision but lack context, while **Large chunks** provide context but dilute search accuracy.

This project solves this with a **Parent-Child** approach:
1.  **Search**: We search over small, focused *child chunks* to find the exact location of the answer.
2.  **Retrieve**: Instead of returning the child chunk, we fetch its *parent chunk*—the full section or chapter.
3.  **Generate**: The LLM receives the complete context, reducing hallucinations and improving answer quality.
