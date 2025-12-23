# 🤖 AI Agents & RAG Portfolio

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![Jupyter](https://img.shields.io/badge/Jupyter-Notebooks-orange?style=for-the-badge&logo=jupyter&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-red?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active_Development-green?style=for-the-badge)

Welcome to the **AI Agents & RAG Portfolio**. This repository houses a collection of cutting-edge projects exploring **Autonomous Agents**, **Retrieval-Augmented Generation (RAG)**, and **Multi-Modal AI** systems. 

Here, you'll find implementation references for building intelligent systems capable of complex reasoning, data synthesis, and autonomous research.

---

## 📂 Project Directory

### 1. 📈 Stock Market Research Agent
An autonomous agent designed to conduct in-depth market research.
- **Core Features**: Automated stock analysis, tool-based data retrieval, and structured reporting.
- **Key Files**: `stock_market_agent.py`, `tools.py`
- **Location**: [`/Stock Market Research Agent`](./Stock%20Market%20Research%20Agent)

### 2. 🧠 Agentic RAG
A sophisticated RAG pipeline focused on synthesizing information from complex documents.
- **Core Features**: PDF-to-Markdown conversion, Qdrant vector database integration, and synthesized data generation using LLMs.
- **Key Notebooks**: `RAG_FOR_SYTHENSIZE_PDF_DATA.ipynb`, `pdf_to_markdown.ipynb`
- **Location**: [`/Agentic RAG`](./Agentic%20RAG)

### 3. 👁️ Multi-Modal RAG
Exploring the frontiers of RAG with multi-modal inputs.
- **Core Features**: Processing and indexing complex PDFs (e.g., "Attention Is All You Need") for rich context retrieval.
- **Key Notebooks**: `index.ipynb`
- **Location**: [`/MultiModalRag`](./MultiModalRag)

---

## 🛠️ Tech Stack & Tools

- **Languages**: Python
- **Frameworks & Libraries**:
  - `LangChain` / `LlamaIndex` (Inferred)
  - `Qdrant` (Vector Database)
  - `Jupyter` (Prototyping & Analysis)
- **Environment**: Virtual Environments (`.venv`)

---

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd "AI Agents"
    ```

2.  **Explore a Project**:
    Navigate to any project directory to find specific `requirements.txt` and setup instructions.
    
    *Example for Stock Agent:*
    ```bash
    cd "Stock Market Research Agent"
    source venv/bin/activate  # or create a new one
    pip install -r requirements.txt
    python stock_market_agent.py
    ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](issues) if you want to contribute.

---

<p align="center">
  <i>Built with ❤️ by AI Learner</i>
</p>
